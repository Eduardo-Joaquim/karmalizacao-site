from pathlib import Path
import json, re, subprocess
from lxml import html

root = Path(__file__).resolve().parents[1]
book = json.loads((root / 'data/rules.json').read_text())
chapter = next(c for c in book['chapters'] if c['number'] == 2)
source = (root / 'docs/porte.md').read_text()
rendered = subprocess.check_output(['pandoc', '-f', 'markdown', '-t', 'html5', '--wrap=none'], input=source, text=True)
chapter['html'], count = re.subn(r'<h2 id="tamanho-altura-e-equilíbrio">.*?(?=<h2|\Z)', lambda _: rendered, chapter['html'], flags=re.S)
assert count == 1
tree = html.fragment_fromstring(chapter['html'], create_parent='div')
chapter['searchableText'] = re.sub(r'\s+', ' ', tree.text_content()).strip()
chapter['wordCount'] = len(chapter['searchableText'].split())
for section in chapter['sections']:
    if section['id'] == 'tamanho-altura-e-equilíbrio':
        section['searchableText'] = re.sub(r'\s+', ' ', html.fragment_fromstring(rendered, create_parent='div').text_content()).strip()
(root / 'data/rules.json').write_text(json.dumps(book, ensure_ascii=False, indent=2) + '\n')
print('Porte: fronteiras, exemplos e busca sincronizados.')
