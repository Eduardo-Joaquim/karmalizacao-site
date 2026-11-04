from pathlib import Path
import json,re,subprocess
from lxml import html
root=Path(__file__).resolve().parents[1]
def read(name):return json.loads((root/name).read_text())
def write(name,data):(root/name).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
def render(md):return subprocess.check_output(['pandoc','-f','markdown','-t','html5','--wrap=none'],input=md,text=True)
def index(c):
 t=html.fragment_fromstring(c['html'],create_parent='div');c['searchableText']=re.sub(r'\s+',' ',t.text_content());c['wordCount']=len(c['searchableText'].split());c['sections']=[]
 for n in t.xpath('.//h2|.//h3|.//h4'):
  c['sections'].append({'id':n.get('id'),'title':n.text_content(),'level':int(n.tag[1]),'searchableText':n.text_content()+' '+' '.join(x.text_content() for x in n.itersiblings() if x.tag=='p')})
races=read('data/racial-progression.json');rules=read('data/character-rules.json');rules['races']=races;write('data/character-rules.json',rules);write('data/race-book.json',races)
md='## Herança e os três marcos raciais\n\nO Traço Base é recebido na criação. As evoluções raciais chegam somente nas Etapas II, IV e VI. Na Etapa I o traço-base já está disponível; III, V e VII não concedem outra evolução racial. Raça não é classe, jurisdição ou alinhamento moral.\n\n'
for name,race in races.items():
 md+='### '+name+'\n\n'+race['summary']+'.\n\n'
 for f in race['features']:md+='#### '+f['name']+' · Etapa '+f['stage']+'\n\n'+f['description']+'\n\n'
(root/'docs/racas.md').write_text(md)
b=read('data/rules.json');c=next(c for c in b['chapters'] if c['number']==5);prefix=(root/'docs/origens-base.html').read_text();suffix=(root/'docs/linhagens-adicionais.html').read_text();c['html']=prefix+render(md)+suffix;index(c)
c=next(c for c in b['chapters'] if c['number']==2);c['html']=re.sub(r'<p data-racial-milestones>.*?</p>','',c['html'],flags=re.S);c['html']+='<p data-racial-milestones>Herança racial: Traço Base na criação; três marcos de evolução nas Etapas II, IV e VI. Consulte as nove linhagens no Capítulo 5.</p>';index(c)
c=next(c for c in b['chapters'] if c['number']==10);c['html']=re.sub(r'<section data-matrices="2">.*?</section>','',c['html'],flags=re.S);c['html']='<section data-matrices="2">'+render((root/'docs/matrizes-tecnicas.md').read_text())+'</section>'+c['html'];index(c)
# Remove the obsolete single offensive progression from the original table.
for chapter in b['chapters']:
 if chapter['number']==10:
  tree=html.fragment_fromstring(chapter['html'],create_parent='div')
  for table in tree.xpath('.//table'):
   head=' '.join(table.xpath('.//tr[1]//text()')).lower()
   if 'custo-base' in head and 'dano-base' in head:
    for row in table.xpath('.//tr')[1:]:
     cells=row.xpath('./td|./th')
     if len(cells)>=4:cells[3].text='Conforme matriz na tabela oficial'
  chapter['html']=''.join(html.tostring(n,encoding='unicode') for n in tree);index(chapter)
write('data/rules.json',b)
# Export the canonical rules manuscript, excluding the site-only Bestiary.
(root/'docs/regras.md').write_text('\n\n'.join('# '+c['title']+'\n\n'+subprocess.check_output(['pandoc','-f','html','-t','gfm','--wrap=none'],input=c['html'],text=True) for c in b['chapters'] if c['number']<=20))
print('Patch 2.0: regras, nove linhagens e cinco matrizes compiladas.')

from matrix_rules import profile,adapt_damage
constructions=read('data/technique-construction.json')
for file in ['gaeria','elven-gaeria','vampire-ignaria','demon-ignaria','ghoul-ignaria','lunaviel-ignaria','demi-aeria','nidavellir']:
 data=read('data/'+file+'.json')
 for collection in ['courtProfiles','nobleProfiles']:
  for character in data.get(collection,[]):
   for art in character.get('abilities',[]):
    meta=profile(art.get('source',''),art.get('grade','I'));art.update(meta)
    for f in art.get('fields',[]):f['html']=adapt_damage(f['html'],art.get('grade',''),meta['matrix'])
    for item in constructions:
     if item['owner']==character['id'] and item['name']==art['name']:item.update(meta)
 write('data/'+file+'.json',data)
for file in ['court-sheets','geppeto-summons']:
 data=read('data/'+file+'.json')
 for character in data:
  for art in character.get('blocks',[]):
   entry=next((x for x in constructions if x['owner']==character.get('slug') and x['name']==art['title']),None)
   if not entry:continue
   fields=' '.join(x['html'] for x in art.get('fields',[]));source=read('data/court-matrices.json').get(character.get('slug'),{}).get(art['title'],'Kármico');meta=profile(source,entry['grade']);art.update(meta);entry.update(meta)
   for f in art.get('fields',[]):f['html']=adapt_damage(f['html'],entry['grade'],meta['matrix'])
   art['fields']=[f for f in art.get('fields',[]) if f['label']!='Matriz e dano universal']+[{'label':'Matriz e dano universal','html':meta['matrix']+' · '+meta['damageType']+'. Base ofensiva: '+meta['baseDamage']+'. Riscos e ampliações conforme o Capítulo 10.'}]
 write('data/'+file+'.json',data)
for item in constructions:
 if 'matrix' not in item:item.update(profile(item.get('source',item['name']),item['grade']))
write('data/technique-construction.json',constructions)
threats=read('data/early-threats.json')
for c in threats:
 t=c['technique'];meta=profile(t['source'],t['grade']);t.update(meta);t['effect']=adapt_damage(t['effect'],t['grade'],meta['matrix'])
write('data/early-threats.json',threats)
