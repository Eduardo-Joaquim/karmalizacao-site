from pathlib import Path
import json

root = Path(__file__).resolve().parents[1]
threats = json.loads((root / 'data/early-threats.json').read_text())
regions = {'gaeria': 'Gaéria', 'ignaria': 'Ignária', 'aeria': 'Aéria', 'torre': 'Torre'}
for region in regions:
    assert sorted(c['stage'] for c in threats if c['region']==region)==['I','I','II','III','IV'], f'Curva de Etapas divergente em {region}'
for c in threats:
    assert c['attack']['damage']=={'I':'1d6','II':'1d8','III':'1d10','IV':'2d6'}[c['stage']], f'Dano básico divergente: {c["id"]}'
    assert c['attack']['dice']==(c['attributes'][0]+1)//2, f'Reserva básica divergente: {c["id"]}'

text = '## 06 · Monstros e ameaças de rota {#ameacas-iniciais}\n\n[Consultar as fichas e filtrar por região ou Etapa](/bestiario/ameacas).\n\nAs indicações de andar descrevem habitats destas criaturas; não tornam todo habitante de um andar igualmente poderoso. Cada criatura tem uma Principal, um Movimento, uma Livre e uma Reação por rodada. As fichas usam Vida e CA da referência de ameaça; condições e alcance continuam exigindo meios físicos.\n\n'
for key, name in regions.items():
    text += f'### Ameaças · {name}\n\n'
    for c in threats:
        if c['region'] != key: continue
        a = c['attack']; t = c['technique']
        text += f'#### {c["name"]} {{#{c["id"]}}}\n\n{c["lore"]}\n\n**Habitat:** {c["habitat"]}. **Etapa:** {c["stage"]}. **Ameaça:** {c["rank"]}. **Vida:** {c["life"]}. **Karma:** {c["karma"]}. **CA:** {c["ca"]}. **Movimento:** {c["movement"]} m.\n\n'
        text += '**Atributos:** ' + ' · '.join(f'{n} {v}' for n,v in zip(['Força','Agilidade','Constituição','Intelecto','Presença','Espírito'],c['attributes'])) + '.\n\n'
        text += '**Perícias:** ' + ' · '.join(f'{s["name"]} {s["level"]}' for s in c['skills']) + '. Demais 0.\n\n'
        text += f'**{c["trait"]["name"]}:** {c["trait"]["effect"]}\n\n**{a["name"]}:** Principal, sem Karma, {a["range"]}; maior de {a["dice"]}d20 +{a["bonus"]} contra CA, {a["damage"]} físico. Parcial metade antes das proteções; falha nada.\n\n'
        test='Ativação direta, sem rolagem de ataque' if 'sem teste' in t['test'].lower() or 'contra CA' not in t['test'] else f'{t["test"]}: maior de {t["dice"]}d20 +{t["bonus"]}'
        text += f'**{t["name"]} — Grau {t["grade"]}:** {t["description"]} {t["action"]}, {t["cost"]} Karma. {test}. {t["effect"]}\n\n**Composição de Karma:** ' + ' + '.join(f'{v["value"]} {v["label"]}' for v in t['components']) + f' = {t["cost"]} Karma.\n\n'
text = text.rstrip() + '\n'
(root / 'docs/ameacas-iniciais.md').write_text(text)
p = root / 'docs/bestiario.md'
body=p.read_text().split('## 06 · Monstros e ameaças de rota')[0].split('## 06 · Ameaças dos Andares da Torre')[0].rstrip()
import re
body=re.sub(r'\n<!-- regional-monsters:[^>]+ -->.*?<!-- /regional-monsters -->\n','\n',body,flags=re.S)
for region,title in regions.items():
 group=text.split('### Ameaças · '+title+'\n\n',1)[1].split('### Ameaças · ',1)[0].rstrip()
 block='\n<!-- regional-monsters:'+region+' -->\n### Bestiário de '+title+'\n\n'+group+'\n<!-- /regional-monsters -->\n'
 if region=='torre':body+='\n\n## 06 · Ameaças dos Andares da Torre {#ameacas-iniciais}\n'+block
 else:
  heading={'gaeria':'## 02 · Gaéria','ignaria':'## 01 · Ignária','aeria':'## 04 · Aéria'}[region]
  start=body.index(heading);end=body.find('\n## ',start+4)
  if end<0:end=len(body)
  body=body[:end]+block+body[end:]
p.write_text(body+'\n')
print(f'{len(threats)} ameaças integradas aos seus territórios.')
