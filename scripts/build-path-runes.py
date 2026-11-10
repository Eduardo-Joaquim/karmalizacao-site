"""Integrate the Path and rune rules into the compiled book."""
import json
import re
import subprocess
from pathlib import Path
from lxml import html

root = Path(__file__).resolve().parents[1]
book_path = root / 'data/rules.json'
book = json.loads(book_path.read_text())

def load(name):
    return json.loads((root / 'data' / name).read_text())

def render(source):
    return subprocess.check_output(['pandoc', '-f', 'markdown', '-t', 'html5', '--wrap=none'], input=source, text=True)

def write_section(number, start, content, stop=None):
    chapter = next(c for c in book['chapters'] if c['number'] == number)
    tree = html.fragment_fromstring(chapter['html'], create_parent='div')
    nodes = list(tree)
    first = next((i for i, node in enumerate(nodes) if node.get('id') == start), len(nodes))
    last = next((i for i in range(first + 1, len(nodes)) if nodes[i].get('id') == stop), len(nodes)) if stop else len(nodes)
    for node in nodes[first:last]:
        tree.remove(node)
    for offset, node in enumerate(html.fragments_fromstring(content)):
        tree.insert(first + offset, node)
    chapter['html'] = ''.join(html.tostring(node, encoding='unicode') for node in tree)
    chapter['searchableText'] = re.sub(r'\s+', ' ', tree.text_content()).strip()
    chapter['wordCount'] = len(chapter['searchableText'].split())
    chapter['sections'] = []
    for node in tree:
        if node.tag not in ('h2', 'h3', 'h4') or not node.get('id'):
            continue
        parts = [node.text_content()]
        for sibling in node.itersiblings():
            if sibling.tag in ('h2', 'h3', 'h4') and sibling.tag <= node.tag:
                break
            parts.append(sibling.text_content())
        chapter['sections'].append(dict(id=node.get('id'), title=node.text_content(), level=int(node.tag[1]), searchableText=re.sub(r'\s+', ' ', ' '.join(parts))))

axioms = load('path-axioms.json')
path = (root / 'docs/caminho-pessoal.md').read_text()
path += '\n| Axioma | Arquétipo | Benefício |\n|---|---|---|\n'
path += '\n'.join(f"| {a['name']} | {a['focus']} | {a['effect']} |" for a in axioms)
# Keep the advanced manifestations, examples and limits of existing Paths.
write_section(11, 'o-caminho', render(path), 'registro-da-lei-pessoal')

runes = load('karmic-runes.json')
source = (root / 'docs/runas-karmicas.md').read_text()
for category in dict.fromkeys(r['category'] for r in runes):
    source += f'\n\n### {category}\n\n| Runa | Grau | Karma Retido | Enquanto armada | Estouro |\n|---|---|---|---|---|\n'
    source += '\n'.join(f"| {r['name']} | {r['grade']} | {r['retained']} | {r['passive']} | {r['burst']} |" for r in runes if r['category'] == category)
write_section(9, 'runas-karmicas', render(source))

registry_title = "Registros de Linhagens Soberanas e Portadores Únicos"
blessings = f"## {registry_title} {{#bencaos-exclusivas}}\n\n"
blessings += '<p><span class="blessing-exclusive-seal">[EXCLUSIVA DE LINHAGEM / BESTIÁRIO — INDISPONÍVEL PARA PLAYERS]</span></p>\n\n'
blessings += (
    "Bênçãos hereditárias passam exclusivamente pelo sangue dinástico da família ou casa registrada. "
    "Uma Bênção única corresponde a um fragmento indivisível e tem um só portador por vez. "
    "As outorgas destes registros pertencem às linhagens e aos personagens do Bestiário.\n\n"
    "Na criação de ficha, escolha uma das 243 outorgas abertas ou crie uma Bênção autoral com nome e funcionamento próprios. "
    "A regra de exclusividade vale também para o uso em combate.\n\n"
)
owners_by_grant = {}
for entry in load('bestiary-blessing-index.json'):
    owners_by_grant.setdefault((entry['name'], entry['categoriaAcesso']), []).append(entry['portadorOuLinhagemExclusiva'])
blessings += "| Bênção reservada | Acesso | Portador ou linhagem |\n|---|---|---|\n"
for (name, category), owners in owners_by_grant.items():
    access = "Hereditária" if category == "hereditaria_linhagem" else "Única"
    blessings += f"| {name} | {access} | {', '.join(dict.fromkeys(owners))} |\n"
blessings += "\n## Portal das Nove Asas {#portal-das-nove-asas}\n\n"
blessings += "Fortitude usa Constituição + Atletismo. Vontade usa Espírito + Canalização de Karma. Se a extensão pedir resistência sem CD, use oposição contra a Manifestação da Bênção, com empate a favor do defensor.\n\n"
for pantheon in load('pantheon-blessings.json'):
    blessings += f"### {pantheon['wing']} · Panteão {pantheon['name']}\n\n"
    for deity in pantheon['deities']:
        blessings += f"#### {deity['name']} · {deity['epithet']}\n\n"
        for grant in deity['blessings']:
            if grant.get('categoriaAcesso') != 'catalogo_player' or grant.get('disponivelParaPlayer') is not True:
                continue
            blessings += f"**{grant['id']}. {grant['title']}** · {grant['facet']} · {grant['nature']}\n\n"
            blessings += f"**Fenômeno base.** {grant['phenomenon']}\n\n"
            blessings += '\n'.join(f'{i}. {extension}' for i, extension in enumerate(grant['extensions'], 1)) + '\n\n'
            blessings += f"**Safra na Morte.** {grant['harvest']}\n\n"
chapter13 = next(chapter for chapter in book['chapters'] if chapter['number'] == 13)
start_id = 'bencaos-exclusivas' if 'id="bencaos-exclusivas"' in chapter13['html'] else 'portal-das-nove-asas'
write_section(13, start_id, render(blessings))

# The plain-text manuscript and online reader use the same authored blocks.
manual_path = root / 'docs/regras.md'
manual = manual_path.read_text()
for number, start, body, stop in [(9,'Runas Kármicas',source,None),(11,'O Caminho',path,'Registro da Lei pessoal'),(13,rf'(?:{registry_title}|Portal das Nove Asas)',blessings,None)]:
    header = re.search(rf'^# Capítulo {number} .*$', manual, re.M)
    next_header = re.search(r'^# Capítulo \d+ ', manual[header.end():], re.M)
    end = header.end() + next_header.start() if next_header else len(manual)
    chapter = manual[header.end():end]
    start_match = re.search(rf'^## {start}(?: |$).*$', chapter, re.M)
    first = start_match.start() if start_match else len(chapter)
    last = chapter.index('### ' + stop, first) if stop else len(chapter)
    manual = manual[:header.end()] + chapter[:first].rstrip() + '\n\n' + body.strip() + '\n\n' + chapter[last:] + manual[end:]
manual_path.write_text(manual)
book_path.write_text(json.dumps(book, ensure_ascii=False, indent=2) + '\n')
