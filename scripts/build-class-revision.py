from pathlib import Path
import json,re,subprocess
from lxml import html
root=Path(__file__).resolve().parents[1]
b=json.loads((root/'data/rules.json').read_text());classes=json.loads((root/'data/character-rules.json').read_text())['classes']
def pandoc(s):return subprocess.check_output(['pandoc','-f','markdown','-t','html5','--wrap=none'],input=s,text=True)
def indexed(c,body):
 c['html']=body;t=html.fragment_fromstring(body,create_parent='div');c['searchableText']=re.sub(r'\s+',' ',t.text_content()).strip();c['wordCount']=len(c['searchableText'].split());c['sections']=[]
 for n in t:
  if n.tag not in ['h2','h3','h4']:continue
  sib=list(n.itersiblings());end=next((i for i,v in enumerate(sib) if v.tag in ['h2','h3','h4'] and int(v.tag[1])<=int(n.tag[1])),len(sib))
  c['sections'].append(dict(id=n.get('id'),title=n.text_content(),level=int(n.tag[1]),searchableText=re.sub(r'\s+',' ',' '.join(v.text_content() for v in [n,*sib[:end]]))))
parts=[]
for c in classes:
 s='## '+c['name']+'\n\n'
 for field,label in [('function','Função'),('identity','Identidade'),('initialBonus','Bônus inicial'),('recommendedAttributes','Atributos recomendados'),('recommendedSkills','Perícias recomendadas')]:s+=f'**{label}:** {c[field]}\n\n'
 s+=f"#### Traço de Classe — {c['trait']['name']}\n\n{c['trait']['description']}\n\n"
 for ability_index,a in enumerate(c['abilities'],1):
  s+='#### Habilidade '+str(ability_index)+' — '+a['name']+'\n\n'
  if a['usage']:s+='**Uso:** '+a['usage']+'\n\n'
  effect=a['effect'];prefix='Ativação e custo: '+a['usage']
  if a['usage'] and effect.startswith(prefix):effect=effect[len(prefix):].lstrip()
  # Break named procedures into paragraphs without omitting their text.
  effect=re.sub(r' (?=(?:Resolução:|Encerramento:|Manutenção:|Punho em Suspenso:|Intervenção Clínica:|Expressão de |Expressões elementais:))','\n\n',effect)
  s+=effect+'\n\n';amp=next(x for x in c['amplifications'] if x['abilityName']==a['name']);s+=f"#### Ampliação — {amp['name']}\n\n{amp['description']}\n\n"
 if c['name']=='Inventor':
  rows=json.loads((root/'data/inventor-projects.json').read_text())['stages']
  s+='### Progressão dos projetos\n\n| Etapa | Preparados | Ativos | Peças (m) | Construção (TE) | Carga básica |\n|---|---|---|---|---|---|\n'
  for r in rows:s+='| '+' | '.join(str(r[k]) for k in ['stage','prepared','active','parts','timeTE'])+' | 2 espaços |\n'
  s+='\n| Etapa | CA | Vida | Dano | Alcance (m) | Duração (rodadas) |\n|---|---|---|---|---|---|\n'
  for r in rows:s+='| '+' | '.join(str(r[k]) for k in ['stage','ca','life','damage','range','duration'])+' |\n'
  s+='\nOs tetos de dano e alcance aplicam-se à função ofensiva portátil, não ao Escudo Cinético ou à fabricação industrial.\n\n'
 s+='### Progressão de status e desenvolvimento\n\nReceba cada linha uma única vez ao alcançar a Etapa. Aumento geral e extra de classe se somam; não reaplique o bônus inicial. As escolhas de Atributo precisam ser registradas.\n\n| Etapa | Aumento geral | Extra da classe | Desenvolvimento |\n|---|---|---|---|\n'
 for r in c['progression']:s+='| '+' | '.join(r[k] for k in ['stage','systemStatus','classStatus','development'])+' |\n'
 parts.append(s+'\n')
md='\n'.join(parts);(root/'docs/classes.md').write_text(md)
chapter=next(c for c in b['chapters'] if c['number']==6);indexed(chapter,(root/'docs/classes-introducao.html').read_text()+pandoc(md)+(root/'docs/classes-fecho.html').read_text())
indexed(next(c for c in b['chapters'] if c['number']==9),pandoc((root/'docs/karma.md').read_text()))
# Remove orphan references to the two deleted universal Karma maneuvers.
for c in b['chapters']:
 if c['number'] not in [5,13]:continue
 s=c['html'];s=s.replace('Efeitos raciais temporários seguem a regra de Dissipação de linhagem do Capítulo 9; ela não apaga anatomia ou traço passivo.','Efeitos raciais temporários terminam pelos gatilhos registrados em suas próprias habilidades; anatomia e traços passivos não são efeitos removíveis por Canalização.')
 s=s.replace('Efeito sem Grau usa a classificação exclusiva de Dissipação do Capítulo 9.','Efeito sem Grau conserva o resultado original como defesa; se automático, use CD 20 nesta habilidade de linhagem.')
 s=s.replace('Grau identifica oposição e dissipação;','Grau identifica oposição e potência;').replace('por dissipação ou se o celebrante','pelos gatilhos próprios ou se o celebrante').replace('Apagar, dissipar ou destruir o suporte','Apagar ou destruir o suporte').replace('resistir, dissipar ou finalizar um efeito','resistir ou finalizar um efeito por um procedimento que já permita isso').replace('resistir ou dissipar efeito','resistir a um efeito').replace('Destruição da marca ou dissipação encerra.','Destruição da marca encerra.').replace('destruir ou dissipar o selo','destruir o selo').replace('Dissipação de Grau adequado pode enfrentar o resultado registrado.','Romper a proteção exige os procedimentos próprios da fonte ou destruir seu suporte quando aplicável.').replace('Dissipar o sinal encerra.','Remover o suporte do sinal encerra.').replace('por dissipação ou disputa compatível','por uma disputa expressamente permitida pela regra da fonte')
 indexed(c,s)
(root/'data/rules.json').write_text(json.dumps(b,ensure_ascii=False,indent=2)+'\n');print('Classes, Karma e referências atualizados.')
