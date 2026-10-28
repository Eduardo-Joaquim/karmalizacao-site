"""Compile Valdária once into the regional reader and searchable bestiary."""
from pathlib import Path
import json,re,subprocess
from lxml import html as LH, etree as E
from skill_panels import skill_panel
root=Path(__file__).resolve().parents[1]
subprocess.run(['python3', str(root/'scripts/build-elven-gaeria.py')], check=True)
source=(root/'docs/reino-humano-gaeria.md').read_text()
body=source.split('\n',1)[1]
subprocess.run(['python3', str(root/'scripts/compile-region.py'), '--human'], check=True)
compiled=json.loads((root/'.sites-runtime/human-court-generated.json').read_text())
soup=LH.fragment_fromstring(compiled['html'],create_parent='div')
for node in soup.xpath('.//*[@class]'):
 for a,b in [('elven-dossier','realm-dossier'),('elven-vitals-source','realm-vitals'),('elven-attributes-source','realm-attributes'),('elven-ability-source','realm-ability')]:
  if node.get('class')==a:node.set('class',b)
txt=lambda n: ''.join(n.itertext())
render=lambda n:LH.tostring(n,encoding='unicode')
characters=compiled['characterIds']
profiles=[]
for profile in compiled['courtProfiles']:
 p=dict(profile);p['defense']=str(p.pop('ca'))
 p['abilities']=[dict(a,cost=int(a['cost'].split()[0]) if a['cost']!='—' else 0) for a in p['abilities']]
 profiles.append(p)
from regional_fields import field_nodes
# Civil figures retain two editorial parts, without inventing combat powers.
basic_ids=['leonor-ferromonte','mateus-ferromonte','artur-vesperal','naira-vesperal','lidia-vesperal','damiao-cedral','teresa-cedral','rui-salcedo']
fighter_ids=['germano-ferromonte','celina-vesperal','raul-cedral']
for heading in list(soup.findall('h4')):
 if heading.get('id') not in basic_ids+fighter_ids:continue
 article=E.Element('article',{'class':'family-fighter' if heading.get('id') in fighter_ids else 'noble-dossier','aria-labelledby':heading.get('id')})
 heading.addprevious(article);node=heading
 while node is not None:
  nxt=node.getnext()
  if node is not heading and node.tag in ['h2','h3','h4']:break
  article.append(node);node=nxt
 for para in article.findall('p'):
  if txt(para).startswith('Identidade:'):
   raw=re.sub(r'\s+',' ',txt(para)).strip()
   stat=E.Element('dl',{'class':'noble-resource-grid'})
   for label,end in [('Identidade','Vida'),('Vida','Karma'),('Karma','CA'),('CA','Deslocamento'),('Deslocamento','Atributos')]:
    match=re.search(label+r':\s*(.*?)\. '+end+':',raw);assert match
    div=E.SubElement(stat,'div');E.SubElement(div,'dt').text=label;E.SubElement(div,'dd').text=match[1]
   para.addprevious(stat)
   at=E.Element('dl',{'class':'royal-attribute-grid noble-attribute-grid'})
   for chunk in raw.split('Atributos:')[1].strip().rstrip('.').split(' · '):
    label,value=chunk.rsplit(' ',1);div=E.SubElement(at,'div');E.SubElement(div,'dt').text=label;E.SubElement(div,'dd').text=value
   article.replace(para,at)
assert len(soup.xpath('.//article[@class="noble-dossier"]'))==8
assert len(soup.xpath('.//article[@class="family-fighter"]'))==3

# Noble rulers use the same structured dossier as the courts, preserving civilian sheets.
noble_profiles=[]
for article in soup.xpath('.//article[@class="noble-dossier"]'):
 heading=article.find('h4')
 if heading.get('id') not in ['leonor-ferromonte','artur-vesperal']:continue
 name,title=txt(heading).split(' · ',1);headings=article.findall('h5');lore=[];node=headings[0].getnext()
 while node is not None and node is not headings[1]:lore.append(render(node));node=node.getnext()
 vitals={d.find('dt').text:d.find('dd').text for d in article.find('dl')}
 attrs=[dict(name=d.find('dt').text,value=int(d.find('dd').text)) for d in article.findall('dl')[1]]
 facts=[dict(fields=field_nodes(n)) for n in article.findall('p') if n not in [] and n.getprevious() is not headings[0]]
 node=headings[1].getnext();facts=[]
 while node is not None:
  if node.tag=='p':facts.append(dict(fields=field_nodes(node)))
  node=node.getnext()
 noble_profiles.append(dict(id=heading.get('id'),name=name,title=title,loreId=heading.get('id')+'-historia',combatId=heading.get('id')+'-ficha',sheetLabel='Ficha básica',loreHtml=''.join(lore),identity=vitals['Identidade'],life=int(vitals['Vida']),karma=int(vitals['Karma']),ca=int(vitals['CA']),pc=None,movement=vitals['Deslocamento'],attributes=attrs,facts=facts,abilities=[]))

# Skill cards share the royal reader's visual language for all noble figures.
for article in soup.xpath('.//article[@class="noble-dossier"] | .//article[@class="family-fighter"]'):
 for paragraph in list(article.findall('p')):
  if txt(paragraph).startswith('Perícias:'):
   panel=skill_panel(txt(paragraph))
   assert panel is not None
   article.replace(paragraph,panel)

navigation=[]
for heading in soup.xpath('.//h3[@id] | .//h4[@id]'):
 if heading.get('id') in characters+basic_ids+fighter_ids:
  full=re.sub(r'\s+',' ',txt(heading));name,_,title=full.partition(' · ')
  navigation.append(dict(id=heading.get('id'),name=name,title=title))
sections=[]
for heading in soup.findall('h2'):
 nodes=[];node=heading.getnext()
 while node is not None and node.tag!='h2':nodes.append(render(node));node=node.getnext()
 sections.append({'id':heading.get('id'),'title':txt(heading),'html':''.join(nodes)})
ids=soup.xpath('.//@id')
assert len(ids)==len(set(ids))
(root/'data/gaeria-anchors.json').write_text(json.dumps(ids,ensure_ascii=False)+'\n')
articles=soup.xpath('.//article[@class="realm-dossier"]')
assert len(articles)==4
assert [len(a.xpath('.//section[@class="realm-ability"]')) for a in articles]==[7,6,4,5]
assert len(soup.xpath('.//dl[@class="realm-attributes"]//dd'))==24
intro=''.join(render(n) for n in list(soup)[:list(soup).index(soup.find('h2'))])
data=dict(title='Valdária · Reino Humano de Gaéria',slug='reino-humano',url='/mundo/gaeria/reino-humano',introHtml=intro,html=''.join(render(n) for n in soup),sections=sections,characterIds=characters,courtProfiles=profiles,nobleProfiles=noble_profiles,navigation=navigation)
(root/'data/gaeria.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
# Keep exactly five continental/court sections in the bestiary.
regional=re.sub(r'^(#{2,5}) ',lambda m:'#'+m[1]+' ',body,flags=re.M)
regional=regional.replace('{#valdaria}', '{#reino-humano-valdaria}')
elf_source=(root/'docs/reino-elfico-gaeria.md').read_text()
elf_body=elf_source.split('\n',1)[1]
elf_regional=re.sub(r'^(#{2,5}) ',lambda m:'#'+m[1]+' ',elf_body,flags=re.M)
elf_regional=elf_regional.replace('{#elaranth}', '{#reino-elfico-elaranth}')
p=root/'docs/bestiario.md';book=p.read_text()
start=book.index('## 02 · Gaéria {#gaeria}')
end=book.index('## 03 · Thalassia {#thalassia}')
section='''## 02 · Gaéria {#gaeria}

As terras de Gaéria guardam campos, pedreiras, canais, florestas antigas e coroas regionais.

**Monstros locais:** os registros de criaturas permanecem abertos.

**Organizações e nobres:** Casa Ferromonte, Casa Vesperal e Cedro Novo, em Valdária; Casa Solvaldren, em Elaranth.

**Cortes reais:** Heptarchia de Aurival, sob a Rainha Aveline; Corte Nemeton, sob a Rainha Naerith.

[Consultar o Reino Humano de Gaéria](/mundo/gaeria/reino-humano).

[Consultar o Reino Élfico de Gaéria](/mundo/gaeria/reino-elfico).

'''
p.write_text(book[:start]+section+regional+'\n\n'+elf_regional+'\n\n'+book[end:])
print('Gaéria: Valdária e Elaranth integradas ao Bestiário.')
