"""Approved elemental taxonomy and elemental procedures for chapters 10 and 12."""
from pathlib import Path
from html import escape
import json
from lxml import html
from .common import chapter, replace, append_section

ROOT = Path(__file__).resolve().parents[2]
TAXONOMY = json.loads((ROOT / 'data/elemental-taxonomy.json').read_text())


def taxonomy_table():
    groups = [(['Água'], 'Água'), (['Fogo'], 'Fogo'), (['Terra'], 'Terra'),
              (['Vento'], 'Ar / Vento'), (['Água', 'Fogo'], 'Água + Fogo'),
              (['Terra', 'Fogo'], 'Terra + Fogo')]
    rows = []
    for parents, label in groups:
        names = [entry['name'] for entry in TAXONOMY['subElements'] if entry['parents'] == parents]
        rule = ('Metade da defesa de ' + label if len(parents) == 1
                else 'Metade da maior defesa entre ' + ' e '.join(parents))
        rows.append('<tr><td>' + escape(label) + '</td><td>' + escape(', '.join(names))
                    + '</td><td>' + escape(rule + ', arredondada para baixo.') + '</td></tr>')
    return ('<table data-elemental-taxonomy="18"><thead><tr><th>Origem elemental</th>'
            '<th>Subdobras</th><th>Defesa parental</th></tr></thead><tbody>'
            + ''.join(rows) + '</tbody></table>')


def apply(book):
    c10 = chapter(book, 10)
    tree = html.fragment_fromstring(c10['html'], create_parent='div')
    heading = tree.xpath('./h2[@id="a-guarda-diante-das-subdobras"]')
    if not heading:
        raise ValueError('Chapter 10: elemental defense heading missing')
    table = heading[0].getnext()
    if table is None or table.tag != 'table':
        raise ValueError('Chapter 10: elemental taxonomy table missing')
    table.getparent().replace(table, html.fragment_fromstring(taxonomy_table()))
    c10['html'] = ''.join(html.tostring(node, encoding='unicode') for node in tree)
    replace(c10,
            'Use a defesa inteira contra seu elemento primário. Subdobras não têm defesa própria: aplique metade da defesa do elemento de origem, arredondando para baixo. Quando houver dois elementos-pai, escolha a maior defesa entre eles antes de dividir. Não some as duas.',
            'Os seis elementos primários são Fogo, Terra, Água, Ar (Vento), Luz e Trevas (Sombra). Use a defesa inteira contra o elemento primário. As 18 subdobras da tabela usam metade da defesa de seu elemento de origem, arredondada para baixo. Para Vapor e Magma / Lava, escolha a maior defesa entre os dois elementos-pai antes de dividir; não some as duas. Magma e Lava são nomes da mesma subdobra.')
    replace(c10,
            'O Raio é uma subdobra do Vento. Se a criatura tem 4 de Resistência contra Vento, ainda se protege de um ataque de Elemental / Raio. A descarga atravessa parte da guarda: reduza o dano em apenas 2 pontos.',
            'O Raio é uma subdobra do Vento. Se a criatura tem Resistência Alta (3) contra Vento, reduz o dano de um ataque de Elemental / Raio em 1 ponto.', required=False)
    if 'Não manipula a gravidade nem cria campos gravitacionais.' not in c10['html']:
        append_section(c10, 'peso-elemental', 'Peso',
                       '<p>' + escape(next(item['scope'] for item in TAXONOMY['subElements'] if item['name'] == 'Peso'))
                       + ' A técnica deve declarar alvo, intensidade, duração, teste e custo; o nome da subdobra não concede esses efeitos gratuitamente.</p>')

    c12 = chapter(book, 12)
    tree = html.fragment_fromstring(c12['html'], create_parent='div')
    mapping = {
        'fogo': 'Combustão, Cinza, Incandescência e Deflagração',
        'terra': 'Areia, Metal, Cristal e Peso',
        'água': 'Gelo, Geada, Névoa e Sangue',
        'ar': 'Raio, Som, Vácuo e Pressão Atmosférica',
    }
    for section_id in ['fogo', 'terra', 'água', 'ar', 'luz', 'trevas']:
        heading = tree.xpath('./h3[@id=$key]', key=section_id)
        if not heading:
            raise ValueError(f'Chapter 12: elemental heading {section_id} missing')
        derivation = None
        for node in heading[0].itersiblings():
            if node.tag == 'h3':
                break
            if node.tag == 'p' and node.text_content().startswith(('Subdobras e expressões derivadas incluem:', 'Subdobras desta origem:', 'Luz permanece', 'Trevas permanece')):
                derivation = node
                break
        if derivation is None:
            raise ValueError(f'Chapter 12: elemental derivations {section_id} missing')
        if section_id in mapping:
            content = 'Subdobras desta origem: ' + mapping[section_id] + '. A defesa parental é metade da defesa do elemento, arredondada para baixo. Consulte a tabela das 18 subdobras no Capítulo 10 para as origens mistas.'
        else:
            label = 'Luz' if section_id == 'luz' else 'Trevas'
            content = label + ' permanece um elemento primordial. A tabela canônica das 18 subdobras não acrescenta derivações desta origem.'
        derivation.clear()
        derivation.text = content
    c12['html'] = ''.join(html.tostring(node, encoding='unicode') for node in tree)
    replace(c12,
            'Fonte abundante pode conceder +1 dado a uma manipulação diretamente apoiada por ela; ausência extrema pode exigir +1 Karma ou impedir técnica que declare depender de matéria. O personagem ainda consegue criar pequena quantidade com Karma. Ambiente nunca concede dano gratuito e só fornece Vantagem se mudar de fato a dificuldade.',
            'Uma fonte elemental abundante concede Vantagem à manipulação diretamente apoiada por ela. Aplique a regra normal de Vantagem, sem acumular fontes adicionais do mesmo tipo. Ausência extrema pode exigir +1 Karma ou impedir técnica que declare depender de matéria. O personagem ainda consegue criar pequena quantidade com Karma. O ambiente não concede dano gratuito.')
    replace(c12,
            'Luz e Trevas são elementos neutros que se anulam mutuamente. Quando uma técnica de Luz for o ataque principal e encontrar defesa, técnica ou criatura cuja fonte principal seja Trevas, o lado de Trevas recebe Desvantagem no teste defensivo, na oposição ou na Evasão. Quando Trevas atacar Luz, o lado de Luz recebe a mesma Desvantagem.',
            'Registre a fonte elemental principal diretamente na ficha: ela é o primeiro elemento com que o ser nasceu ou que despertou. Conhecer outro elemento não troca essa origem. Quando uma técnica de Luz enfrenta um ser de fonte principal Trevas que se defende utilizando ou manifestando Trevas, esse ser recebe Desvantagem no teste defensivo, na oposição ou na Evasão. A regra é recíproca quando Trevas enfrenta fonte principal Luz que se defende utilizando ou manifestando Luz. A mera presença de uma segunda afinidade não aplica a penalidade a defesas que não usem o elemento oposto.')
    append_section(c12, 'as-18-subdobras', 'As 18 subdobras',
                   taxonomy_table() + '<p>'
                   + escape(next(item['scope'] for item in TAXONOMY['subElements'] if item['name'] == 'Peso'))
                   + ' Magma e Lava designam uma única subdobra. O acesso e o Grau da técnica continuam seguindo a progressão elemental.</p>')
