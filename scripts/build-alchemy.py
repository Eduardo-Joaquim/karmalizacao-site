"""Keep the Alchemist's existing dose rule aligned with the chapter 17 flask rule."""
from pathlib import Path
import json,re
root=Path(__file__).resolve().parents[1]
replacements={
 'cada uma ocupa um espaço de carga':'cada uma ocupa 0,25 espaços de carga',
 'Sacá-la usa a interação simples.':'Doses em Prontidão são retiradas na própria ação de consumo; doses na Mochila exigem saque com Principal antes, ou Principal para sacar e beber em si. Cada dose gera 1 Saturação Alquímica, conforme o Capítulo 17.',
}
for name in ['rules','character-rules']:
 p=root/f'data/{name}.json';b=json.loads(p.read_text())
 def walk(v):
  if isinstance(v,str):
   for a,z in replacements.items():v=v.replace(a,z)
   return v
  if isinstance(v,list):return [walk(x) for x in v]
  if isinstance(v,dict):return {k:walk(x) for k,x in v.items()}
  return v
 b=walk(b)
 if name=='rules':
  from lxml import html
  c=next(c for c in b['chapters'] if c['number']==6)
  t=html.fragment_fromstring(c['html'],create_parent='div');c['searchableText']=re.sub(r'\s+',' ',t.text_content()).strip();c['wordCount']=len(c['searchableText'].split())
 p.write_text(json.dumps(b,ensure_ascii=False,indent=2)+'\n')
print('Doses do Alquimista: 0,25 espaços, Saturação 1 e ações de consumo alinhadas.')
