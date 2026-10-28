"""Compile the equipment manuscripts and their shared inventory catalog."""
from pathlib import Path
import json,re,subprocess
from lxml import html
root=Path(__file__).resolve().parents[1]
source=(root/'docs/equipamentos-tecnologia.md').read_text()
book=json.loads((root/'data/rules.json').read_text())
for number,body in [(17,source.split('# Capítulo 20')[0]),(20,'# Capítulo 20'+source.split('# Capítulo 20',1)[1])]:
    rendered=subprocess.check_output(['pandoc','-f','markdown','-t','html5','--wrap=none'],input=body,text=True)
    tree=html.fragment_fromstring(rendered,create_parent='div');title=tree.find('h1');tree.remove(title)
    chapter=next(c for c in book['chapters'] if c['number']==number)
    chapter['title']=re.sub(r'\s+',' ',title.text_content()).strip();chapter['shortTitle']=re.sub(r'^Capítulo\s+\d+\s*[—:.-]?\s*','',chapter['title'])
    chapter['html']=''.join(html.tostring(n,encoding='unicode') for n in tree)
    chapter['searchableText']=re.sub(r'\s+',' ',tree.text_content()).strip();chapter['wordCount']=len(chapter['searchableText'].split())
    chapter['overviewText']=' '.join(n.text_content() for n in list(tree)[:next((i for i,n in enumerate(tree) if n.tag in ['h2','h3']),len(tree))])
    chapter['sections']=[{'level':int(n.tag[1]),'id':n.get('id'),'title':n.text_content(),'searchableText': ' '.join(v.text_content() for v in [n,*list(n.itersiblings())[:next((i for i,v in enumerate(n.itersiblings()) if v.tag in ['h2','h3']),len(list(n.itersiblings())))]] )} for n in tree if n.tag in ['h2','h3']]
(root/'data/rules.json').write_text(json.dumps(book,ensure_ascii=False,indent=2)+'\n')
mechanics=json.loads((root/'data/equipment-mechanics.json').read_text())
catalog=[];seen=set()
def slug(s):
    import unicodedata
    return re.sub(r'[^a-z0-9]+','-',unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower()).strip('-')
for match in re.finditer(r'((?:^\|.*\n)+)',source,re.M):
    lines=match[0].strip().splitlines();rows=[[c.strip() for c in l.strip('|').split('|')] for l in lines]
    if len(rows)<3 or not any('Carga' in c for c in rows[0]):continue
    headers=rows[0]
    if not any('Preço' in c or 'preço' in c for c in headers):continue
    for row in rows[2:]:
        if len(row)!=len(headers):continue
        fields=dict(zip(headers,row));load=next(v for k,v in fields.items() if 'Carga' in k)
        num=re.match(r'\+?([\d.,]+)(?:/(\d+))?',load)
        if not num:continue
        spaces=float(num[1].replace('.','').replace(',','.'))/(int(num[2]) if num[2] else 1)
        tag=re.fullmatch(r'<span data-item="([a-z0-9-]+)">(.+)</span>',row[0])
        assert tag, f'Item sem identificador estável: {row[0]}'
        key,name=tag.groups();assert key in mechanics, f'Mecânica não registrada: {key}'
        spec=mechanics[key]
        duplicate=next((i for i,e in enumerate(catalog) if e["id"]==key),None)
        if key in seen and headers[0]!="Nome do Item":continue
        if duplicate is not None:catalog.pop(duplicate)
        seen.add(key)
        assert abs(spaces-spec['spaces'])<0.000001, f'Carga divergente em {key}: tabela {spaces}, mecânica {spec["spaces"]}'
        catalog.append({'id':key,'name':name,'spaces':spaces,'category':spec['category'],'price':next(v for k,v in fields.items() if 'Preço' in k or 'preço' in k),'notes': ' · '.join(f'{k}: {v}' for k,v in fields.items() if k!=headers[0] and 'Preço' not in k and 'preço' not in k and 'Carga' not in k)[:500],'minStrength':spec['minStrength'],'armorClass':spec['armorClass'],'agilityCap':spec['agilityCap'],'movementPenalty':spec['movementPenalty']})
(root/'data/equipment-catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')
print(f'Capítulos 17 e 20 publicados na fonte; {len(catalog)} entradas de catálogo.')
