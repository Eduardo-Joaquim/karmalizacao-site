"""Build Geppeto's seven summons from explicit base stats and ability definitions."""
from pathlib import Path
import json
import re

root = Path(__file__).resolve().parents[1]
source = json.loads((root / 'data/geppeto-summons-source.json').read_text())
scale = lambda value: (value * source['multiplier'] + 99) // 100
training_bonus = {0: 0, 1: 2, 2: 5, 3: 10}
def roll(attributes, attribute, training, extra=0, analytic=False):
    if training == 0:
        return '1d20'
    dice = (attributes[attribute] + 1) // 2 + extra
    bonus = training_bonus[training] + (min(3, attributes[3] // 2) if analytic else 0)
    return f'maior de {dice}d20 +{bonus}'

members = []
labels = dict(action='Ação',cost='Custo',range='Alcance',test='Teste',effect='Efeito',total='Acerto total',partial='Acerto parcial',failure='Falha',duration='Duração',limits='Limites',construction='Composição de Karma')
markdown = ['<!-- summons:start -->', '**Invocações detalhadas:** cada peça usa os próprios atributos e uma Reação por rodada, recuperada no início do turno de Geppeto. Chamadas, técnicas e manutenção são pagas com o Karma de Geppeto. Atacar permite deslocamento completo e um ataque básico; Manifestar permite metade do deslocamento e uma habilidade. Uma peça não recebe um segundo comando no mesmo turno. Uma reação de controle exige uma ordem previamente reservada.']
for original in source['members']:
    item = {key: value for key, value in original.items() if key not in ['tests']}
    item.update(life=scale(original['life']), ca=scale(original['ca']), movement=scale(original['movement']), attributes=[scale(value) for value in original['attributes']])
    item['partial'] = f"{item['ca'] // 2}–{item['ca']}"
    item['total'] = f"{item['ca'] + 1}+"
    item['attack'] = dict(original['attack'])
    item['attack']['roll'] = roll(item['attributes'], original['attack']['attribute'], original['attack']['training'])
    item['tests'] = [dict(name=test['name'], roll=roll(item['attributes'], test['attribute'], test['training'], test.get('extra',0), test.get('analytic',False))) for test in original['tests']]
    item['abilities'] = []
    for ability in original['abilities']:
        fields = {}
        for key, value in ability.items():
            for i, test in enumerate(item['tests']):
                value = value.replace('{test'+str(i)+'}', test['roll'])
            assert not re.search(r'\{test\d+\}', value), (original['name'], value)
            fields[key] = value
        item['abilities'].append(fields)
    members.append(item)
    markdown += [f"##### {item['name']} · {item['title']}", f"**Ficha da invocação:** Grau {item['grade']}; Vida {item['life']}; CA {item['ca']}; parcial {item['partial']}; total {item['total']}; deslocamento {item['movement']} m; chamada {item['call']} Karma; manutenção entre cenas {item['maintenance']} Karma.", '**Atributos:** ' + ' · '.join(f'{name} {value}' for name,value in zip(['FOR','AGI','CON','INT','PRE','ESP'],item['attributes'])) + '.', '**Perícias:** ' + item['skills'], f"**Ataque básico — {item['attack']['name']}:** ordem Atacar; 0 Karma; {item['attack']['range']}; {item['attack']['roll']} contra CA. Total: {item['attack']['damage']}. Parcial: role o mesmo dano e divida por dois, arredondando para baixo, antes de Resistência e escudo. Falha: sem dano. Atributos não são somados ao dano."]
    for test in item['tests']:
        markdown.append(f"**{test['name']}:** {test['roll']}.")
    for ability in item['abilities']:
        markdown.append('**'+ability['name']+':** '+' '.join(f"**{label}:** {ability[key]}" for key,label in labels.items() if key in ability))
    markdown.append('**Limites:** '+item['weakness'])
markdown += ['<!-- summons:end -->']
appendix = '\n\n'.join(markdown)+'\n'
(root/'data/geppeto-summons.json').write_text(json.dumps(members,ensure_ascii=False,indent=2)+'\n')
(root/'docs/invocacoes-geppeto.md').write_text(appendix)

p = root/'docs/corte-da-falsa-santa.md'
court = p.read_text()
before, body = court.split('### Orgulho · Geppeto',1)
geppeto, after = body.split('### Ganância',1)
geppeto = re.sub(r'\n<!-- summons:start -->.*?<!-- summons:end -->\n', '\n', geppeto, flags=re.S)
table = '| Invocação | Vida · CA | Chamada | Função |\n|---|---|---|---|\n'
for member in members:
    table += f"| {member['name']} | {member['life']} · {member['ca']} | {member['call']} Karma | {member['title']} · Grau {member['grade']}. |\n"
geppeto = re.sub(r'\| Invocação \|.*?(?=\n\*\*Limites do teatro:)', table, geppeto, flags=re.S)
geppeto = geppeto.replace('**Fio mestre:**', appendix+'\n**Fio mestre:**',1)
geppeto = re.sub(r'\n{3,}', '\n\n', geppeto)
p.write_text(before+'### Orgulho · Geppeto'+geppeto+'### Ganância'+after)
p = root/'docs/bestiario.md'
p.write_text(p.read_text().split('### Ira · Euphere')[0]+(root/'docs/corte-da-falsa-santa.md').read_text())
print('Sete invocações: atributos, Vida, CA e movimento ampliados; técnicas detalhadas.')
