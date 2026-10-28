from pathlib import Path
import re,json,subprocess
import sys
p=Path(__file__).resolve().parents[1]
source=Path(sys.argv[1]).resolve()
s=subprocess.check_output(['pandoc',str(source),'-t','gfm','--wrap=none'],text=True)
def clean(t):return re.sub(r'\s+',' ',re.sub(r'<[^>]+>|\*\*','',t)).strip()
def block(title):return s.split('## '+title+'\n',1)[1].split('\n## ',1)[0]
def field(b,n):
 m=re.search(r'\*\*'+re.escape(n)+r':\*\*\s*([^\n]+)',b);return clean(m[1]) if m else ''
classes=[]
names=re.findall(r'"([^"\n]+)"', (p/'lib/character-data.ts').read_text().split('export const CLASSES = [')[1].split('] as const')[0])
common=['+2 Vida máxima.','+2 Karma máximo.','+2 Vida máxima; +1 CA.','+2 Karma máximo.','+2 Vida máxima; +2 Karma máximo; +1 CA.','+2 Karma máximo.','+4 Vida máxima; +2 Karma máximo; +1 CA.']
development=['Técnica de Fundamento até Grau II.','Segunda habilidade.','Técnica Evoluída até Grau III, Perícia 1.','Terceira habilidade.','Técnica de Assinatura até Grau IV, Perícia 2.','Primeira ampliação.','Técnica de Assinatura Grau V, Perícia 3; segunda ampliação.']
for name in names:
 b=block(name);hs=list(re.finditer(r'^### (.+)$',b,re.M));sections=[(m[1],b[m.end():hs[i+1].start() if i+1<len(hs) else len(b)]) for i,m in enumerate(hs)]
 trait=sections[0];abilities=[];amps=[]
 for title,body in sections[1:4]:
  parts=re.split(r'\*\*Ampliação\s*[-—:]\s*([^*]+)\*\*',body,maxsplit=1)
  abilities.append(dict(name=title,usage=field(parts[0],'Ativação e custo'),effect=clean(parts[0])))
  assert len(parts)==3,(name,title)
  amps.append(dict(abilityName=title,name=parts[1].rstrip(':'),description=clean(parts[2])))
 rows=re.findall(r'^\|\s*(VII|VI|IV|V|III|II|I)\s*\|([^|]+)\|',sections[-1][1],re.M)
 assert len(rows)==7,(name,rows)
 # Keep common and class extras separate clauses; parser sums all occurrences.
 progression=[dict(stage='Etapa '+r[0],status=common[i]+' '+clean(r[1]),development=development[i]) for i,r in enumerate(rows)]
 classes.append(dict(name=name,function=field(b,'Função'),identity=field(b,'Identidade'),initialBonus=field(b,'Bônus inicial'),recommendedAttributes=field(b,'Atributos recomendados'),recommendedSkills=field(b,'Perícias recomendadas'),trait=dict(name=trait[0].removeprefix('Traço '),description=clean(trait[1])),abilities=abilities,amplifications=amps,progression=progression))
(p/'data/character-rules.json').write_text(json.dumps(dict(source='Karmalização - Prototipo, Livros, 17/10/2026',classes=classes),ensure_ascii=False,indent=2))
# Update all race descriptions, including their four hereditary milestones.
races={}
for plural,name in [('Humanos','Humano'),('Elfos','Elfo'),('Anões','Anão'),('Demi-humanos','Demi-humano'),('Vampiros','Vampiro'),('Tritões','Tritão'),('Demônios','Demônio'),('Ghouls','Ghoul'),('Abissais','Abissal')]:
 b=block(plural);features=[]
 initial=b.split('**Evolução da herança**')[0]
 matches=list(re.finditer(r'^\*\*([^*]+):\*\*',initial,re.M))
 for i,m in enumerate(matches):
  if m[1]=='Bônus extras':continue
  text=clean(initial[m.end():matches[i+1].start() if i+1<len(matches) else len(initial)])
  features.append(dict(name=m[1],kind='Passiva' if text.startswith('Passiva') else 'Habilidade',description=text))
 for stage,t in re.findall(r'^\|\s*(VII|VI|IV|V|III|II|I)\s*\|\s*(.*?)\s*\|\s*$',b,re.M):
  features.append(dict(name='Herança — Etapa '+stage,kind='Habilidade',description=clean(t)))
 races[name]=dict(summary=field(b,'Bônus extras'),features=features)
(p/'data/race-book.json').write_text(json.dumps(races,ensure_ascii=False,indent=2))
print('Classes:',len(classes),'Raças:',len(races))
