"""Apply the canonical 1.2 mechanics and the Patch 1.3/1.4 updates.

Usage: python scripts/patch-rulebook.py input.docx output.docx
The source is never overwritten. This patch expects the pre-1.2 manuscript.
"""
from pathlib import Path
import sys

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Pt
from docx.text.paragraph import Paragraph


source, destination = map(Path, sys.argv[1:3])
if source.resolve() == destination.resolve():
    raise ValueError("Use a separate output; preserve the supplied original")
doc = Document(source)


def change(old, new):
    matches = [p for p in doc.paragraphs if p.text == old]
    if len(matches) != 1:
        raise ValueError(f"Expected one matching paragraph: {old[:90]} ({len(matches)})")
    p = matches[0]
    prefix = p.text.split(":", 1)[0] + ":" if ":" in p.text and p.runs and p.runs[0].bold else None
    p.clear()
    if prefix and new.startswith(prefix):
        p.add_run(prefix).bold = True
        p.add_run(new[len(prefix):])
    else:
        p.add_run(new)
    return p


def insert_after(anchor, text, style=None):
    element = OxmlElement("w:p")
    anchor._p.addnext(element)
    p = Paragraph(element, anchor._parent)
    p.style = style or "Normal"
    p.add_run(text)
    return p


def find(text):
    return next(p for p in doc.paragraphs if p.text == text)


def add_reference_table_after(anchor, headers, rows, ratios):
    """Insert a readable reference table and return a paragraph after it."""
    reference_table = doc.add_table(rows=1, cols=len(headers))
    reference_table.style = doc.tables[2].style
    reference_table.autofit = False
    for cell, text in zip(reference_table.rows[0].cells, headers):
        cell.text = text
    for values in rows:
        for cell, text in zip(reference_table.add_row().cells, values):
            cell.text = text

    usable = int((doc.sections[0].page_width - doc.sections[0].left_margin - doc.sections[0].right_margin) / 635)
    widths = [int(usable * ratio) for ratio in ratios[:-1]]
    widths.append(usable - sum(widths))
    properties = reference_table._tbl.tblPr
    table_width = properties.find(qn("w:tblW"))
    table_width.set(qn("w:w"), str(usable)); table_width.set(qn("w:type"), "dxa")
    table_indent = OxmlElement("w:tblInd"); table_indent.set(qn("w:w"), "120"); table_indent.set(qn("w:type"), "dxa"); properties.append(table_indent)
    margins = OxmlElement("w:tblCellMar")
    for side, value in [("top", 80), ("bottom", 80), ("start", 110), ("end", 110)]:
        margin = OxmlElement(f"w:{side}"); margin.set(qn("w:w"), str(value)); margin.set(qn("w:type"), "dxa"); margins.append(margin)
    properties.append(margins)
    borders = OxmlElement("w:tblBorders")
    for side in ["top", "left", "bottom", "right", "insideH", "insideV"]:
        edge = OxmlElement(f"w:{side}"); edge.set(qn("w:val"), "single"); edge.set(qn("w:sz"), "4"); edge.set(qn("w:color"), "777777"); borders.append(edge)
    properties.append(borders)
    for column, width in zip(reference_table._tbl.tblGrid.gridCol_lst, widths):
        column.set(qn("w:w"), str(width))
    for row_index, row in enumerate(reference_table.rows):
        row_properties = row._tr.get_or_add_trPr()
        row_properties.append(OxmlElement("w:cantSplit"))
        if row_index == 0:
            row_properties.append(OxmlElement("w:tblHeader"))
        for column_index, (cell, width) in enumerate(zip(row.cells, widths)):
            cell_properties = cell._tc.get_or_add_tcPr()
            cell_properties.find(qn("w:tcW")).set(qn("w:w"), str(width))
            vertical = OxmlElement("w:vAlign"); vertical.set(qn("w:val"), "center"); cell_properties.append(vertical)
            if row_index == 0:
                fill = OxmlElement("w:shd"); fill.set(qn("w:fill"), "D9D9D9"); cell_properties.append(fill)
            for paragraph in cell.paragraphs:
                paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER if column_index in (0, 2, 4) else WD_ALIGN_PARAGRAPH.LEFT
                paragraph.paragraph_format.space_after = Pt(3)
                paragraph.paragraph_format.line_spacing = 1.0
                for run in paragraph.runs:
                    run.font.size = Pt(8.2); run.bold = row_index == 0

    anchor._p.addnext(reference_table._tbl)
    spacer_element = OxmlElement("w:p")
    reference_table._tbl.addnext(spacer_element)
    spacer = Paragraph(spacer_element, anchor._parent)
    spacer.paragraph_format.space_after = Pt(0)
    return spacer, reference_table


change("Resultado do teste = dado selecionado da reserva do Atributo + (2 × nível da Perícia).", "Resultado do teste = dado selecionado da reserva do Atributo + (2 × nível da Perícia) + bônus específicos aplicáveis. O bônus Analítico do Intelecto é uma dessas exceções, detalhada no Capítulo 3; não some o Atributo inteiro ao resultado.")
change("Liora possui Intelecto 5 e Medicina 2. Intelecto 5 concede 3d20; ela escolhe o maior e soma +4, pois 2 × 2 = 4. Se os dados mostrarem 8, 14 e 17, o resultado final será 21.", "Liora possui Intelecto 5 e Medicina 2. Intelecto 5 concede 3d20; ela escolhe o maior e soma +4 pelo treinamento e +2 de bônus Analítico. Se os dados mostrarem 8, 14 e 17, o resultado final será 23. Medicina permanece no nível 2: o bônus Analítico não compra evolução.")
change("Intelecto: memória, raciocínio, estudo, análise e técnica.", "Intelecto: memória, raciocínio, estudo, análise, técnica e compreensão racional de pessoas e contextos sociais. Fortalece testes mentais treinados e pode reger abordagens sociais racionais, conforme o Capítulo 3.")
change("Presença: influência, identidade, comando, expressão e força do eu.", "Presença: influência direta, identidade, comando, expressão e força do eu. É o único Atributo regente dos testes e parcelas de Atributo de Conjuração Vincular, Comunhão Divina e Controle da Corrupção.")
life = change("Vida máxima: 10 + (2 × Constituição) + Força.", "Vida máxima: Vida-base do tamanho + (2 × Constituição) + Força + bônus aplicáveis de raça, classe, progressão e efeitos. Médio possui Vida-base 14.")
change("Karma máximo: 6 + 2 × Espírito.", "Karma máximo: 10 + (2 × Espírito) + bônus aplicáveis. Espírito continua regendo a capacidade da reserva, não os testes das três fontes exclusivas de Presença.")
change("CA sem armadura: 10 + Agilidade.", "CA sem armadura: 12 + Agilidade + ajuste de tamanho + outros bônus aplicáveis.")
change("Deslocamento: 5 + Agilidade em metros.", "Deslocamento: 5 + Agilidade + ajuste de tamanho + bônus aplicáveis, em metros; mínimo 1 metro antes de condições que impeçam movimento.")
change("Receba 8 pontos-base de Perícia Comum. Cada ponto aumenta uma Perícia em um nível, até o nível 2 durante a criação. Depois de distribuir os 8 pontos, aplique os bônus extras de raça e classe. Eles não consomem pontos-base; se um bônus elevar uma Perícia acima de 2, transfira o excesso para outra Perícia permitida pela mesma fonte, salvo regra que declare expressamente ultrapassar esse limite.", "Receba 8 pontos-base de Perícia Comum. Cada ponto aumenta uma Perícia em um nível, até o nível 2 durante a criação. Depois de distribuir os 8 pontos, aplique os bônus extras de raça e classe. Eles não consomem pontos-base, mas são Comuns e compartilham o teto do nível 2. Se houver excesso, redistribua os pontos-base ou a escolha flexível entre Perícias permitidas; um bônus fixo não vira Evolutivo. O voto especial do Capítulo 16 concede somente um teste temporário, nunca pontos permanentes de evolução.")

anchor = find("Limite de carga confortável: 8 + (2 × Força) espaços.")
anchor = insert_after(anchor, "Tamanho, altura e equilíbrio", "Heading 2")
anchor = insert_after(anchor, "Escolha o porte na criação. A altura informada determina a categoria; sem altura, registre diretamente um tamanho. As fronteiras abaixo pertencem a uma única categoria, evitando dupla contagem.")
table = doc.add_table(rows=1, cols=5)
table.style = doc.tables[2].style
headers = ["Tamanho", "Altura", "Movimento", "Vida-base", "CA"]
rows = [
    ["Minúsculo", "0,30 m a menos de 0,70 m", "sem ajuste", "8", "+0"],
    ["Pequeno", "0,70 m a menos de 1,30 m", "sem ajuste", "10", "+0"],
    ["Médio", "1,30 m a menos de 2,10 m", "sem ajuste", "14", "+0"],
    ["Grande", "2,10 m ou mais", "−1 m", "18", "+1"],
]
for cell, text in zip(table.rows[0].cells, headers): cell.text = text
for row in rows:
    for cell, text in zip(table.add_row().cells, row): cell.text = text
anchor._p.addnext(table._tbl)
anchor_element = table._tbl
for text in [
    "A tabela altera apenas a base dos personagens jogadores. Não substitui as fichas próprias de monstros, veículos ou invocações. Vida e Karma recebem os bônus normais depois da base; apenas o ajuste de CA de Grande é somado. Não conceda alcance, dano, Resistência, carga ou encaixe em frestas automaticamente pelo nome da categoria.",
    "O ganho de robustez troca mobilidade por sobrevivência. Grande perde 1 metro, valor que também reduz a distância de corrida quando ela multiplica o Deslocamento. Minúsculo e Pequeno possuem menor reserva de Vida, sem ganhar velocidade gratuita. Esses bônus não se repetem por raça ou transformação: use uma única categoria mecânica.",
    "Com Constituição 2, Força 1 e Agilidade 2, antes de raça e classe, Minúsculo possui Vida 13, movimento 7 m e CA 14; Pequeno, Vida 15, movimento 7 m e CA 14; Médio, Vida 19, movimento 7 m e CA 14; Grande, Vida 23, movimento 6 m e CA 15. Todos mantêm a mesma fórmula de Karma. A CA maior não é imunidade: os limiares de acerto parcial e total do Capítulo 7 continuam valendo.",
    "Tamanho não muda com postura, roupas, cabelo, envelhecimento cosmético ou edição oportunista de altura. Mudança mecânica exige transformação ou revisão aprovada pelo Mestre fora da resolução em curso. Não acumule categorias. Ao migrar uma ficha antiga sem porte, use Médio provisoriamente e confirme na mesa. Recalcular máximos não cura nem recupera Karma atual: preserve o valor atual, limitado ao novo máximo, até a recuperação apropriada.",
]:
    element = OxmlElement("w:p"); anchor_element.addnext(element)
    p = Paragraph(element, doc._body); p.style = "Normal"; p.add_run(text); anchor_element = element

anchor = find("Perícias descrevem treinamento. O Atributo muda conforme a abordagem: Intimidação pode usar Presença ao dominar uma conversa, Força ao demonstrar violência ou Espírito ao impor uma aura sobrenatural. O Mestre deve aceitar combinações coerentes e recusar trocas feitas apenas para usar o maior Atributo sem relação com a ação.")
anchor = insert_after(anchor, "Intelecto: compreensão que se torna vantagem", "Heading 2")
for text in [
    "Bônus Analítico: em um teste de Perícia mental ou social treinada (nível 1 ou maior) efetivamente regido por Intelecto, some o menor valor entre 3 e metade do Intelecto final, arredondada para baixo. A fórmula é dado da reserva + 2 × nível + mínimo(3, piso(Intelecto ÷ 2)). Aplica-se uma vez por teste, além da reserva habitual; não acrescenta dados, níveis, dano, cura, duração, CA ou pré-requisitos.",
    "São mentais: Criação, História, Investigação, Medicina, Ocultismo, Percepção, Religião, Tática e Condução. São sociais: Atuação, Enganação, Intimidação, Liderança, Persuasão, Trato com Animais e Submundo. Nenhuma Perícia foi criada. A abrangência vem da abordagem, não de renomear ou duplicar treinamento.",
    "Abordagem racional social: antes de rolar, descreva argumento, leitura de comportamento, preparação, estratégia ou conhecimento do contexto. Nessa abordagem, use Intelecto no lugar de Presença se Intelecto for maior; some o bônus Analítico apenas se Intelecto for realmente usado e a Perícia for treinada. Não some os dois Atributos. Presença continua adequada para carisma imediato, autoridade e expressão; influência não controla a mente nem remove consentimento.",
    "Percepção só usa o bônus Analítico quando a tarefa é interpretar pistas; notar um ruído por instinto pode usar outro Atributo. Condução recebe o bônus ao planejar uma manobra ou compreender a máquina, não automaticamente ao reagir com Agilidade. Medicina pode aprimorar o teste de diagnóstico; o bônus não se soma à cura. Uma Perícia mental realizada com Espírito não recebe também o bônus de Intelecto.",
    "Exemplo social: Intelecto 6, Presença 2 e Persuasão 2 permitem, num argumento racional coerente, rolar 3d20 e somar +7 (+4 de treinamento e +3 Analítico). Numa abordagem puramente carismática com Presença, seriam 1d20 +4. Se Persuasão fosse 0, a abordagem racional usaria 2d20 +0, sem bônus Analítico. Não há evolução gratuita: nível 2 continua nível 2.",
]: anchor = insert_after(anchor, text)
anchor = insert_after(anchor, "Presença: regência exclusiva dos vínculos", "Heading 2")
for text in [
    "Conjuração Vincular é um uso da Perícia Conjuração, não um treinamento separado. Somente ela, Comunhão Divina e Controle da Corrupção exigem Presença como regente. Conjuração comum mantém o Atributo da abordagem ou técnica, como Espírito para contenção. Nos três usos exclusivos, não some nem substitua Presença por Intelecto ou Espírito.",
    "Atributo regente significa a reserva de d20 e qualquer parcela que a própria técnica escreva como Atributo do conjurador, comunicante ou portador da Corrupção. Nesses três casos, essa parcela é Presença. Em Presença 0, role 2d20 e escolha o menor, com as regras normais de treinamento e Vantagem. Bônus de raça, classe e progressão que aumentem Presença continuam pertencendo ao seu valor final.",
    "Separação de funções: Karma máximo permanece 10 + 2 × Espírito + bônus; Favor permanece 0–3; Carga, 0–10; graus e quantidade de invocações continuam limitados por Conjuração. Esses recursos e tabelas não viram multiplicadores de Presença. Atributos das criaturas são próprios. Manifestação de Bênção conserva o regente definido por seu Núcleo; ela não é Comunhão Divina. Canalização de Karma, Controle Elemental e Domínios não mudam por esta regra.",
]: anchor = insert_after(anchor, text)

change("Conjuração: Firmar pactos, chamar seres e manter invocações. Usa Presença para vínculo ou Espírito para contenção.", "Conjuração: firmar pactos, chamar seres e manter invocações. O Atributo segue a abordagem ou técnica; contenção comum usa Espírito. Somente o uso Conjuração Vincular exige Presença. Grau e quantidade de pactos seguem o Capítulo 15.")
change("CA = 10 + Agilidade permitida pela armadura + armadura + escudo ativo + outros bônus.", "CA = 12 + Agilidade permitida pela armadura + armadura + escudo ativo + ajuste de tamanho + outros bônus. Grande acrescenta +1; as demais categorias não alteram CA. A tabela de armaduras não muda.")
change("Karma máximo = 6 + (2 × Espírito) + bônus de classe, raça, origem, item e habilidade.", "Karma máximo = 10 + (2 × Espírito) + bônus de classe, raça, origem, item e habilidade.")
change("Sempre que uma regra conceder Carga por uma falha, faça Presença ou Espírito + Controle da Corrupção contra CD 14 + sua Carga atual. A ação que provocou o teste é resolvida; o resultado determina quanto espaço a Voz encontra depois dela.", "Sempre que uma regra conceder Carga por uma falha, faça Presença + Controle da Corrupção contra CD 14 + sua Carga atual. Apenas Presença monta a reserva; Espírito e Intelecto não substituem nem se somam. A ação que provocou o teste é resolvida; o resultado determina quanto espaço a Voz encontra depois dela.")
change("O Guia combina Atributo e Perícia conforme o método. Intelecto + Sobrevivência lê o terreno; Intelecto + Investigação segue documentos; Espírito + Comunhão Divina acompanha uma rota sagrada; Agilidade + Reflexos conduz um veículo sob risco. Fora da Torre, uma falha comum ainda move a equipe, mas cobra um preço.", "O Guia combina Atributo e Perícia conforme o método. Intelecto + Sobrevivência lê o terreno; Intelecto + Investigação segue documentos; Presença + Comunhão Divina acompanha uma rota sagrada; Agilidade + Reflexos conduz um veículo sob risco. Investigação treinada com Intelecto recebe bônus Analítico; Sobrevivência e Reflexos não pertencem aos grupos mental ou social. Fora da Torre, uma falha comum ainda move a equipe, mas cobra um preço.")

# Patch 1.4: reduce Invocation Attributes and keep only one secondary Attribute.
invocation_table = next(
    table for table in doc.tables
    if len(table.rows) == 6
    and len(table.columns) == 7
    and table.cell(0, 0).text.strip() == "Grau"
    and table.cell(0, 1).text.strip() == "Atributos"
)
invocation_table.cell(0, 1).text = "Atributo principal"
for row_index, value in enumerate(["3", "5", "7", "9", "12"], start=1):
    invocation_table.cell(row_index, 1).text = value
for row_index, row in enumerate(invocation_table.rows):
    for cell in row.cells:
        for paragraph in cell.paragraphs:
            for run in paragraph.runs:
                run.bold = row_index == 0

change(
    "O valor de Atributo é real e usa a reserva do Capítulo 1: 3 gera 2d20; 5, 3d20; 7, 4d20; 9, 5d20. Escolha um Atributo principal no valor da tabela, dois Atributos secundários dois pontos abaixo, mínimo 1, e mantenha os demais em 1. Escolha duas Perícias principais no nível indicado e uma Perícia fraca em 0.",
    "O valor do Atributo principal é real e usa a reserva do Capítulo 1: 3 gera 2d20; 5, 3d20; 7, 4d20; 9, 5d20; 12, 6d20. O número na tabela é o nível do Atributo principal, não um total de pontos para distribuir. Escolha um Atributo principal no valor indicado e somente um Atributo secundário dois pontos abaixo, mínimo 1. Todos os quatro Atributos restantes ficam no nível 1. Escolha duas Perícias principais no nível indicado e uma Perícia fraca em 0.",
)
change(
    "Atributos: Agilidade 3; Constituição e Espírito 1; demais 1. Perícias: Reflexos 1, Percepção 1. CA 12; Vida 6; Deslocamento 11 m; dano 1d6 de Fogo; chamada 2; manutenção 0.",
    "Atributos: principal Agilidade 3; secundário Constituição 1; demais 1. Perícias: Reflexos 1, Percepção 1. CA 12; Vida 6; Deslocamento 11 m; dano 1d6 de Fogo; chamada 2; manutenção 0.",
)
change(
    "Atributos: Constituição 5; Força e Espírito 3. Perícias: Atletismo 2, Percepção 2, Reflexos 0. CA 20; Vida 22; Deslocamento 8 m; dano 1d10 físico; chamada 6; manutenção 2.",
    "Atributos: principal Constituição 7; secundário Força 5; demais 1. Perícias: Atletismo 2, Percepção 2, Reflexos 0. CA 20; Vida 22; Deslocamento 8 m; dano 1d10 físico; chamada 6; manutenção 2.",
)

# Replace only the requested chapter, including its old table, at its original position.
start = find("Capítulo 16 — Votos Vinculativos")
end = find("Capítulo 17 — Equipamento e economia") if any(p.text == "Capítulo 17 — Equipamento e economia" for p in doc.paragraphs) else next(p for p in doc.paragraphs if p.text.startswith("Capítulo 17 —"))
node = start._p.getnext()
while node is not end._p:
    following = node.getnext(); node.getparent().remove(node); node = following

from vow_chapter_content import VOW_SECTIONS, VOW_WEIGHT_TABLE

sections = VOW_SECTIONS
anchor = start
for title, paragraphs in sections:
    anchor = insert_after(anchor, title, "Heading 2")
    for text in paragraphs: anchor = insert_after(anchor, text)
    if title == VOW_WEIGHT_TABLE["after"]:
        anchor, _ = add_reference_table_after(
            anchor,
            VOW_WEIGHT_TABLE["headers"],
            VOW_WEIGHT_TABLE["rows"],
            VOW_WEIGHT_TABLE["ratios"],
        )

# New table uses the existing page width and source table appearance, not a redesign.
usable_twips = int((doc.sections[0].page_width - doc.sections[0].left_margin - doc.sections[0].right_margin) / 635)
widths = [int(usable_twips * ratio) for ratio in [0.16, 0.36, 0.19, 0.17]]
widths.append(usable_twips - sum(widths))
table.autofit = False
pr = table._tbl.tblPr
cell_margins = OxmlElement("w:tblCellMar")
for side, value in [("top", 70), ("bottom", 70), ("start", 120), ("end", 120)]:
    margin = OxmlElement(f"w:{side}"); margin.set(qn("w:w"), str(value)); margin.set(qn("w:type"), "dxa"); cell_margins.append(margin)
pr.append(cell_margins)
borders = OxmlElement("w:tblBorders")
for side in ["top", "left", "bottom", "right", "insideH", "insideV"]:
    edge = OxmlElement(f"w:{side}"); edge.set(qn("w:val"), "single"); edge.set(qn("w:sz"), "4"); edge.set(qn("w:color"), "777777"); borders.append(edge)
pr.append(borders)
tblw = pr.find(qn("w:tblW")); tblw.set(qn("w:w"), str(usable_twips)); tblw.set(qn("w:type"), "dxa")
indent = OxmlElement("w:tblInd"); indent.set(qn("w:w"), "120"); indent.set(qn("w:type"), "dxa"); pr.append(indent)
for col, width in zip(table._tbl.tblGrid.gridCol_lst, widths): col.set(qn("w:w"), str(width))
for row_index, row in enumerate(table.rows):
    for cell, width in zip(row.cells, widths):
        cell._tc.get_or_add_tcPr().find(qn("w:tcW")).set(qn("w:w"), str(width))
        for p in cell.paragraphs:
            p.paragraph_format.space_after = Pt(4)
            for run in p.runs:
                run.font.size = Pt(9); run.bold = row_index == 0
    if row_index == 0:
        header = OxmlElement("w:tblHeader"); row._tr.get_or_add_trPr().append(header)
        for cell in row.cells:
            fill = OxmlElement("w:shd"); fill.set(qn("w:fill"), "D9D9D9"); cell._tc.get_or_add_tcPr().append(fill)
    no_split = OxmlElement("w:cantSplit"); row._tr.get_or_add_trPr().append(no_split)

# Review anchors explain the intentional exceptions without changing prose elsewhere.
if hasattr(doc, "add_comment"):
    for p, note in [
        (life, "Patch 1.2: base por tamanho, CA 12 e Karma 10. Valores correntes não são restaurados pela migração."),
        (find("Intelecto: compreensão que se torna vantagem"), "Patch 1.2: bônus Analítico limitado a +3. Nenhuma perícia nova ou nível permanente foi acrescentado."),
        (find("Construção de uma invocação"), "Patch 1.4: Atributo principal por Grau reduzido para 3/5/7/9/12; apenas um secundário, dois pontos abaixo; demais no nível 1."),
        (start, "Patch 1.3: capítulo reestruturado como guia de criação. Peso mede a renúncia; Potência limita o pacote de benefício e nunca é bônus ou moeda."),
    ]:
        doc.add_comment(p.runs, text=note, author="Revisão Karmalização", initials="K")

destination.parent.mkdir(parents=True, exist_ok=True)
doc.save(destination)
assert len([p for p in doc.paragraphs if p.text.startswith("Capítulo ") and p.style.name in ("Heading 1", "heading 1")]) == 20
print(f"Patched rulebook: {destination}")
vow_word_count = sum(len(p.split()) for _, paragraphs in sections for p in paragraphs)
vow_word_count += sum(len(str(cell).split()) for row in VOW_WEIGHT_TABLE["rows"] for cell in row)
print(f"Paragraphs: {len(doc.paragraphs)}; tables: {len(doc.tables)}; new vow words: {vow_word_count}")
