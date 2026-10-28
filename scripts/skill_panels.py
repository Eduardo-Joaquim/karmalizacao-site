"""Visual skill lists for the HTML-only noble dossiers; never infer training."""
import re
from html import escape
from lxml import html as LH

def skill_panel(text):
 text=re.sub(r'\s+',' ',text).strip()
 text=re.sub(r'^Perícias\s*:\s*','',text)
 skills=[];notes=[]
 for part in filter(None,(p.strip() for p in re.split(r'[.;](?:\s|$)',text))):
  if re.match(r'(Ataque básico|Demais|Perícias não indicadas|Perícia|Sem |Não |A CA|As quatro|Sua |Testes |Em testes )',part,re.I):notes.append(part);continue
  matches=[m for m in re.finditer(r'([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ ,—–-]*?)\s+([0-3])\b',part) if not re.match(r'(Demais|Perícias não indicadas|Perícia|nível|no nível)',m[1],re.I)]
  if not matches:notes.append(part);continue
  roll=re.search(r'(?:maior\s+(?:de\s+)?)?\d+d20\s*[+−-]\s*\d+',part,re.I)
  for m in matches:
   for name in re.split(r',\s*|\s+e\s+',re.sub(r'^(e|Perícias:)\s+','',m[1],flags=re.I)):
    if name.strip() and name not in [s[0] for s in skills]:skills.append((name.strip(),int(m[2]),roll[0] if roll else ''))
 if not skills:return None
 cards=[]
 for name,level,roll in skills:
  pips=''.join('<i class="filled"></i>' if i<=level else '<i></i>' for i in [1,2,3])
  cards.append(f'<div class="skill-card"><div class="skill-card-identity"><strong>{escape(name)}</strong><span class="skill-level" aria-label="Nível {level}"><small>NÍVEL</small>{level}</span></div><div class="skill-training"><span>Treinamento</span><b>+{[0,2,5,10][level]}</b><span class="skill-pips" aria-hidden="true">{pips}</span></div>'+ (f'<p class="skill-roll">{escape(roll)}</p>' if roll else '')+'</div>')
 return LH.fragment_fromstring('<section class="skill-panel" aria-label="Perícias"><header class="skill-panel-heading"><h4>Perícias</h4><span>'+str(len(skills))+' treinadas</span></header><div class="skill-card-grid">'+''.join(cards)+'</div><div class="skill-notes">'+''.join('<p>'+escape(n)+'.</p>' for n in notes)+'</div></section>')
