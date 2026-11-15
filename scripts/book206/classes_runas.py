"""Class doctrine and Karma cross references approved for the 2.0.6 book.

Class and Rune descriptions themselves are generated from character-rules.json,
karmic-runes.json and runas-karmicas.md by the existing content pipeline.
"""
from html import escape
from .common import chapter, replace


DOCTRINES = (
    ('Mercenário', 'Manobra de ataque', 'Impacto, Manobra, Quebra de guarda.'),
    ('Pugilista', 'Manobra de ataque', 'Impacto, Manobra, Quebra de guarda.'),
    ('Duelista', 'Manobra de ataque', 'Impacto, Manobra, Quebra de guarda.'),
    ('Tanque', 'Defesa / guarda ou condição / controle', 'Bloqueio, Proteção aliada, Provocação.'),
    ('Ranger', 'Manobra de ataque ou condição / controle', 'Precisão, Ocultação, Alvo isolado.'),
    ('Ladrão', 'Manobra de ataque ou condição / controle', 'Precisão, Ocultação, Alvo isolado.'),
    ('Assassino', 'Manobra de ataque ou condição / controle', 'Precisão, Ocultação, Alvo isolado.'),
    ('Samaritano', 'Suporte / cura', 'Cura, Purificação, Amparo.'),
    ('Curandeiro', 'Suporte / cura', 'Cura, Purificação, Amparo.'),
    ('Alquimista', 'Alcance / área ou suporte', 'Dispositivo, Preparação, Área.'),
    ('Inventor', 'Alcance / área ou suporte', 'Dispositivo, Preparação, Área.'),
    ('Bardo', 'Alcance / área ou suporte', 'Coordenação, Alcance, Sustentação.'),
    ('Ocultista', 'Alcance / área ou suporte', 'Alcance, Área, Sustentação.'),
    ('Especialista', 'Alcance / área ou suporte', 'Dispositivo, Preparação, Área.'),
    ('Invocador', 'Alcance / área ou suporte', 'Coordenação, Alcance, Sustentação.'),
    ('Elementalista', 'Alcance / área ou suporte', 'Alcance, Área, Sustentação.'),
    ('Conjurador', 'Alcance / área ou suporte', 'Alcance, Área, Sustentação.'),
    ('Escriba Kármico', 'Condição / controle', 'Condição, Controle, Selo.'),
)


OLD_DOCTRINE = '<p><strong>Reconheça a doutrina da classe.</strong> Um Duelista ou Pugilista pode economizar 1 Karma em uma manobra comprada; um Conjurador, em alcance, área ou sustentação; um Assassino, em precisão ou ocultação; um Tanque, em bloqueio ou proteção aliada. A economia só vale quando existe um componente que a doutrina possa aperfeiçoar. Ela entra no mesmo limite de redução da técnica.</p>'


def doctrine_html():
    rows = ''.join(
        '<tr><td>' + escape(name) + '</td><td>' + escape(component)
        + '</td><td>' + escape(scope) + '</td></tr>'
        for name, component, scope in DOCTRINES
    )
    return (
        '<p><strong>Reconheça a doutrina da classe.</strong> Ao construir uma técnica, '
        'desconte no máximo 1 Karma de um componente temático efetivamente comprado, '
        'conforme a tabela. Registre qual componente recebeu a economia. Sem componente '
        'elegível, não há desconto. A doutrina não concede função, fonte ou permissão nova, '
        'não altera habilidades prontas de custo próprio e entra no mesmo limite total de '
        'redução e no custo mínimo da técnica. Não some descontos de doutrina para '
        'ultrapassar 1 Karma e não desconte a manutenção separadamente.</p>'
        '<table data-class-doctrines="2.0.6"><thead><tr><th>Classe</th>'
        '<th>Componente temático</th><th>Aplicação</th></tr></thead><tbody>'
        + rows + '</tbody></table>'
    )


def apply(book):
    craft = chapter(book, 10)
    replace(craft, OLD_DOCTRINE, doctrine_html())
    karma = chapter(book, 9)
    old = 'Esses são os custos próprios da manobra, com alcance incluído.'
    new = (
        'Esses são os custos próprios da manobra, com alcance de até 15 metros incluído: '
        'não acrescente novamente o modificador de alcance Médio do Capítulo 10. '
        'A manobra ainda exige Canalização de Karma e os requisitos de Etapa e Grau '
        'indicados; a inclusão do alcance não dispensa esses requisitos.'
    )
    replace(karma, old, new)
