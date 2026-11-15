"""Author-approved foundations, lineage procedures, vows and expeditions."""
import json
from pathlib import Path
import re

from lxml import etree, html

from .common import append_section, chapter, replace as replace_text


ROOT = Path(__file__).resolve().parents[2]


def replace(item, old, new):
    # Some clarifications extend an existing complete sentence.
    if new not in item['html']:
        replace_text(item, old, new)


def _racial_blocks(item):
    """Render complete source descriptions without assigning an invented action."""
    races = json.loads((ROOT / 'data/racial-progression.json').read_text())
    tree = html.fragment_fromstring(item['html'], create_parent='div')
    for race in races.values():
        for feature in race['features']:
            title = f"Etapa {feature['stage']} — {feature['name']}"
            headings = [node for node in tree.xpath('.//h4') if node.text_content() == title]
            if len(headings) != 1:
                raise ValueError(f'Expected one lineage feature heading: {title}')
            heading = headings[0]
            following = list(heading.itersiblings())
            for node in following:
                if node.tag in ('h2', 'h3', 'h4'):
                    break
                node.getparent().remove(node)
            listing = html.Element('ul')
            # Keep every sentence; only an action expressly present in the source
            # can label a passage as a Reaction or Free Action.
            sentences = re.split(r'(?<=[.!?])\s+(?=[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ])', feature['description'])
            for text in sentences:
                if 'Ação Livre ou Reação' in text or 'Ação Livre no seu turno ou Reação' in text:
                    label = 'Ação Livre ou Reação'
                elif re.search(r'\bReação\b', text) and re.search(r'como Reação|usar sua Reação', text):
                    label = 'Reação'
                elif 'Ação Livre' in text:
                    label = 'Ação Livre'
                elif 'Ação de Movimento' in text:
                    label = 'Movimento'
                else:
                    label = 'Passivo'
                entry = etree.SubElement(listing, 'li')
                strong = etree.SubElement(entry, 'strong')
                strong.text = label + ':'
                strong.tail = ' ' + text
            heading.addnext(listing)
    item['html'] = ''.join(html.tostring(node, encoding='unicode') for node in tree)


def apply(book):
    core = chapter(book, 1)
    replace(core, 'Perícias Sociais usam Presença.',
            'Perícias Sociais usam Presença como padrão. Uma abordagem racional de Persuasão aceita pelo Mestre pode usar a reserva de Intelecto, mantendo o treinamento e sem Analítico.')

    creation = chapter(book, 2)
    append_section(creation, 'roteiro-da-criacao', 'Roteiro da criação', '''
<ol>
<li>Defina conceito e distribua os 10 pontos de Atributo, respeitando o limite de 5 nesta distribuição.</li>
<li>Escolha origem, raça e classe. Aplique os benefícios iniciais e o Traço Base racial uma única vez, mantendo separados os registros de cada fonte.</li>
<li>Distribua oito pontos-base de Perícia Comum; acrescente depois os pontos extras de origem, raça e classe. Respeite os tetos e redirecione uma sobreposição somente nos termos do benefício que a concedeu.</li>
<li>Registre afinidades, fontes de poder, equipamento e valores derivados. Use Etapa I, valor 1, nas fórmulas desde a criação.</li>
<li>Registre os ganhos de progressão da Linha I como ainda não recebidos. Eles entram uma única vez após a confirmação do primeiro marco do caminho: E → D, Marca I ou Renome I. Essa entrega não reaplica raça, classe ou pontos iniciais.</li>
</ol>''')

    skills = chapter(book, 3)
    replace(skills,
            'some o menor valor entre 3 e metade do Intelecto final, arredondada para baixo. Resultado = dado selecionado + treinamento (+2, +5 ou +10) + mínimo entre 3 e piso de Intelecto ÷ 2.',
            'some o Intelecto final, limitado a +3. Resultado = dado selecionado + treinamento (+2, +5 ou +10) + mínimo entre 3 e Intelecto final.')
    replace(skills,
            'Use outro Atributo apenas quando uma técnica ou Domínio autorizar a substituição. Declare-a antes de rolar.',
            'Uma abordagem racional coerente de Persuasão, aceita pelo Mestre, pode usar a reserva de dados de Intelecto, mantendo o treinamento de Persuasão e sem somar Analítico. Declare a abordagem antes de rolar.')
    replace(skills,
            'Se uma técnica permitir usar Intelecto, a reserva passa a 3d20 +5.',
            'Se o Mestre aceitar uma abordagem racional coerente, a reserva de Intelecto passa a 3d20 +5, sem Analítico.')
    replace(skills,
            'Com Presença 0, role 1d20 −4 sem treinamento.',
            'Com Presença 0, um teste destreinado usa 1d20 −4; uma perícia treinada usa 1d20 +2, +5 ou +10, conforme o nível, sem acumular a penalidade −4.')
    replace(skills,
            'Negociação, diplomacia, pedido e argumentação. Usa Presença ou Intelecto.',
            'Negociação, diplomacia, pedido e argumentação. Usa Presença como padrão; uma abordagem racional coerente aceita pelo Mestre pode usar a reserva de Intelecto, mantendo o treinamento e sem Analítico.')

    progression = chapter(book, 4)
    replace(progression,
            'A cada nova Marca de progressão, o personagem escolhe uma Adaptação.',
            'Ao alcançar cada novo patamar de Marca I a VII, o personagem escolhe uma Adaptação. Unidades de Marca acumuladas em uma expedição não concedem Adaptações separadas.')
    append_section(progression, 'abertura-e-confirmacao-da-linha-i', 'Abertura e confirmação da Linha I', '''
<p>Desde a criação, use Etapa I (1) nas fórmulas e receba os benefícios iniciais de raça e classe. Registre separadamente os ganhos da Linha I nas tabelas de progressão: eles são entregues uma única vez na confirmação do primeiro marco do caminho, E → D na Guilda, Marca I na Torre ou Renome I no Independente. Atingir a quantidade exigida não dispensa a aprovação própria de cada caminho.</p>
<p>A confirmação concede a recompensa da Linha I e os ganhos gerais e de classe nela indicados; não reaplica bônus iniciais. As Linhas II a VII mantêm suas próprias condições e recompensas. Registre cada entrega para impedir duplicação.</p>
<p>O caminho de progressão deste capítulo organiza recompensas de Guilda, Torre ou Renome. O Caminho Pessoal do Capítulo 11 organiza Axioma e manifestações próprias. Sua vertente Independente significa ausência de Bênção, sem exigir abandonar Guilda ou Torre.</p>''')

    _racial_blocks(chapter(book, 5))

    vows = chapter(book, 16)
    replace(vows, '+10 de treinamento +2 Analítico.', '+10 de treinamento +3 Analítico.')
    replace(vows,
            'A técnica precisa estar escrita antes da selagem. Usar Grau V consome o ápice compartilhado da cena.',
            'A técnica precisa estar escrita antes da selagem. Esta permissão de Peso 4 ou 5 pode dispensar pontualmente os requisitos ordinários de Etapa e treinamento para essa execução de Grau V. Não concede a fonte de poder nem acesso permanente: a fonte precisa estar disponível, e a execução conserva ação, custo, alcance, oposição e demais limites. Usar Grau V consome o ápice compartilhado da cena.')
    replace(vows,
            'A selagem é paga uma vez; custos das técnicas e das ativações continuam sendo pagos a cada uso.',
            'A selagem é paga uma vez; custos das técnicas e das ativações continuam sendo pagos a cada uso. A ativação do pacote ocorre uma vez por cena; sua cadência interna permanece a que estiver escrita. Assim, um pacote de +2 CA dura a cena contra a ameaça definida, enquanto a redução de 2 Karma da técnica nomeada pode aplicar-se uma vez por turno durante essa cena, mínimo 1 por execução.')

    threats = chapter(book, 18)
    replace(threats,
            'Quatro lacaios equivalem aproximadamente a uma criatura comum para planejar presença no encontro, sem garantir equivalência em qualquer área ou formação.',
            'Quatro lacaios equivalem aproximadamente a uma criatura comum para planejar presença no encontro, sem garantir equivalência em qualquer área ou formação. Para Contribuição, cada lacaio vale um quarto da recompensa-base de um inimigo comum do ranque: quatro compartilham a recompensa equivalente a um comum. Some as parcelas antes do arredondamento final por personagem.')
    replace(threats,
            'Use unidades de ameaça como estimativa, considerando criaturas da mesma faixa dos personagens:',
            'Use unidades de ameaça como estimativa. Defina a faixa de referência examinando as fichas e os recursos reais do grupo: Vida, CA, ataques, Graus acessíveis, Reações e recursos limitados. Etapa, ranque institucional e ranque de ameaça não são equivalentes automáticos. Para criaturas da faixa de referência:')

    expeditions = chapter(book, 19)
    replace(expeditions,
            'Uma jornada de viagem ocupa 8 TE; descanso longo, 8 horas.',
            'Uma jornada de viagem ocupa 8 TE, equivalentes a 16 horas; descanso longo, 8 horas, equivalentes a 4 TE. Rota e jornada são medidas distintas: a rota termina ao alcançar o Progresso necessário; não ganha duração fixa de 8 TE por isso.')
    replace(expeditions,
            'Uma unidade reúne o alimento, água e consumíveis ordinários necessários ao trecho, conforme ambiente e equipamento.',
            'Suprimento é uma contabilidade abstrata alternativa à compra e à carga detalhadas de ração, água e insumos ordinários. Escolha o método para a expedição e registre-o: não cobre novamente os mesmos alimentos e água no inventário avulso. As três unidades por espaço são a conversão deste método abstrato, sem compactar fisicamente itens do catálogo. Uma unidade reúne o alimento, água e consumíveis ordinários necessários ao trecho, conforme ambiente e equipamento.')
    replace(expeditions,
            'Cada personagem contribui no máximo uma vez por TE; pode participar em um TE posterior com uma tarefa diferente e significativa.',
            'O Mestre anuncia a CD de cada tarefa antes da rolagem, conforme a ação e as circunstâncias; a dificuldade da zona serve de referência quando pertinente. Não há um ajuste fixo obrigatório para todas as tarefas. Cada personagem contribui no máximo uma vez por TE; pode participar em um TE posterior com uma tarefa diferente e significativa.')
    replace(expeditions,
            'Se os limiares já produzirem um Evento correspondente, ele satisfaz essa consequência.',
            'Se os limiares já produzirem um Evento correspondente, ele satisfaz essa consequência. Ao concluir o repouso exposto, reinicie o contador comum de permanência em 0/6 TE. Essa reinicialização não remove a Pressão e o Evento já devidos pelas 8 horas de exposição.')
    append_section(expeditions, 'duracao-da-presenca-invocada', 'Duração da presença invocada', '''
<p>Fora de combate, a taxa única de manutenção de uma invocação cobre a cena de exploração por até 2 TE (4 horas), ou até uma mudança de zona, o que ocorrer primeiro. O esforço inicial e os custos seguem o Capítulo 15; iniciar um novo período ou mudar de zona renova a cobrança quando houver o esforço previsto. A taxa não transforma uma duração de rodadas em horas.</p>''')
