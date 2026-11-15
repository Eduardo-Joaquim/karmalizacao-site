"""Combat procedures approved in the final authorial decision notebook."""
from lxml import html
from .common import chapter, replace, append_section


def paragraph(item, starts, content):
    tree = html.fragment_fromstring(item['html'], create_parent='div')
    nodes = [n for n in tree.xpath('.//p') if n.text_content().startswith(starts)]
    if not nodes:
        expected = html.fragment_fromstring('<p>' + content + '</p>').text_content()
        if any(n.text_content() == expected for n in tree.xpath('.//p')):
            return
        raise ValueError(f"Chapter {item['number']}: paragraph {starts!r} missing")
    for node in nodes:
        node.clear()
        fragment = html.fragment_fromstring('<p>' + content + '</p>')
        node.text = fragment.text
        for child in fragment:
            node.append(child)
    item['html'] = ''.join(html.tostring(n, encoding='unicode') for n in tree)


def apply(book):
    c = chapter(book, 7)
    paragraph(c, 'Acerto total:', '<strong>Acerto Total:</strong> resultado do ataque maior que a CA Total. Na igualdade exata, compare o valor final do Atributo usado no ataque com o Atributo regente da CA do defensor: somente o atacante com Atributo maior obtém Acerto Total; Atributo menor ou igual produz Acerto Parcial. Aplique dano e efeitos conforme o grau final.')
    paragraph(c, 'Acerto Parcial:', 'Acerto Parcial: do limiar parcial até CA Total − 1; também ocorre na igualdade com a CA Total quando o Atributo do atacante é menor ou igual ao regente da defesa. Aplique metade do dano, arredondada para baixo. Condições seguem o catálogo de gravidade e resolução abaixo. Caído, Lento, Abalado, Desorientado e Empurrado exigem Acerto Total, salvo exceção expressa na habilidade. Danificado é estado estrutural de equipamento ou constructo, com regras próprias.')
    paragraph(c, 'Exemplo: uma criatura possui CA 15.', '<strong>Exemplo:</strong> uma criatura possui CA 15. Seu limiar parcial é 7. Um ataque 16 ou maior é Acerto Total; de 7 a 14 é Acerto Parcial; 6 ou menos é Falha. No resultado 15, compare os Atributos. Um atacante com Força 6 que iguala a CA de um defensor com Agilidade 7 obtém Acerto Parcial; Força 8 contra essa Agilidade 7 obtém Acerto Total. A igualdade entre os Atributos favorece o defensor.')
    paragraph(c, 'Duração padrão:', '<strong>Duração padrão:</strong> sem duração própria, a condição termina no fim do próximo turno de quem a aplicou. Em Acerto Parcial, uma condição simples dura até o início do próximo turno do alvo; uma grave aplica sua Forma reduzida até o fim do próximo turno do alvo. As cinco condições menores — Caído, Lento, Abalado, Desorientado e Empurrado — exigem Acerto Total, salvo permissão expressa. Sangramento tem a exceção periódica descrita no catálogo; a duração específica de uma habilidade prevalece.')
    paragraph(c, 'Sangramento — simples:', '<strong>Sangramento — simples:</strong> sofra 1d4 de dano no fim do turno. Em Acerto Parcial, sofra somente um pulso no fim do seu próximo turno: role 1d4, divida por dois, arredonde para baixo e aplique mínimo 1 antes de Resistência e demais proteções; depois encerre a condição. Medicina CD 14, cura apropriada ou Ação Principal para estancar pode encerrá-la antes desse pulso. Reaplicações não somam dano.')
    paragraph(c, 'Caído — simples:', '<strong>Caído — simples:</strong> ataques corpo a corpo contra você recebem +1 dado, e seus ataques corpo a corpo recebem Desvantagem. Levantar consome metade do Deslocamento dentro da sua Ação de Movimento; a outra metade continua disponível nessa mesma ação.')
    append_section(c, 'regente-e-igualdade-da-ca', 'Atributos no empate da CA', '<p>Registre na ficha o regente da CA: Agilidade ou Constituição, conforme a construção da defesa. Essa identificação serve ao confronto na igualdade e não substitui a fórmula da CA nem soma novamente o Atributo à defesa. Use os valores finais dos Atributos; o limite de Agilidade permitido por uma armadura continua restrito ao cálculo numérico da CA. Não some treinamento a esse confronto e não faça outra rolagem.</p><p>Uma CA fixa de criatura, objeto ou dispositivo conserva seu valor. Declare o regente e seu valor antes da comparação; quando a fonte não os informar, o Mestre precisa defini-los para resolver uma igualdade, sem deduzi-los do ranque. Um 20 natural aplica suas regras de crítico, mas não ignora a CA nem o confronto de Atributos.</p>')
    append_section(c, 'evasao-abstrata-em-area', 'Posição e Evasão em área', '<p>Uma Evasão que supera o resultado do ataque evita integralmente aquela incidência. Em área, exige margem, abrigo ou zona menos intensa válida na cena, mas sua resolução é abstrata: não move gratuitamente a miniatura nem desconta metros do próximo Movimento. Para mudar de posição no mapa, use uma ação de movimento ou permissão expressa. Permanecer em uma área contínua não evita suas incidências futuras.</p>')
    append_section(c, 'graus-de-resistencia', 'Graus de Resistência', '<table><thead><tr><th>Grau</th><th>Redução de dano</th></tr></thead><tbody><tr><td>Leve</td><td>1 ponto</td></tr><tr><td>Média</td><td>2 pontos</td></tr><tr><td>Alta</td><td>3 pontos</td></tr></tbody></table><p>Essas denominações são universais para Resistência física, Elemental, Kármica, Mental, Divina e Corrupta. A natureza protegida continua sendo a indicada pela habilidade: possuir Resistência Alta contra Água não concede proteção contra todas as naturezas. Uma Resistência numérica expressamente indicada conserva seu valor. Contra subdobras, aplique a divisão parental antes de usar a proteção.</p>')

    c = chapter(book, 8)
    paragraph(c, 'Corpo a corpo:', '<strong>Corpo a corpo:</strong> Força + Luta; Agilidade + Luta somente quando a arma ou a técnica permitir.')
    paragraph(c, 'Role uma vez e compare o resultado com a CA,', 'Role uma vez e compare o resultado com a CA, aplicando as faixas e o confronto de Atributos na igualdade do Capítulo 7. Evasão é declarada depois de conhecido o resultado do ataque, mas antes do dano. Cobertura, escudo e condições precisam integrar a defesa no instante da comparação.')
    paragraph(c, 'Cobertura funciona se estiver entre o alvo', 'Cobertura funciona se estiver entre o alvo e o ponto de origem. Evasão exige margem, abrigo ou zona menos intensa válida na cena; sem essa possibilidade, não pode ser escolhida. Superar o ataque evita toda a incidência, sem deslocar gratuitamente a miniatura. Bloqueio ativo reduz o grau quando o escudo for adequado. Áreas contínuas podem voltar a afetar quem permanecer nelas.')

    c = chapter(book, 10)
    tree = html.fragment_fromstring(c['html'], create_parent='div')
    for row in tree.xpath('.//tr'):
        cells = row.xpath('./th|./td')
        if len(cells) == 3 and cells[0].text_content().strip() == 'Ataque contra CA':
            cells[1].clear()
            cells[1].text = 'Total: superar a CA; na igualdade, Atributo do atacante maior que o regente da defesa'
            cells[2].clear()
            cells[2].text = 'Da metade da CA arredondada para baixo até CA − 1; na igualdade com a CA, Parcial se o Atributo do atacante for menor ou igual ao regente da defesa'
    c['html'] = ''.join(html.tostring(n, encoding='unicode') for n in tree)
    paragraph(c, 'Exemplo: um ataque obtém 18 contra CA 18.', 'Exemplo: um ataque de Força 6 obtém 18 contra CA 18 de um defensor cuja CA é regida por Agilidade 7. A igualdade produz Acerto Parcial porque o Atributo do atacante é menor. Se o dano calculado for 9, ele passa a 4; contra Resistência 2, restam 2. Se a Resistência fosse 5, o dano final seria zero. Não reaplique o mínimo de 1 depois da redução. Com resultado 19, esse mesmo ataque obteria Acerto Total.')
    paragraph(c, 'Exemplo de uso: com Espírito 5 e Controle de Água 1,', '<strong>Exemplo de uso:</strong> com Espírito 5 e Controle de Água 1, o usuário rola 3d20 e soma +2 ao maior. Dados 7, 12 e 16 produzem 18. Contra CA 17, é Acerto Total: se o dano mostrar 9, aplique 9 antes das reduções e empurre 2 metros. Contra CA 18 regida por Agilidade 7, compare Espírito 5 com Agilidade 7: o ataque é Parcial, com 4 de dano antes das reduções e 1 metro de empurrão. Contra CA 19, seria Parcial independentemente do confronto, pois o resultado ficou abaixo da CA Total.')
    # The existing eight-step table is retained; a concise cross-reference helps
    # readers follow it without duplicating costs or creating another formula.
    append_section(c, 'conferencia-da-tecnica', 'Conferência da técnica pronta', '<p>Percorra a criação nesta ordem: conceito e fonte; acesso por Etapa, Grau e treinamento; função primária; função secundária ou efeito menor; forma de uso; custo e modificadores; resolução de Total, Parcial e Falha; registro e comparação com técnica semelhante. As tabelas do capítulo fornecem os valores de cada escolha.</p><p>Alcance não é área: uma explosão lançada a 15 metros com raio de 2 metros compra alcance médio e área pequena (+2 Karma), além dos demais componentes. O roteiro não concede componentes gratuitos e não altera o limite de descontos.</p>')

    c = chapter(book, 18)
    paragraph(c, 'A CA é decisiva porque define também o limiar parcial.', 'A CA é decisiva porque define também o limiar parcial. Uma criatura de CA 22 sofre Acerto Total com 23 ou mais, Parcial de 11 a 21 e Falha abaixo de 11. No resultado 22, compare o Atributo do ataque com o regente da CA: atacante maior obtém Total; defensor maior ou igual obtém Parcial. Um 20 natural não ignora essas faixas. Contra proteções elevadas, posicionamento, retirada de componentes defensivos, técnicas adequadas e Caminho mudam a qualidade do acerto.')
    replace(c, 'CA 25; limiar parcial 12; total a partir de 26.', 'CA 25; limiar parcial 12; Total com 26 ou mais; no resultado 25, confronto do Atributo do ataque com o regente da CA.')
    replace(c, 'cujo limiar parcial é 10. Esses 4 pontos', 'cujo limiar parcial é 10: resultados de 10 a 20 são Parciais, 22 ou mais são Totais e 21 exige confronto de Atributos. Esses 4 pontos')
    append_section(c, 'igualdade-na-tabela-de-chefes', 'Como ler os limiares dos chefes', '<p>Na tabela de chefes, a coluna de Acerto Total indica o primeiro resultado que supera diretamente a CA. O resultado exatamente igual à CA pode antecipar o Total somente se o Atributo do atacante superar o regente da defesa. Declare esse regente na ficha do chefe e conserve os valores de Vida e CA da tabela.</p><p>Contra a CA 25 do Guardião da Caldeira, um ataque de Força 6 que tira 25 será Parcial se sua defesa for regida por Constituição 7 e Total se for regida por Agilidade 3. Defina o regente ao preparar a ficha; as placas retiradas reduzem a CA em 4, sem alterar o confronto dos Atributos.</p>')
