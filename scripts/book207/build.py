"""Apply the final authorial 2.0.7 revision after specialized source compilers.

Each module owns a bounded chapter/domain transformation. Indexes and the
downloadable manuscript are rebuilt from the very same final HTML.
"""
from pathlib import Path
import importlib
import json
import re
import subprocess
from lxml import html

ROOT = Path(__file__).resolve().parents[2]
MODULES = ('fundamentos', 'classes_runas', 'espiritual', 'economia', 'elementos', 'combate')


def index_chapter(item):
    tree = html.fragment_fromstring(item['html'], create_parent='div')
    text = re.sub(r'\s+', ' ', tree.text_content()).strip()
    item['searchableText'] = text
    item['wordCount'] = len(text.split())
    headings = tree.xpath('.//h2|.//h3|.//h4')
    ordered = list(tree.iter())
    positions = {node: i for i, node in enumerate(ordered)}
    item['sections'] = []
    for heading in headings:
        start = positions[heading]
        level = int(heading.tag[1])
        end = next((positions[n] for n in headings if positions[n] > start and int(n.tag[1]) <= level), len(ordered))
        # Text once per text node, in document order, including nested sections.
        texts = []
        for node in ordered[start:end]:
            if isinstance(node.tag, str) and node.text:
                texts.append(node.text)
            if isinstance(node.tag, str) and node.tail:
                texts.append(node.tail)
        item['sections'].append({'id': heading.get('id'), 'title': heading.text_content(), 'level': level, 'searchableText': re.sub(r'\s+', ' ', ' '.join(texts)).strip()})


def main():
    path = ROOT / 'data/rules.json'
    book = json.loads(path.read_text())
    for name in MODULES:
        importlib.import_module('book206.' + name).apply(book)
    importlib.import_module('book207.cursed').apply(book)
    for item in book['chapters']:
        index_chapter(item)
    path.write_text(json.dumps(book, ensure_ascii=False, indent=2) + '\n')
    manuscript = []
    for item in book['chapters']:
        if item['number'] > 20:
            continue
        content = subprocess.check_output(['pandoc', '-f', 'html', '-t', 'gfm', '--wrap=none'], input=re.sub(r'<!--.*?-->', '', item['html'], flags=re.S), text=True)
        manuscript.append('# ' + item['title'] + '\n\n' + content)
    (ROOT / 'docs/regras.md').write_text('\n\n'.join(manuscript))
    print('Livro 2.0.7: decisões autorais, índices e manuscrito sincronizados.')


if __name__ == '__main__':
    main()
