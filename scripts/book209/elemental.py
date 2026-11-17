"""Compile environmental elemental inscriptions from their shared catalog."""
from html import escape
import json
from pathlib import Path
import re
import subprocess

from book206.common import append_section, chapter

ROOT = Path(__file__).resolve().parents[2]
CATALOG_SECTION = 'runas-elementais-ambientais'
CATALOG_URL = f'/regras/12-elementos-primordiais#{CATALOG_SECTION}'


def _catalog():
    data = json.loads((ROOT / 'data/elemental-runes.json').read_text())
    runes = data.get('runes', [])
    numbers = [rune.get('number') for rune in runes]
    identifiers = [rune.get('id') for rune in runes]
    if (len(runes) != 24 or sorted(numbers) != list(range(1, 25))
            or any(not isinstance(value, str) or not value for value in identifiers)
            or len(set(identifiers)) != 24):
        raise ValueError('Environmental Rune catalog must contain 24 uniquely identified, numbered runes')
    if (sum(rune.get('kind') == 'primary' for rune in runes) != 6
            or sum(rune.get('kind') == 'subelement' for rune in runes) != 18):
        raise ValueError('Environmental Rune catalog must contain six primary and eighteen derived inscriptions')
    if (set(data.get('inscriptionSupports', [])) != {'ground', 'mageFocus'}
            or data.get('usesWeaponSlots') is not False
            or data.get('usesPersonalSlots') is not False
            or data.get('retainsKarma') is not False
            or data.get('minimumControlLevel') != 1
            or data.get('regent') != 'Intelecto'
            or data.get('controlDCBase') != 12
            or data.get('taxonomyScope') != 'environmentalOnly'
            or data.get('timing') != {
                'durationRounds': 3, 'pulseOffsets': [0, 1, 2], 'groundReach': 1,
                'fixedCenter': True, 'stackIdenticalEffects': False, 'spendOnAttempt': True,
            }):
        raise ValueError('Environmental Rune inscription policy does not match the approved subsystem')
    for rune in runes:
        if any(not isinstance(rune.get(key), str) or not rune[key].strip()
               for key in ('name', 'element', 'expression', 'effect')):
            raise ValueError(f"Environmental Rune {rune['number']} is incomplete")
        if not rune.get('parents') or any(not isinstance(parent, str) or not parent
                                          for parent in rune['parents']):
            raise ValueError(f"Environmental Rune {rune['number']} has no elemental origin")
        radius = rune.get('radius')
        if isinstance(radius, bool) or not isinstance(radius, (int, float)) or not 10 <= radius <= 20:
            raise ValueError(f"Environmental Rune {rune['number']} has an invalid radius")
    canonical = json.loads((ROOT / 'data/elemental-taxonomy.json').read_text())
    expected = {entry['name']: entry['parents'] for entry in canonical['subElements']}
    actual = {rune['expression']: rune['parents'] for rune in runes if rune['kind'] == 'subelement'}
    if actual != expected:
        raise ValueError('Environmental Rune expressions must match the eighteen canonical Subdobras')
    return data


def _parameters(data):
    parameters = data.get('parameters', {})
    missing = [key for key in ('inscriptionAction', 'karmaCost', 'duration', 'maxActiveZones')
               if parameters.get(key) is None]
    if missing:
        raise ValueError('Environmental Rune parameters still require an authorial decision: ' + ', '.join(missing))
    for key in ('inscriptionAction', 'duration'):
        if not isinstance(parameters[key], str) or not parameters[key].strip():
            raise ValueError(f'Environmental Rune parameter {key} must be a nonempty description')
    karma = parameters['karmaCost']
    limit = parameters['maxActiveZones']
    if isinstance(karma, bool) or not isinstance(karma, int) or karma < 0:
        raise ValueError('Environmental Rune Karma cost must be a nonnegative integer')
    if isinstance(limit, bool) or not isinstance(limit, int) or limit < 1:
        raise ValueError('Environmental Rune active-zone limit must be a positive integer')
    return parameters


def _cell(value):
    return str(value).replace('|', r'\|').replace('\n', ' ')


def _radius(rune, data):
    radius = rune.get('radius')
    if radius is not None:
        return f'{radius:g} m'.replace('.', ',')
    lower, upper = rune.get('radiusRange', data['radiusRange'])
    return f'{lower:g}–{upper:g} m'


def _rune_table(data, kind):
    rows = [
        '| Nº | Runa | Origem da inscrição | Raio | Efeito ambiental |',
        '|---|---|---|---|---|',
    ]
    for rune in sorted(data['runes'], key=lambda entry: entry['number']):
        if rune['kind'] != kind:
            continue
        values = [rune['number'], rune['name'], ' + '.join(rune['parents']), _radius(rune, data), rune['effect']]
        rows.append('| ' + ' | '.join(_cell(value) for value in values) + ' |')
    return '\n'.join(rows)


def manuscript():
    """Render the manuscript's tables from the same data used by the site."""
    data = _catalog()
    parameters = _parameters(data)
    source = (ROOT / 'docs/runas-elementais.md').read_text()
    for name, kind in [('primary', 'primary'), ('subelements', 'subelement')]:
        pattern = rf'<!-- elemental:{name}:start -->.*?<!-- elemental:{name}:end -->'
        if len(re.findall(pattern, source, flags=re.S)) != 1:
            raise ValueError(f'Environmental Rune manuscript region missing or duplicated: {name}')
        replacement = f'<!-- elemental:{name}:start -->\n{_rune_table(data, kind)}\n<!-- elemental:{name}:end -->'
        source = re.sub(pattern, lambda _: replacement, source, flags=re.S)
    source += (
        '\n\n## Ação, custo e permanência\n\n'
        '| Ação de inscrição | Custo em Karma | Duração | Zonas ativas por portador |\n'
        '|---|---|---|---|\n'
        f"| {_cell(parameters['inscriptionAction'])} | {_cell(parameters['karmaCost'])} | "
        f"{_cell(parameters['duration'])} | {_cell(parameters['maxActiveZones'])} |\n"
    )
    return source


def apply(book):
    source = re.sub(r'^# [^\n]+\n+', '', manuscript(), count=1)
    source = re.sub(r'<!--.*?-->', '', source, flags=re.S)
    # The enclosing section owns H2; retain the manuscript's hierarchy inside it.
    source = re.sub(r'^(#{2,5}) ', lambda match: '#' + match.group(1) + ' ', source, flags=re.M)
    rendered = subprocess.check_output(
        ['pandoc', '-f', 'markdown-tex_math_dollars', '-t', 'html5', '--wrap=none'],
        input=source, text=True,
    )
    rendered += ('<p>A exclusividade de uma arma amaldiçoada também vale quando ela é um Foco de Mago. Consulte '
                 '<a href="/regras/14-corrupcao-e-a-marca#runas-amaldicoadas">as Runas Amaldiçoadas, no Capítulo 14</a>.</p>')
    c9, c10, c12 = (chapter(book, number) for number in (9, 10, 12))
    append_section(c9, 'tres-sistemas-de-inscricao', 'Três sistemas de inscrição',
                   '<p>Runas Kármicas, Runas Amaldiçoadas e Runas Elementais Ambientais têm procedimentos próprios. Identifique o sistema antes de gravar ou resolver uma inscrição.</p>'
                   '<ul><li><strong>Runas Kármicas</strong> - Retêm Karma e seguem os suportes, encaixes e limites pessoais de sua categoria. A inscrição comum usa Canalização de Karma; o Escriba conserva as permissões de sua classe.</li>'
                   '<li><strong>Runas Amaldiçoadas</strong> - Usam Presença + Controle da Corrupção e são exclusivas de armas. Uma maldição ocupa todos os encaixes do item e não admite inscrições convencionais no mesmo suporte.</li>'
                   '<li><strong>Runas Elementais Ambientais</strong> - Usam Intelecto + Controle do Elemento, com treinamento de nível 1 ou superior. São gravadas no solo ou em Focos de Mago, não ocupam vagas de armas nem vagas pessoais e não retêm Karma.</li></ul>'
                   '<p>Um Foco de Mago que já contenha uma Runa Amaldiçoada não pode receber uma Runa Elemental. A inscrição ambiental não contorna a exclusividade da maldição. Consulte '
                   f'<a href="{escape(CATALOG_URL, quote=True)}">as 24 Runas Elementais Ambientais, no Capítulo 12</a>, e '
                   '<a href="/regras/14-corrupcao-e-a-marca#runas-amaldicoadas">as Runas Amaldiçoadas</a>.</p>')
    append_section(c10, 'zonas-de-inscricao-elemental', 'Zonas de inscrição elemental',
                   '<p>Uma Runa Elemental Ambiental produz a zona e os efeitos indicados em sua entrada. Sua gravação usa Intelecto + Controle do Elemento, e sua CD é 12 + Intelecto final + nível de Controle. Ar e Vento designam a mesma origem; Trevas e Sombra também.</p>'
                   '<p>O dano da zona tem natureza Elemental. Contra um elemento primordial, aplique a defesa elemental inteira; contra uma subdobra, aplique metade da defesa parental, arredondada para baixo. Quando o efeito possuir dois elementos-pai, use metade da maior defesa entre eles, sem somá-las.</p>'
                   '<p>As dezoito expressões ambientais seguem a tabela geral de Subdobras. Som deriva de Ar (Vento); Vapor deriva de Água e Fogo, e Magma / Lava de Terra e Fogo. Peso altera apenas peso e carga física. Use as mesmas origens para calcular as defesas contra essas zonas.</p>'
                   '<p>Respeite o gatilho, a frequência e as medidas da inscrição: dano por rodada não é dano a cada metro percorrido, e dano por deslocamento só ocorre na distância indicada. Um teste ou uma CD expressamente definidos na entrada continuam valendo para aquele efeito. A inscrição não acrescenta dano ao ataque da arma portadora.</p>'
                   '<p>A abundância natural de um elemento continua sem conceder dano gratuito. O dano e as alterações de terreno das Runas Elementais são efeitos da inscrição, com sua ação, custo e duração próprios. Consulte '
                   f'<a href="{escape(CATALOG_URL, quote=True)}">o catálogo ambiental do Capítulo 12</a>.</p>')
    append_section(c12, CATALOG_SECTION, 'Runas Elementais Ambientais', rendered)
