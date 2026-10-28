"""Compile Valdária once into the regional reader and searchable bestiary."""
from pathlib import Path
import json,re,subprocess
from lxml import html as LH, etree as E
from skill_panels import skill_panel
root=Path(__file__).resolve().parents[1]
subprocess.run(['python3', str(root/'scripts/build-elven-gaeria.py')], check=True)
source=(root/'docs/reino-humano-gaeria.md').read_text()
body=source.split('\n',1)[1]
html=subprocess.check_output(['pandoc','-f','markdown','-t','html5'],input=body,text=True)
soup=LH.fragment_fromstring(html,create_parent='div')
txt=lambda n: ''.join(n.itertext())
render=lambda n:LH.tostring(n,encoding='unicode')
characters=['rainha-aveline','princesa-isadora','princesa-brigida','conselheiro-tomas']
for heading in list(soup.findall('h3')):
 if heading.get('id') not in characters:continue
 article=E.Element('article',{'class':'realm-dossier','aria-labelledby':heading.get('id')})
 heading.addprevious(article);node=heading
 while node is not None:
  nxt=node.getnext()
  if node is not heading and node.tag in ['h2','h3']:break
  article.append(node);node=nxt
 stats=next((p for p in article.findall('p') if txt(p).startswith('Identidade:')),None)
 assert stats is not None
 text=re.sub(r'\s+',' ',txt(stats)).strip()
 def capture(label,end):
  match=re.search(label+r':\s*(.*?)'+end,text)
  assert match,(label,text)
  return match[1]
 values=[('Identidade',capture('Identidade',r'\. Vida:')),('Vida',capture('Vida',r'\. Karma:')),('Karma',capture('Karma',r'\. CA:')),('CA e acertos',capture('CA',r'\. Deslocamento:')),('Deslocamento',capture('Deslocamento',r'\. Atributos:'))]
 dl=E.Element('dl',{'class':'realm-vitals'})
 for label,value in values:
  div=E.SubElement(dl,'div');E.SubElement(div,'dt').text=label;E.SubElement(div,'dd').text=value
 stats.addprevious(dl)
 attrs=E.Element('dl',{'class':'realm-attributes'})
 for chunk in text.split('Atributos:')[1].strip().rstrip('.').split(' · '):
  label,value=chunk.rsplit(' ',1);div=E.SubElement(attrs,'div');E.SubElement(div,'dt').text=label;E.SubElement(div,'dd').text=value
 article.replace(stats,attrs)
 for ability in list(article.findall('h5')):
  card=E.Element('section',{'class':'realm-ability'})
  ability.addprevious(card);node=ability
  while node is not None:
   nxt=node.getnext()
   if node is not ability:
    if node.tag in ['h2','h3','h4','h5']:break
    if node.tag=='p' and txt(node).startswith(('Condução','Recompensa')):break
   card.append(node);node=nxt
articles=soup.xpath('.//article[@class="realm-dossier"]')
# Expose the same authored words as structured dossiers for the royal reader.
profiles=[]
def field_nodes(paragraph):
 fields=[];label='';parts=[]
 if paragraph.text:parts.append(paragraph.text)
 for child in paragraph:
  if child.tag=='strong':
   if parts:fields.append(dict(label=label,html=''.join(parts)))
   label=txt(child).rstrip(':');parts=[child.tail or '']
  else:parts.append(LH.tostring(child,encoding='unicode',with_tail=True))
 if parts:fields.append(dict(label=label,html=''.join(parts)))
 return fields
for article in articles:
 heading=article.find('h3');name,title=txt(heading).split(' · ',1)
 h4s=article.findall('h4');lore=[];node=h4s[0].getnext()
 while node is not None and node is not h4s[1]:lore.append(render(node));node=node.getnext()
 vitals={d.find('dt').text:d.find('dd').text for d in article.find('dl')}
 attrs=[dict(name=d.find('dt').text,value=int(d.find('dd').text)) for d in article.findall('dl')[1]]
 facts=[];abilities=[];node=h4s[1].getnext()
 while node is not None:
  if node.tag=='p':facts.append(dict(fields=field_nodes(node)))
  if node.tag=='section':
   ah=node.find('h5');text=txt(node);cost=re.search(r'(\d+)\s+Karma',text)
   grade=re.search(r'\b(V|IV|III|II|I)\b',txt(node.find('p')))
   action='Reação' if re.search(r'Uso:(?:\s|\xa0)*(?:uma )?Reação',text) else 'Movimento' if re.search(r'Uso:(?:\s|\xa0)*Movimento',text) else 'Principal'
   abilities.append(dict(id=ah.get('id'),name=re.sub(r'\s+',' ',re.sub(r'^\d+ · ','',txt(ah))),cost=int(cost[1]) if cost else 0,grade=grade[1] if grade else '',action=action,fields=[f for para in node.findall('p') for f in field_nodes(para)]))
  node=node.getnext()
 profiles.append(dict(id=heading.get('id'),name=name,title=title,loreId=h4s[0].get('id'),combatId=h4s[1].get('id'),loreHtml=''.join(lore),identity=vitals['Identidade'],life=int(vitals['Vida']),karma=int(vitals['Karma']),defense=vitals['CA e acertos'],movement=vitals['Deslocamento'],attributes=attrs,facts=facts,abilities=abilities))
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
