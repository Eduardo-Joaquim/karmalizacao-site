"""Compile the authored bestiary into the book's searchable chapter format."""
from pathlib import Path
import json
import re
import subprocess
from html import unescape

root = Path(__file__).resolve().parents[1]
subprocess.run(['python3', str(root / 'scripts/build-geppeto-summons.py')], check=True)
subprocess.run(['python3', str(root / 'scripts/build-gaeria.py')], check=True)
subprocess.run(['python3', str(root / 'scripts/build-vampire-ignaria.py')], check=True)
subprocess.run(['python3', str(root / 'scripts/build-aeria.py')], check=True)
subprocess.run(['python3', str(root / 'scripts/build-early-threats.py')], check=True)
source = (root / 'docs/bestiario.md').read_text()
body = source.split('\n', 1)[1]
html = subprocess.check_output(['pandoc', '-f', 'markdown', '-t', 'html5'], input=body, text=True)
def plain(value):
    return re.sub(r'\s+', ' ', unescape(re.sub(r'<[^>]*>', ' ', value))).strip()
headings = list(re.finditer(r'<h([234]) id="([^"]+)">(.*?)</h\1>', html, re.S))
sections = []
for i, heading in enumerate(headings):
    end = headings[i + 1].start() if i + 1 < len(headings) else len(html)
    sections.append(dict(level=int(heading[1]), id=heading[2], title=plain(heading[3]), searchableText=plain(html[heading.end():end])))
ids = re.findall(r' id="([^"]+)"', html)
assert len(ids) == len(set(ids)), 'Duplicate anchors'
assert all(anchor in ids for anchor in re.findall(r'href="#([^"]+)"', html)), 'Broken internal link'
assert len([s for s in sections if s['level'] == 2]) == 6
chapter = dict(number=21, title='Capítulo 21 — Bestiário', shortTitle='Bestiário', slug='21-bestiario', description='Quatro continentes, os reinos de Valdária, Elaranth e Sárkora e as cortes da Santa e da Falsa Santa.', wordCount=len(plain(html).split()), sections=sections, overviewText=plain(html[:headings[0].start()]), searchableText=plain(html), html=html)
(root / 'data/bestiary.json').write_text(json.dumps(chapter, ensure_ascii=False, indent=2) + '\n')
print(f'Bestiário: {len(sections)} entradas indexadas; seis seções; links internos válidos.')
subprocess.run(['python3', str(root / 'scripts/build-court-sheets.py')], check=True)
