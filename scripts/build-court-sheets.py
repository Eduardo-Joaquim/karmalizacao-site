"""Create display blocks from the book's canonical court manuscript."""
from pathlib import Path
import json
import re
import subprocess

root = Path(__file__).resolve().parents[1]
source = (root / 'docs/corte-da-falsa-santa.md').read_text()
def render(md):
    return subprocess.check_output(['pandoc', '-f', 'markdown', '-t', 'html5'], input=md, text=True).strip()
def text(md):
    return md.replace('**', '').strip()

profiles = [
    dict(slug='euphere', name='Euphere', sin='Ira', title='A escritora que ainda escolhe', role='Abissal · Especialista · Etapa VI', rank='SS', life='', karma='', ca='', movement='11 m · voo 12 m', accent='#e9a585', attributes=[7,4,5,8,5,6], phases=[dict(name='Sem armadura'),dict(name='Dragão Negro · I'),dict(name='Dragão Negro · II')]),
    dict(slug='joao-e-maria', name='João e Maria', sin='Gula', title='Dois corpos. Uma fome.', role='Ocultista e Ranger · Etapa V', rank='S', life='', karma='', ca='', movement='9 m · ambos', accent='#e4a76e', attributes=[3,3,4,5,6,6], phases=[]),
    dict(slug='geppeto', name='Geppeto', sin='Orgulho', title='O diretor dos sete fios', role='Invocador · Etapa V', rank='S', life='', karma='', ca='', movement='7 m', accent='#d3b574', attributes=[1,2,4,5,7,6], phases=[]),
    dict(slug='ganancia', name='O Colecionador de Vidas', sin='Ganância', title='Cada movimento tem um proprietário', role='Vampiro · Ladrão e Elementalista · Etapa V', rank='S', life='', karma='', ca='', movement='9 m', accent='#b7c58c', attributes=[4,6,5,8,7,6], phases=[]),
    dict(slug='nemetor', name='Nemetor', sin='Preguiça', title='O Deus-Raiz Sacrificial', role='Deus-Raiz · Etapa V · Porte de 3 m', rank='S', life='', karma='', ca='', movement='7 m · subsolo 14 m', accent='#8abb9e', attributes=[5,1,5,1,3,5], phases=[]),
    dict(slug='branca-de-neve', name='Branca de Neve', sin='Luxúria', title='A assassina do Miasma Carmesim', role='Assassina · Etapa V · Água, Terra e Ar', rank='S', life='', karma='', ca='', movement='12 m', accent='#d899b1', attributes=[3,7,4,5,5,6], phases=[]),
    dict(slug='maelia-veyr', name='Maélia Veyr', sin='Inveja', title='A Mãe das Vidas Roubadas', role='Samaritano · Etapa V · Ruptura', rank='S', life='', karma='', ca='', movement='7 m', accent='#b3a3d6', attributes=[2,3,4,5,6,5], phases=[dict(name='A mãe das vidas roubadas'),dict(name='Mãe do Vazio')]),
]
balance = json.loads((root / 'data/court-balance.json').read_text())
def scaled(value, resource):
    return (value * balance['multipliers'][resource] + 99) // 100
for profile in profiles:
    base = balance['base'][profile['slug']]
    profile['life'] = str(scaled(base['life'], 'life')) if base['life'] is not None else ''
    profile['karma'] = ' / '.join(str(scaled(value, 'karma')) for value in base['karma'])
    profile['ca'] = str(scaled(base['ca'], 'ca')) if base['ca'] is not None else ''
    override = balance.get('overrides', {}).get(profile['slug'], {})
    for field in ['life', 'ca']:
        if field in override:
            profile[field] = str(override[field])
    if 'karma' in override:
        profile['karma'] = ' / '.join(str(value) for value in override['karma'])
    for phase, base_ca in zip(profile['phases'], base['forms']):
        ca = scaled(base_ca, 'ca')
        phase.update(ca=ca, partial=f'{ca // 2}–{ca}', total=f'{ca + 1}+')
    if profile['slug'] == 'euphere':
        life = int(profile['life']); half = life // 2
        for phase, label in zip(profile['phases'], [f'{life} Vida', f'{life}–{half + 1} Vida', f'{half}–1 Vida']):
            phase['life'] = label
    elif profile['slug'] == 'maelia-veyr':
        life = int(profile['life']); half = life // 2
        profile['phases'][0]['life'] = f'{life}–{half + 1} Vida'
        profile['phases'][1]['life'] = f'{half} Vida ou boneca tomada'

profiles.append(dict(slug='prorrogadora-da-extincao', name='Falsa Santa', sin='Soberana', title='A Prorrogadora da Extinção', role='Suporte · Curandeiro · Etapa VII', rank='', life='240', karma='300', ca='17', movement='9 m', accent='#d7c8a7', attributes=[7,7,7,10,10,10], phases=[]))

records = re.split(r'^### ', source, flags=re.M)[1:]
assert len(records) == len(profiles) == 8
for profile, record in zip(profiles, records):
    profile['summons'] = json.loads((root / 'data/geppeto-summons.json').read_text()) if profile['slug'] == 'geppeto' else []
    profile['pc'] = '20' if profile['slug'] == 'prorrogadora-da-extincao' else '18' if profile['slug'] == 'maelia-veyr' else ''
    assert '{#'+profile['slug']+'}' in record.split('\n',1)[0]
    lore = re.split(r'^#### História e Origem[^\n]*\n', record, flags=re.M)[1]
    lore, combat = re.split(r'^#### Ficha de Combate[^\n]*\n', lore, flags=re.M)
    combat = re.sub(r'\n<!-- summons:start -->.*?<!-- summons:end -->\n', '\n', combat, flags=re.S)
    profile['loreHtml'] = render(lore)
    chunks = re.split(r'\n\s*\n', combat.strip())
    profile['blocks'] = []
    for i, chunk in enumerate(chunks):
        if chunk.startswith('|'):
            lines = chunk.splitlines()
            headers = [text(x) for x in lines[0].strip('|').split('|')]
            rows = [[text(x) for x in line.strip('|').split('|')] for line in lines[2:]]
            if i == 0:
                profile['facts'] = [dict(label=row[0], value=' · '.join(row[1:])) for row in rows if not any(term in row[0] for term in ['Atributos', 'Vida · Karma', 'CA', 'Parcial', 'Deslocamento', 'Pontos Corruptos'])]
            else:
                for row in rows:
                    profile['blocks'].append(dict(title=row[0],kind='ability',fields=[dict(label=header,html=render(value)) for header,value in zip(headers[1:],row[1:])]))
        else:
            title = re.match(r'^\*\*(.+?)\*\*\s*', chunk)
            if title:
                label = title[1].rstrip(':')
                body = chunk[title.end():]
            else:
                label, body = 'Resolução', chunk
            kind = 'weakness' if any(x in label.lower() for x in ['fraqueza','libertação','votos']) else 'phase' if 'fase' in label.lower() else 'reward' if any(x in label.lower() for x in ['recompensa','vitória']) else 'trait'
            profile['blocks'].append(dict(title=label,kind=kind,fields=[dict(label='',html=render(body))]))
    constructions = json.loads((root / 'data/technique-construction.json').read_text())
    for block in profile['blocks']:
        entry = next((e for e in constructions if e['owner'] == profile['slug'] and e['name'] == block['title']), None)
        block['grade'] = entry['grade'] if entry else ''
        block['cost'] = str(entry['cost']) + ' Karma' if entry and entry['cost'] is not None else ''
    assert profile['loreHtml'] and profile['blocks']
(root/'data/court-sheets.json').write_text(json.dumps(profiles,ensure_ascii=False,indent=2)+'\n')
print('Oito fichas geradas; história e mecânica preservadas em blocos de leitura.')
