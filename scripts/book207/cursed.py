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
    rows = ['| Código | Condição de Despertar | Procedimento |', '|---|---|---|']
    rows.extend(f"| {entry['id']} | {entry['name']} | {entry['description']} |" for entry in data['conditions'])
    return '\n'.join(rows)


def _power(data):
    rows = [
        '| Condições | Classificação | Dano no Despertar | Estado em Acerto Total | CD da vítima | CD de forja |',
        '|---|---|---|---|---|---|',
    ]
    for entry in data['powerLevels']:
        damage = ' ou '.join([entry['damage'], *entry['alternatives']])
        victim = f"{entry['escapeDC']} ou {entry['scalingBase']} + PRE + Controle"
        rows.append(f"| {entry['conditions']} | {entry['classification']} | {damage} | {entry['stateDescription']} | {victim} | {entry['forgeDC']} |")
    return '\n'.join(rows)


def _effects(data):
    parts = []
    for index, entry in enumerate(data['effects']):
        label = 'Exemplo canônico' if entry.get('example') else f"Efeito {index}"
        parts.append(f"#### {label} — {entry['name']} {{#cursed-effect-{entry['id']}}}\n\n")
        parts.append(f"**{entry['epithet']}.** {entry['effect']}\n\n")
        if entry.get('example'):
            parts.append('**Composição:** C1 + C4 + C5; três condições; Maldição Voraz; dano escolhido 2d6; CD fixa 20 para escapar e CD 18 para a forja. As três marcas se apagam após o disparo. Um terceiro acerto Parcial também fecha as marcas: o dano ocorre, mas Agarrado exige pelo menos um Acerto Total na sequência.\n\n')
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
                   '<p>Ao obter 1 natural no dado selecionado de um ataque com a arma amaldiçoada, faça Controle contra CD 14 + o número de Condições da Runa. Sucesso evita a Fome; falha causa 1d6 Corrupto ao portador ou +1 Carga Temporária, conforme a consequência registrada. Essa Carga é temporária e segue as regras da Marca; não a confunda com Carga efetiva. As tabelas de criação e os 21 efeitos estão em <a href="/regras/9-karma#runas-amaldicoadas">Runas Amaldiçoadas, no Capítulo 9</a>.</p>')
    append_section(chapter(book, 17), 'armas-com-runas-amaldicoadas', 'Armas com Runas Amaldiçoadas',
                   '<p>Apenas armas de contato, arremesso, disparo ou armas de magos podem receber uma Runa Amaldiçoada. Cada arma comporta uma única maldição; ela ocupa todos os encaixes dessa arma, impede novas Runas Kármicas convencionais e destrói as inscrições comuns existentes ao ser selada. O vínculo amaldiçoado não retém Karma nem ocupa vaga pessoal do portador.</p>'
                   '<p>Registre no equipamento o efeito escolhido, de uma a cinco Condições distintas, o dado de dano permitido, o modo de CD da vítima e as alternativas próprias de C7 e C8 quando utilizadas. Criar ou interagir usa Presença + Controle da Corrupção; as CDs de forja e de resistência estão em <a href="/regras/9-karma#runas-amaldicoadas">Runas Amaldiçoadas, no Capítulo 9</a>. A quantidade de condições define a potência, sem Graus de técnica ou tabela de Etapas.</p>')
