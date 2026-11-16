import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const fixture = String.raw`
from collections import Counter
from copy import deepcopy
from hashlib import sha256
import json
from pathlib import Path
import subprocess
from unittest.mock import patch
from urllib.parse import urlsplit

from lxml import html
from book209 import elemental
from book207.build import index_chapter
from editorial_separators import normalize_chapter

book = json.loads(Path('data/rules.json').read_text())
catalog = json.loads(Path('data/elemental-runes.json').read_text())
test_catalog = deepcopy(catalog)
test_catalog['parameters'] = {
    'inscriptionAction': 'AÇÃO FICTÍCIA EXCLUSIVA DE TESTE',
    'karmaCost': 7,
    'duration': 'DURAÇÃO FICTÍCIA EXCLUSIVA DE TESTE',
    'maxActiveZones': 2,
}
sections = {
    9: 'tres-sistemas-de-inscricao',
    10: 'zonas-de-inscricao-elemental',
    12: 'runas-elementais-ambientais',
}

def chapter(number):
    return next(entry for entry in book['chapters'] if entry['number'] == number)

def tree(number):
    return html.fragment_fromstring(chapter(number)['html'], create_parent='div')

def section(number):
    found = tree(number).xpath('.//section[h2[@id=$key]]', key=sections[number])
    assert len(found) == 1, (number, len(found))
    return found[0]

def normalize_and_index():
    for number in sections:
        normalize_chapter(chapter(number))
        index_chapter(chapter(number))

def source_fingerprints():
    return {
        name: sha256(Path(name).read_bytes()).hexdigest()
        for name in ('data/rules.json', 'docs/regras.md',
                     'data/elemental-runes.json', 'docs/runas-elementais.md')
    }
`;

function runPython(source) {
  const result = spawnSync("python3", ["-c", fixture + source], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: {
      ...process.env,
      PYTHONPATH: "scripts",
      PYTHONDONTWRITEBYTECODE: "1",
    },
  });
  assert.equal(
    result.status,
    0,
    result.error?.message || result.stderr || result.stdout,
  );
}

test("livro ambiental publica exatamente as 24 inscrições do catálogo compartilhado", () => {
  runPython(String.raw`
before = source_fingerprints()
with patch.object(elemental, '_catalog', return_value=test_catalog):
    elemental.apply(book)
normalize_and_index()
tables = section(12).xpath('.//table')
assert [len(table.xpath('.//tbody/tr')) for table in tables[:2]] == [6, 18]
rows = [row for table in tables[:2] for row in table.xpath('.//tbody/tr')]
assert [int(row.xpath('./td')[0].text_content()) for row in rows] == list(range(1, 25))
assert [row.xpath('./td')[1].text_content() for row in rows] == [
    rune['name'] for rune in sorted(catalog['runes'], key=lambda rune: rune['number'])
]
assert 'AÇÃO FICTÍCIA EXCLUSIVA DE TESTE' in section(12).text_content()
assert '<!-- elemental:' not in chapter(12)['html']
for rune in catalog['runes']:
    assert rune['name'] in chapter(12)['searchableText']
assert source_fingerprints() == before, 'In-memory compilation wrote a manuscript or catalog'
`);
});

test("reaplicar após indexação ou round-trip do manuscrito mantém conteúdo e IDs únicos", () => {
  runPython(String.raw`
with patch.object(elemental, '_catalog', return_value=test_catalog):
    elemental.apply(book)
    normalize_and_index()
    first = deepcopy(book)
    elemental.apply(book)
    normalize_and_index()
    assert book == first, 'Repeating the final compiler duplicated or changed content'
    for number in sections:
        entry = chapter(number)
        markdown = subprocess.check_output(
            ['pandoc', '-f', 'html', '-t', 'gfm', '--wrap=none'],
            input=entry['html'], text=True,
        )
        entry['html'] = subprocess.check_output(
            ['pandoc', '-f', 'gfm', '-t', 'html5', '--wrap=none'],
            input=markdown, text=True,
        )
    elemental.apply(book)
normalize_and_index()
for number, identifier in sections.items():
    element_ids = tree(number).xpath('//@id')
    assert len(element_ids) == len(set(element_ids)), (number, Counter(element_ids))
    indexed_ids = [entry['id'] for entry in chapter(number)['sections']]
    assert indexed_ids.count(identifier) == 1
    assert len(indexed_ids) == len(set(indexed_ids)), (number, indexed_ids)
    assert len(section(number).xpath('.//h2')) == 1
assert [len(table.xpath('.//tbody/tr')) for table in section(12).xpath('.//table')[:2]] == [6, 18]
assert 'DURAÇÃO FICTÍCIA EXCLUSIVA DE TESTE' in chapter(12)['searchableText']
`);
});

test("ligações dos capítulos 9, 10 e 12 chegam a capítulos e âncoras existentes", () => {
  runPython(String.raw`
with patch.object(elemental, '_catalog', return_value=test_catalog):
    elemental.apply(book)
normalize_and_index()
chapters_by_slug = {entry['slug']: entry for entry in book['chapters']}
for number in sections:
    links = section(number).xpath('.//a/@href')
    assert links, f'Chapter {number} has no cross-reference'
    for link in links:
        parsed = urlsplit(link)
        assert not parsed.scheme and parsed.path.startswith('/regras/'), link
        target = chapters_by_slug.get(parsed.path.removeprefix('/regras/'))
        assert target is not None, link
        target_tree = html.fragment_fromstring(target['html'], create_parent='div')
        assert len(target_tree.xpath('//*[@id=$key]', key=parsed.fragment)) == 1, link
`);
});

test("cada parâmetro autoral ausente bloqueia a compilação sem alterar livro ou arquivos", () => {
  runPython(String.raw`
before = source_fingerprints()
original = deepcopy(book)
real_catalog_reader = elemental._catalog
for key in ('inscriptionAction', 'karmaCost', 'duration', 'maxActiveZones'):
    incomplete = deepcopy(test_catalog)
    incomplete['parameters'][key] = None
    with patch.object(elemental, '_catalog', return_value=incomplete):
        try:
            elemental.apply(book)
        except ValueError as error:
            assert key in str(error), str(error)
        else:
            raise AssertionError(f'Missing authorial parameter {key} did not stop compilation')
    assert elemental._catalog is real_catalog_reader, 'Temporary catalog was not restored'
    assert book == original, f'Missing {key} partially changed the book'
assert source_fingerprints() == before, 'Rejected compilation modified source files'
assert elemental._catalog() == catalog, 'The on-disk catalog was changed by the temporary mock'
`);
});

test("fechamento público usa parâmetros reais, limita pulsos e conserva o catálogo geral", () => {
  runPython(String.raw`
before = source_fingerprints()
general = Path('data/elemental-taxonomy.json').read_bytes()
elemental.apply(book)
normalize_and_index()
text = section(12).text_content()
assert 'Ação Principal' in text and '6 Karma' in text
assert 'início do terceiro turno seguinte' in text
assert 'sem um quarto pulso' in text
assert 'tentar e falhar preserva' in text
assert 'incluindo aliados e o portador' in text
assert 'não substituem a tabela geral de Subdobras' in text
assert 'DURAÇÃO FICTÍCIA' not in text and 'AÇÃO FICTÍCIA' not in text
assert 'Peso gravitacional' in section(10).text_content()
assert Path('data/elemental-taxonomy.json').read_bytes() == general
assert source_fingerprints() == before
`);
});
