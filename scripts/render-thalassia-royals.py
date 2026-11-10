"""Render the royal dossiers from the authored source, preserving other profiles."""
from pathlib import Path
import json,re
root=Path(__file__).resolve().parents[1];data=json.loads((root/'data/thalassia-source.json').read_text());path=root/'docs/thalassia.md';doc=path.read_text()
for p in data['people']:
 if p['id'] not in ['atargatis-kalypso','nammu-salacia','ummu-hubur']:continue
 text=f"### {p['name']} · {p['title']} {{#{p['id']}}}\n\n#### História e Origem {{#{p['id']}-historia}}\n\n"+'\n\n'.join(p['lore'])+f"\n\n#### Ficha de Combate {{#{p['id']}-ficha}}\n\n"
 attrs=' · '.join(f'{k} {v}' for k,v in zip(['Força','Agilidade','Constituição','Intelecto','Presença','Espírito'],p['attrs']))
 text+=f"**Identidade:** {'Tritã' if p['zone'] in ['halikarnos','apsu'] else 'Abissal'} · {p['cls']} · Etapa {p['stage']} · {p['role']}. **Vida:** {p['life']}. **Karma:** {p['karma']}. **CA:** {p['ca']}. **Deslocamento:** {'9 m; natação 9 m' if p['zone'] in ['halikarnos','apsu'] else '9 m'}. **Atributos:** {attrs}.\n\n**Perícias:** {p['skills']}\n\n**Reações:** {p['reactions']} Reações por rodada, recuperadas no início do próprio turno. Uma defesa por ocorrência; retaliação é ataque, não outra defesa gratuita.\n\n**Domínios:** {p['domains']}\n\n"
 text+='**Resolução do arsenal:** Pague ação e Karma conforme o perfil individual. Acerto Total iguala ou supera a CA. Acerto Parcial vai do limiar Parcial até CA − 1. Um 20 natural que acerta dobra apenas os dados-base do ataque, salvo a vedação expressa do retorno de Reflexio; dano contínuo ambiental não tem crítico. Dados adicionais e bônus fixos entram uma vez. Área compara uma rolagem separadamente à defesa de cada alvo; não some os dados de modos alternativos no mesmo alvo.\n\n'
 for i,t in enumerate(p['traits']):
  label=f'Traço {i+1}'
  if p['id']=='atargatis-kalypso' and i==1:label='Bênção Divina — Ius Procellae';t='<span data-divine-grant="susanoo">Outorgada por Susanoo.</span><span data-world-blessing="outorga-17"></span> '+t
  text+=f'**{label}:** {t}\n\n'
 for i,a in enumerate(p['arts']):
  prefix='Assinatura' if a['signature'] else str(i+1)
  text+=f"##### {prefix} · {a['name']} {{#{p['id']}-{i+1}}}\n\n**Descrição:** {a['description']}\n\n**Fonte e Grau:** {a['source']} {a['grade']}. **Uso:** {a['action']}, {a['cost']} Karma. **Alcance e alvos:** {a['range']}.\n\n**Preparação:** {a['prep']}\n\n**Teste e limiares:** {a['test']}.\n\n**Resolução mecânica:** {a['effect']}\n\n**Limites:** {a['limit']}\n\n"
 start=doc.index('### '+p['name']+' ·');end=doc.find('\n### ',start+4);end=len(doc) if end<0 else end
 # A section heading between two royal profiles belongs to the following stratum.
 section=doc.find('\n## ',start+4)
 if section>=0:end=min(end,section)
 doc=doc[:start]+text+doc[end:]
path.write_text(doc)
