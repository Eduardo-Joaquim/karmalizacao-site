"""Compile the Cursed Rune manuscript from its shared catalog."""
from pathlib import Path
import json
import re
import subprocess

from book206.common import append_section, chapter

ROOT = Path(__file__).resolve().parents[2]


def _catalog():
    return json.loads((ROOT / 'data/cursed-runes.json').read_text())


def _conditions(data):
    rows = ['| Código | Condição de Despertar | Procedimento | Incompatível com |', '|---|---|---|---|']
    rows.extend(
        f"| {entry['id']} | {entry['name']} | {entry['description']} | "
        + (', '.join(entry.get('incompatibleWith', [])) or '—') + ' |'
        for entry in data['conditions']
    )
    return '\n'.join(rows)


def _power(data):
    rows = [
        '| Condições | Classificação | Dano no Despertar | Estado em Acerto Total | CD de Escape da Vítima | CD de Forja | CD da Fome |',
        '|---|---|---|---|---|---|---|',
    ]
    for entry in data['powerLevels']:
        damage = ' ou '.join([entry['damage'], *entry['alternatives']])
        victim = f"Maior entre {entry['escapeDC']} e ({entry['scalingBase']} + PRE + Controle)"
        hunger = 14 + entry['conditions']
        rows.append(f"| {entry['conditions']} | {entry['classification']} | {damage} | {entry['stateDescription']} | {victim} | {entry['forgeDC']} | {hunger} |")
    return '\n'.join(rows)


def _effects(data):
    parts = []
    for index, entry in enumerate(data['effects']):
        number = index + 1
        label = f'Runa {number} - Exemplo canônico' if entry.get('example') else f"Runa {number}"
        parts.append(f"#### {label} - {entry['name']} {{#cursed-effect-{entry['id']}}}\n\n")
        parts.append(f"**{entry['epithet']}** - {entry['effect']}\n\n")
        if entry.get('defaultConditions') and not entry.get('example'):
            conditions = ' + '.join(entry['defaultConditions'])
            count = len(entry['defaultConditions'])
            condition_label = 'condição' if count == 1 else 'condições'
            composition_label = 'Composição fixa' if entry.get('fixedComposition') else 'Composição'
            parts.append(f"**{composition_label}:** {conditions}; {count} {condition_label}; dano escolhido {entry['damageOverride']}. As três CDs são calculadas pela Tabela B.\n\n")
        if entry.get('example'):
            parts.append('**Composição:** C1 + C4 + C5; três condições; Maldição Voraz; dano escolhido 2d6. A CD de Escape é o maior valor entre 20 e (16 + Presença Final + nível de Controle da Corrupção); a CD de Forja é 18 e a CD da Fome é 17. A forja exige 1 TE (2 horas). As três marcas se apagam após o disparo. Um terceiro acerto Parcial também fecha as marcas: o dano ocorre, mas Agarrado exige pelo menos um Acerto Total na sequência.\n\n')
    return ''.join(parts).rstrip()


def manuscript():
    """Catalog regions always reflect the same data read by the site."""
    text = (ROOT / 'docs/runas-amaldicoadas.md').read_text()
    data = _catalog()
    for name, content in [('conditions', _conditions(data)), ('power', _power(data)), ('effects', _effects(data))]:
        pattern = r'<!-- cursed:' + name + r':start -->.*?<!-- cursed:' + name + r':end -->'
        replacement = f'<!-- cursed:{name}:start -->\n{content}\n<!-- cursed:{name}:end -->'
        if not re.search(pattern, text, flags=re.S):
            raise ValueError(f'Cursed Rune manuscript region missing: {name}')
        text = re.sub(pattern, lambda _: replacement, text, flags=re.S)
    return text


def apply(book):
    source = re.sub(r'^# [^\n]+\n+', '', manuscript(), count=1)
    rendered = subprocess.check_output(
        ['pandoc', '-f', 'markdown-tex_math_dollars', '-t', 'html5', '--wrap=none'],
        input=source, text=True,
    )
    append_section(chapter(book, 9), 'runas-amaldicoadas', 'Runas Amaldiçoadas', rendered)
    append_section(chapter(book, 14), 'maldição-selada-na-arma', 'A maldição selada na arma',
                   '<p>Uma Runa Amaldiçoada é um parasita espiritual ou fragmento faminto da Marca selado em uma arma. Criar, gravar, manipular, suprimir ou interagir com a maldição usa sempre Presença + Controle da Corrupção. Presença 0 destreinada usa 1d20 −4; com treinamento, usa 1d20 +2, +5 ou +10, sem acumular o −4.</p>'
                   '<p>Ao obter 1 natural no dado selecionado de um ataque com a arma amaldiçoada, faça Presença + Controle da Corrupção contra CD 14 + o número de Condições da Runa. Sucesso evita a Fome; falha causa 1d6 de dano Corrupto direto ao portador. Esse dano não é um gasto de Karma nem se converte em Carga Temporária. A forja ou alteração exige 1 TE (2 horas) e teste contra a CD de Forja da faixa. A vítima usa a maior CD entre a fixa da faixa e a escalonada por Presença Final e nível de Controle. As vinte condições e as trinta runas estão em <a href="/regras/9-karma#runas-amaldicoadas">Runas Amaldiçoadas, no Capítulo 9</a>.</p>')
    append_section(chapter(book, 17), 'armas-com-runas-amaldicoadas', 'Armas com Runas Amaldiçoadas',
                   '<p>Apenas armas de contato, arremesso, disparo ou armas de magos podem receber uma Runa Amaldiçoada. Cada arma comporta uma única maldição; ela ocupa todos os encaixes dessa arma, impede novas Runas Kármicas convencionais e destrói as inscrições comuns existentes ao ser selada. O vínculo amaldiçoado não retém Karma nem ocupa vaga pessoal do portador.</p>'
                   '<p>Registre no equipamento o efeito escolhido, de uma a cinco Condições distintas entre C1 e C20, o dado de dano permitido e as alternativas de C7 e C10 quando usadas. C8 exige estar ferido e paga 4 de Vida no despertar; C17 paga 2 de Karma no fechamento do ciclo. Gravar ou alterar exige 1 TE (2 horas) e Presença + Controle da Corrupção contra a CD de Forja. A CD de Escape da Vítima é sempre a maior entre a fixa da faixa e sua fórmula escalonada; não é escolhida pelo portador. Consulte as três CDs em <a href="/regras/9-karma#runas-amaldicoadas">Runas Amaldiçoadas, no Capítulo 9</a>. A quantidade de condições define a potência, sem Graus de técnica ou tabela de Etapas.</p>')
