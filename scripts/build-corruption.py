"""Add the authored transformation without editing the retained chapter text."""
from pathlib import Path
import json,re,subprocess
from lxml import html
root=Path(__file__).resolve().parents[1]
book=json.loads((root/'data/rules.json').read_text());chapter=next(c for c in book['chapters'] if c['number']==14)
base=(root/'docs/corrupcao-marca-base.html').read_text();addition=subprocess.check_output(['pandoc','-f','markdown','-t','html5','--wrap=none'],input=(root/'docs/transformacao-corrompida.md').read_text(),text=True)
match=re.search(r'<h2[^>]*>Ruptura</h2>',base);assert match
chapter['html']=base[:match.start()]+addition+base[match.start():]
tree=html.fragment_fromstring(chapter['html'],create_parent='div')
chapter['searchableText']=re.sub(r'\s+',' ',tree.text_content()).strip();chapter['wordCount']=len(chapter['searchableText'].split())
chapter['sections']=[]
for n in tree:
 if n.tag not in ['h2','h3','h4']:continue
  # All text until the next peer heading belongs to search for this section.
 following=list(n.itersiblings());end=next((i for i,v in enumerate(following) if v.tag in ['h2','h3','h4'] and int(v.tag[1])<=int(n.tag[1])),len(following))
 chapter['sections'].append({'id':n.get('id'),'title':n.text_content(),'level':int(n.tag[1]),'searchableText':re.sub(r'\s+',' ',' '.join(v.text_content() for v in [n,*following[:end]]))})
assert chapter['html'].replace(addition,'',1)==base
assert chapter['html'].count('id="transformação-corrompida"')==1
(root/'data/rules.json').write_text(json.dumps(book,ensure_ascii=False,indent=2)+'\n')
print('Capítulo 14 preservado integralmente; Transformação inserida antes da Ruptura.')
