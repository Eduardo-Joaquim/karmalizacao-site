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
        fields=dict(zip(headers,row));name=row[0];key=slug(name)
        duplicate=next((i for i,e in enumerate(catalog) if e["id"]==key),None)
        if key in seen and headers[0]!="Nome do Item":continue
        if duplicate is not None:catalog.pop(duplicate)
        seen.add(key);load=next(v for k,v in fields.items() if 'Carga' in k)
        num=re.match(r'\+?([\d.,]+)(?:/(\d+))?',load)
        if not num:continue
        spaces=float(num[1].replace('.','').replace(',','.'))/(int(num[2]) if num[2] else 1)
        kind='ammo' if headers[0] in ['Munição','Munição ou recipiente'] or any(w in name.lower() for w in ['carregador','caixa de','projétil','fita de','flechas','virotes']) else 'gear'
        if headers[0]=='Arma' or any(w in name.lower() for w in ['espada','machado','adaga','manoplas','florete','lança','arco','besta','martelo','punhos','maça','corrente','bastão']):kind='weapon'
        if name in ['Varinha','Cajado','Lâmina rúnica','Grimório','Orbe de convergência','Amuleto de vínculo','Cetro de combate','Placa de inscrições','Fio de ancoragem']:kind='focus'
        if name.startswith('Escudo'):kind='shield'
        if name.startswith('Armadura') or name in ['Roupa reforçada','Roupa comum','Colete balístico experimental']:kind='armor'
        props=fields.get('Alcance e Propriedades',fields.get('Alcance e propriedades',''))
        effect=fields.get('Dano / Efeito',fields.get('Dano',fields.get('Efeito','')))
        req=fields.get('Requisito de Força',fields.get('Força',''))
        strength=re.match(r'(\d+)',req) or re.search(r'Força (\d+)',props)
        armor={'Roupa comum':0,'Roupa reforçada':1,'Armadura leve':2,'Armadura média':4,'Armadura pesada':7,'Escudo leve':1,'Escudo médio':2,'Escudo pesado':3,'Colete balístico experimental':0}.get(name,0)
        catalog.append({'id':key,'name':name,'spaces':spaces,'category':kind,'price':next(v for k,v in fields.items() if 'Preço' in k or 'preço' in k),'notes': ' · '.join(f'{k}: {v}' for k,v in fields.items() if k!=headers[0] and 'Preço' not in k and 'preço' not in k and 'Carga' not in k)[:500],'minStrength':int(strength[1]) if strength else 0,'armorClass':armor,'agilityCap':5 if name in ['Armadura média','Colete balístico experimental'] else 3 if name=='Armadura pesada' else 99,'movementPenalty':2 if name in ['Armadura pesada','Escudo pesado'] else 0})
(root/'data/equipment-catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')
print(f'Capítulos 17 e 20 publicados na fonte; {len(catalog)} entradas de catálogo.')
