import re
DAMAGE={'Kármico':['1d10','2d6','2d8','2d10','3d10'],'Elemental':['1d10','2d6','2d8','2d10','3d10'],'Divino':['1d8','1d10','2d6','2d8','3d8'],'Marcial':['1d8','1d10','2d6','2d8','3d8'],'Corrupto':['1d10','2d8','3d6','3d8','3d12']}
OLD=['1d6','1d12','2d10','2d12','3d10']
ELEMENTS=['Cinza Ardente','Miragem Solar','Breu Abissal','Combustão','Plasma','Cristal','Quartzo','Erosão','Vácuo','Sangue','Vapor','Metal','Magma','Lava','Areia','Laser','Raio','Gelo','Fogo','Água','Terra','Vento','Sombra','Trevas','Heliose','Luz','Som','Ar']
TITLE_ELEMENTS={'Arco de Plasma Cru':'Plasma','Nadir':'Plasma','Estocada de Luz':'Luz','Banquete do Breu':'Sombra','Liturgia da Boca Sem Fundo':'Sombra','Caldeirão da Gula':'Magma','Erupção do Bosque Sepultado':'Terra'}
DIVINE_ATTACKS={'Jacó','Moisés','Davi','Sansão','Dia do Julgamento Final'}
DAMAGE_SUFFIX=r'(?:divinos?|corruptos?|kármicos?|físicos?|cortantes?|perfurantes?|contundentes?|ácidos?|tóxicos?|espirituais|espiritual|mentais|mental|mágicos?|balísticos?|elementais|elemental|de\\s+(?:dano|impacto|corte|perfuração|Fogo|Água|Terra|Ar|Luz|Trevas|Sombra|Sangue|Magma|Lava|Quartzo|Cristal|Metal|Areia|Vento|Vapor|Combustão|Raio|Som|Vácuo|Erosão|Breu|Plasma|Gelo))'
# whitespace must work in both prose and rendered strong spans
DAMAGE_SUFFIX=DAMAGE_SUFFIX.replace('\\\\s','\\s')

def matrix(source):
 s=source.lower()
 if re.search(r'corrupt|enxerto|marca|mutaç',s):return 'Corrupto'
 if re.search(r'divin|comunhão|liturg|milagre',s):return 'Divino'
 if re.search(r'element|raio|vapor|quartzo|vento|água|fogo|terra|\bar\b|luz|treva|sangue|heliose|plasma|combustão|gelo',s):return 'Elemental'
 if re.search(r'marcia|punho|espada|luta|pugil|pontaria',s):return 'Marcial'
 return 'Kármico'

def damage_type(source,m):
 if m!='Elemental':return m
 for title,element in TITLE_ELEMENTS.items():
  if title.casefold() in source.casefold():return 'Elemental / '+element
 names=re.findall(r'(?<!\w)('+'|'.join(ELEMENTS)+r')(?!\w)',source,re.I)
 if not names:return 'Elemental'
 # the most specific expression wins over its parent mentioned in the test
 e=min((next(x for x in ELEMENTS if x.casefold()==n.casefold()) for n in names),key=ELEMENTS.index)
 return 'Elemental / '+{'Ar':'Vento','Trevas':'Sombra','Heliose':'Luz'}.get(e,e)

def profile(source,grade):
 m=matrix(source);i=['I','II','III','IV','V'].index(grade) if grade in ['I','II','III','IV','V'] else 0
 return {'matrix':m,'damageType':damage_type(source,m),'baseDamage':DAMAGE[m][i]}

def adapt_damage(text,grade,m):
 if grade not in ['I','II','III','IV','V']:return text
 i=['I','II','III','IV','V'].index(grade)
 pattern=r'(?<![\w+])'+re.escape(OLD[i])+r'(?![\w+])(?=(?:\*\*|</strong>)?\s*'+DAMAGE_SUFFIX+r'\b)'
 def replace(match):
  context=re.sub(r'<[^>]+>|\*\*',' ',text[max(0,match.start()-60):match.start()])
  if re.search(r'(?:cura|recupera|restaura|escudo|reduz(?:ir)? (?:o )?dano|redução de dano)[^.;:]{0,35}$',context,re.I):return match[0]
  return DAMAGE[m][i]
 return re.sub(pattern,replace,text,flags=re.I)

def classify(art):
 source=art.get('source','');title=art.get('name',art.get('title',''))
 if any(t.casefold() in title.casefold() for t in TITLE_ELEMENTS):art['matrix']='Elemental'
 prose=' '.join(re.sub('<[^>]+>',' ',f['html']) for f in art.get('fields',[]) if f['label'] not in ('Descrição','Composição de Karma','Matriz e dano universal'))
 prose=re.sub(r'\s+',' ',prose)
 text=source+' '+title+' '+prose
 offense=re.sub(r'\bnão (?:causa|inflige) dano\b','',prose,flags=re.I)
 if re.search(r'frasco|ampola|alqu[ií]m',source,re.I) and re.search(r'0 Karma|sem Karma',str(art.get('cost',''))+' '+prose,re.I):
  tag='Item Alquímico'
 elif title in DIVINE_ATTACKS:
  art['matrix']='Divino';tag='Divino'
 elif re.search(r'\b\d+d\d+\s+'+DAMAGE_SUFFIX,offense,re.I) or re.search(r'causa (?:dano|\d+d\d+)',offense,re.I):
  tag=damage_type(text,art['matrix'])
 elif re.search(r'escudo|ca \+|reduz (?:o )?dano|resistência',prose,re.I):tag='Defesa'
 elif re.search(r'desloca|movimento|teleport|salto',prose,re.I):tag='Mobilidade'
 else:tag='Suporte'
 art['damageType']=tag
 if tag in ('Defesa','Mobilidade','Suporte','Item Alquímico'):art['baseDamage']=''
 elif art.get('grade') in ['I','II','III','IV','V']:art['baseDamage']=DAMAGE[art['matrix']][['I','II','III','IV','V'].index(art['grade'])]
