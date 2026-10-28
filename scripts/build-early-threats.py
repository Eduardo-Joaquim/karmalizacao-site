from pathlib import Path
import json

root = Path(__file__).resolve().parents[1]
threats = json.loads((root / 'data/early-threats.json').read_text())
regions = {'gaeria': 'Gaéria', 'ignaria': 'Ignária', 'aeria': 'Aéria', 'torre': 'Torre'}
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
        text += f'**{t["name"]} — Grau {t["grade"]}:** {t["description"]} {t["action"]}, {t["cost"]} Karma. {t["test"]}: maior de {t["dice"]}d20 +{t["bonus"]}, quando houver teste. {t["effect"]}\n\n**Composição de Karma:** ' + ' + '.join(f'{v["value"]} {v["label"]}' for v in t['components']) + f' = {t["cost"]} Karma.\n\n'
text = text.rstrip() + '\n'
(root / 'docs/ameacas-iniciais.md').write_text(text)
p = root / 'docs/bestiario.md'
body = p.read_text().split('## 06 · Monstros e ameaças de rota')[0].rstrip()
p.write_text(body + '\n\n' + text)
print(f'{len(threats)} ameaças iniciais integradas ao Bestiário.')
