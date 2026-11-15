"""Author-approved 2.0.6 procedures for Paths, grants, corruption and pacts.

This module transforms the compiled chapters after their dedicated sources have
been regenerated. It never writes generated files itself.
"""
from lxml import html
from .common import chapter


def _tree(item):
    return html.fragment_fromstring(item['html'], create_parent='div')


def _save(item, tree):
    item['html'] = ''.join(html.tostring(node, encoding='unicode') for node in tree)


def _text(node):
    return ' '.join(node.text_content().split())


def _set(tree, prefix, text):
    matches = [node for node in tree.iter() if node.tag in ('p', 'li') and _text(node).startswith(prefix)]
    if not matches:
        raise ValueError(f'Book 2.0.6: missing spiritual procedure {prefix!r}')
    node = min(matches, key=lambda candidate: len(list(candidate.iterdescendants())))
    for child in list(node):
        node.remove(child)
    node.text = text


def _insert(tree, section_id, heading_id, fragment, before=False, unless_text=None):
    for existing in tree.xpath('.//*[@data-book206-section=$key]', key=section_id):
        existing.getparent().remove(existing)
    if unless_text and unless_text in _text(tree):
        return
    targets = tree.xpath('.//*[@id=$key]', key=heading_id)
    if not targets:
        raise ValueError(f'Book 2.0.6: missing heading {heading_id!r}')
    section = html.fragment_fromstring(f'<section data-book206-section="{section_id}">{fragment}</section>')
    target = targets[0]
    target.addprevious(section) if before else target.addnext(section)


def _path(book):
    item = chapter(book, 11)
    tree = _tree(item)
    _set(tree, 'A partir da Etapa III, você pode despertar',
         'A partir da Etapa III, você pode despertar o Caminho antes de possuir um Domínio. Exige uma crise em cena: estar com metade da Vida ou menos, enfrentar ameaça de Etapa igual ou superior, ou pôr uma convicção vital em risco direto. Faça Espírito ou o Atributo-chave do Caminho + Canalização de Karma, usando a reserva do Atributo escolhido e o bônus de treinamento em Canalização de Karma. Vontade designa a resistência interior resolvida por esse teste; não existe treinamento separado em Vontade. Some +1 por falha em sessão anterior. Ímpeto, Analítico e outros bônus de perícia ficam fora desse teste.')
    for cell in tree.xpath('.//th|.//td'):
        if _text(cell) == 'Despertar sob Outorga ou doutrina':
            cell.text = 'Despertar sob Outorga ou ensinamento'
        if _text(cell) == 'Inércia de dependência espiritual':
            cell.text = 'Inércia da Outorga ou do ensinamento recebido'
    # This note also makes applying the module to a not-yet-regenerated chapter safe.
    _insert(tree, 'escopo-do-despertar', 'despertar-na-etapa-iii',
            '<p>A coluna de CD 24, Desvantagem, 10 Karma e 2d6 de dano aplica-se a quem possui uma Outorga (Bênção) ou possui ou já teve mestre, mentor ou qualquer ensinamento formal, incluindo a doutrina marcial ou de classe. Apenas personagens estritamente autodidatas e sem Bênção usam a coluna de CD 20.</p>', unless_text='A coluna de CD 24 aplica-se')
    _insert(tree, 'caminho-e-progressao', 'vertentes-do-caminho-despertado',
            '<p>Caminho Pessoal é a expressão da Lei individual, distinto do caminho de progressão institucional do Capítulo 4. A vertente Independente significa ausência de Bênção; admite filiação à Guilda ou progressão pela Torre.</p>', unless_text='A vertente Independente descreve')
    # Axioms are regenerated from path-axioms.json; retain exact behavior on a direct apply.
    for row in tree.xpath('.//tr'):
        cells = row.xpath('./td|./th')
        if len(cells) >= 3 and _text(cells[0]) == 'Soberania Elemental':
            cells[2].text = 'Técnicas da Matriz Elemental recebem +1 dado do mesmo tipo no cálculo de dano antes do parcial e reduzem em 1 ponto a Resistência Elemental do alvo, até o mínimo de 0 (ignorando Resistência Leve 1). Além disso, você pode excluir até 2 aliados da área de efeito das suas próprias técnicas elementais.'
        if len(cells) >= 3 and _text(cells[0]) == 'Predação de Sombra Viva':
            cells[2].text = 'Atacar a partir de cobertura, furtividade ou flanco adiciona +1d20 na Reserva do ataque. Se esse golpe obtiver Acerto Total, depois de resolvidas as defesas do próprio golpe, o alvo não pode usar Reações até o início do próximo turno dele. Deixar um inimigo Morrendo ou com Ferimento Grave permite entrar em furtividade como Ação Livre.'
    _save(item, tree)


def _grants(book):
    item = chapter(book, 13)
    tree = _tree(item)
    _set(tree, 'Todo teste usa Presença + Comunhão Divina',
         'Todo teste usa Presença + Comunhão Divina, com treinamento +2, +5 ou +10. Presença monta a reserva. Com Presença 0, um teste destreinado usa 1d20 −4; se treinado, usa 1d20 +2, +5 ou +10 conforme o nível da Perícia, sem a penalidade de −4.')
    _insert(tree, 'como-usar-as-outorgas', 'portal-das-nove-asas',
            '<h3 id="preparar-uma-outorga">Preparar uma Outorga</h3>'
            '<p>As 243 entradas do Portal são bases abertas de Bênçãos: o Fenômeno apresenta o Núcleo e o Dom Inicial; as Extensões apresentam aplicações específicas. Antes da primeira utilização em mesa, registre com o Mestre o Atributo regente, os Graus das Expressões e seus requisitos de acesso, os três Limites Essenciais, a Interdição e a Reparação, seguindo as regras deste capítulo. Complete apenas campos ausentes; conserve as ações, custos, alcances, dados e exceções expressamente definidos na entrada. Uma aplicação não recebe progressão ou dados adicionais gratuitos pela passagem de Etapa.</p>'
            '<p>Quando houver teste, use o Atributo regente registrado e Manifestação de Bênção, salvo combinação expressamente indicada pela aplicação. Descritores separados por barra podem identificar natureza e manifestação do efeito; a barra sozinha não duplica o dano nem exige duas Resistências sucessivas. Identifique na ficha a natureza de cada parcela e aplique a proteção correspondente uma vez.</p>', before=True)
    _set(tree, 'Arco de Descarga (',
         'Arco de Descarga (Extra · 3 Karma · 9m · Grau I): Salta um raio no inimigo mais próximo com armadura ou arma metálica a até 9m, causando 2d6 de dano elétrico. “Sem esquiva parcial” impede reduzir o grau por defesa ativa; uma Evasão plena que supere o ataque ainda evita todo o efeito. A expressão não transforma em Total um Acerto Parcial obtido normalmente contra a CA.')
    _set(tree, 'Gaiola de Faraday (',
         'Gaiola de Faraday (Reação · 4 Karma · Grau II): Converte um projétil ou feixe recebido em carga estática, reduzindo o dano recebido em 2d8 e causando automaticamente 1d8 de dano elétrico aos inimigos a até 2m do portador.')
    _set(tree, 'Toque de Desmontagem (',
         'Toque de Desmontagem (Principal · 4 Karma): Golpeia o nó de tensão do alvo, calculando a CA sem os bônus de armadura e escudo; preserve os demais componentes e recalcule a CA Parcial pela metade, arredondada para baixo. Causa 2d8 de dano e aplica Danificado ao equipamento inimigo conforme o resultado do ataque. Danificado é estado estrutural do equipamento, não condição corporal do portador.')
    _set(tree, 'Véu da Cachoeira (',
         'Véu da Cachoeira (Principal · 4 Karma · 9m): Envolve o golpe em correntes de água dourada, causando 2d8 de dano contundente/kármico. Contra este golpe, retire somente os bônus de armadura pesada e escudo da CA do alvo; preserve os demais componentes, incluindo armadura leve ou média, e recalcule a CA Parcial pela metade, arredondada para baixo. Limpa condições negativas de você.')
    _set(tree, 'Copiar Esboço (',
         'Copiar Esboço (Reação · 5 Karma): Após um inimigo lançar uma técnica de Grau igual ou inferior à sua Etapa a até 12m, você grava sua estrutura. No seu próximo turno, pode disparar uma versão kármica da mesma técnica, usando a ação e pagando o custo normal da técnica copiada. Conserve Grau, alcance, área, alvos, duração e função; execute com o Atributo regente da sua Bênção e o seu treinamento na Perícia de manifestação ou execução exigida pela técnica copiada. Não copie Atributos, treinamento, Domínios ou recursos do autor original. Uma cópia de Grau V consome o seu próprio Ápice da cena e deve respeitar seus demais pagamentos e requisitos.')
    _set(tree, 'Sentença Retroativa (',
         'Sentença Retroativa (Principal · 4 Karma · 12m): Escolha um inimigo; este ataque causa 2d6 de dano Divino, mais 3 para cada vez que esse inimigo atacou ou feriu alguém nesta cena, até +9. Aqui, “dano verdadeiro” significa ignorar Resistência ou Redução de Dano. O ataque ainda precisa vencer a CA e respeita Escudo Temporário, com o grau de acerto e a ordem de dano normais.')
    _set(tree, 'Lavar o Ori (',
         'Lavar o Ori (Extra ou Reação · 3 Karma · 9m): Remove instantaneamente qualquer condição mental (Abalado, Desorientado, Confuso, Controle Mental ou Dissonância) de você ou de um aliado a 9m, concedendo +1d20 e +2 no próximo teste daquele personagem. Como exceção, remover Dissonância por esta expressão dispensa a Reparação daquela Dissonância removida. Não desperta uma Bênção Dormente, cujo retorno ainda exige Reparação e descanso longo seguro.')
    _set(tree, 'Atrasar Relógio Biológico (',
         'Atrasar Relógio Biológico (Reação · 3 Karma): Adia o dano ou condição que você acabou de sofrer para o fim do seu próximo turno. Registre o dano líquido depois da Resistência, antes do Escudo Temporário, e a condição devida. Na quitação, aplique o Escudo Temporário que estiver ativo naquele instante, depois Vida, sem aplicar Resistência novamente; a condição passa a produzir seus efeitos então, com sua duração registrada. O mesmo dano ou condição não pode ser adiado uma segunda vez, por esta habilidade ou por outra reação.')
    _set(tree, 'Solo Santificado (',
         'Solo Santificado (Extra · 3 Karma): Ilumina uma área circular fixa de 3m de raio no chão, centrada em você ou em um ponto visível a até 5m. Dura até o início do seu terceiro turno subsequente à ativação, encerrando-se antes de qualquer cura naquele início. Enquanto você e seus aliados estiverem na área, recebem +2 em testes de resistência e recuperam 3 de Vida no início do próprio turno. Não há pulso imediato ao ativar. O portador pode receber dois pulsos; um aliado pode receber até três, conforme a iniciativa. Áreas sobrepostas não acumulam bônus ou cura.')
    _set(tree, 'Entregar o Ebó (',
         'Entregar o Ebó (Principal · 4 Karma): Realize um ataque corpo a corpo ou à distância que causa 2d8 de dano e pode carregar uma técnica ou Runa de um aliado voluntário a até 5m. Declare aliado, carga, alvo e pagamentos antes da rolagem. Para executar uma técnica na hora, o aliado gasta sua Reação e paga o Karma e os demais custos da técnica; pode também fornecer uma Runa já inscrita e armada. No acerto, a carga se manifesta no ponto atingido: se exigir resistência, use a CD do aliado +2; se exigir ataque contra CA, compare o resultado do ataque portador com a CA de cada alvo, sem conceder +2 ao ataque. Cada alvo secundário de uma área resolve a própria defesa. Na Falha, a técnica aliada conserva seus gastos, inclusive eventual Ápice; uma Runa já armada cujo Estouro dependa do acerto permanece intacta no suporte. O Ápice de uma carga de Grau V pertence ao aliado fornecedor. Se a Runa V já estiver vinculada ao Ápice desse aliado na cena, seu Estouro usa o mesmo vínculo, sem cobrar outro; se outra fonte tiver comprometido o Ápice, a Runa V não é elegível. A Falha não devolve um Ápice já comprometido.')
    # This is a statement of the existing irreducible payment, not a new frequency cap.
    _set(tree, 'Tributo do Caolho (',
         'Tributo do Caolho (Livre · 0 Karma + 4 de Vida irreduzível): Pague 4 de Vida diretamente, sem absorção por Resistência ou Escudo Temporário, para recuperar imediatamente 6 de Karma (ou gravar 1 Runa de Grau até III sem gastar ação) e receber +1d20 no próximo teste. Preserve os limites gerais de ações Livres e de repetição da mesma habilidade.')
    _save(item, tree)


def _corruption(book):
    item = chapter(book, 14)
    tree = _tree(item)
    _set(tree, 'Ao usar uma técnica com rede, Ampliação e desconto,',
         'Ao usar uma técnica com rede, Ampliação e desconto, declare tudo antes das rolagens e faça um único Controle no momento previsto para a ação. Se ela incluir técnica da Matriz Corrupta, use CD 16 + Carga efetiva atual + Cargas temporárias e o momento de Controle dessa Matriz; para os gatilhos comuns da Marca, use CD 14 + Carga efetiva atual + Cargas temporárias. Ruptura permanece CD 24 fixa, em seu próprio momento. A Carga automática de Abandonar o Controle entra antes da CD. Uma falha compartilhada de rede e Ampliação Controlada concede apenas 1 Carga por esses usos, além das Cargas do desconto e das consequências expressas. Usar uma mutação nessa mesma ação não acrescenta outra Carga de falha nem outra Intrusão.')
    _insert(tree, 'consulta-da-corrupcao', 'carga-e-teste-de-controle',
            '<h3 id="controle-por-contexto">Controle por contexto</h3>'
            '<table><thead><tr><th>Evento</th><th>CD e momento</th></tr></thead><tbody>'
            '<tr><td>Marca, Anatomia e rede; ativação corporal ou marco de permanência</td><td>14 + Carga efetiva + temporárias aplicáveis, no momento próprio do gatilho.</td></tr>'
            '<tr><td>Técnica da Matriz Corrupta</td><td>16 + Carga efetiva + todas as temporárias aplicáveis; conserve o momento definido pela Matriz. Se combinar rede, Ampliação e desconto na mesma execução, não duplique o Controle.</td></tr>'
            '<tr><td>Retomar o controle na Ruptura</td><td>24 fixa no início do turno; não some Carga 10 novamente.</td></tr>'
            '</tbody></table>'
            '<p>As Cargas temporárias do desconto e do risco da Matriz são registradas por origem. No sucesso, metade das temporárias, arredondada para baixo, torna-se efetiva; na falha, todas se tornam efetivas, somadas apenas às consequências expressas. Não conte duas vezes a mesma falha compartilhada.</p>'
            '<table><thead><tr><th>Carga efetiva, sem temporárias</th><th>Controle comum da Marca</th><th>Matriz Corrupta</th></tr></thead><tbody>'
            '<tr><td>8</td><td>CD 22</td><td>CD 24</td></tr>'
            '<tr><td>9</td><td>CD 23</td><td>CD 25</td></tr>'
            '</tbody></table><p>Com Controle da Corrupção nível 1 (+2) e sem outros bônus fixos, o teto é 22 (20 +2). Com Ímpeto de +2, quando permitido, chega a 24; com nível 2 (+5), o teto é 25 antes de outros bônus. Assim, mais d20 aumentam a chance de atingir o teto, sem elevá-lo; um 20 natural não garante sucesso universal. Cargas temporárias aumentam a CD conforme a origem.</p>'
            '<table><thead><tr><th>Camada</th><th>Ativação e acesso</th><th>Limites e fim</th></tr></thead><tbody>'
            '<tr><td>Anatomia e rede</td><td>Movimento, 0 Karma; conforme Carga. Em 7/8/9 Cargas, a rede permite 2/4/8 Enxertos a 15m.</td><td>Usa as ações e testes da rede; não multiplica o dano total. Ruptura encerra a rede.</td></tr>'
            '<tr><td>Mutações corporais</td><td>Etapa III, Controle 1 e 7–9 Cargas; Movimento e 6 Karma. Manutenção de 1 Karma no início de cada turno seguinte.</td><td>Espaços por Etapa e treinamento. A cada cinco turnos corporais acumulados, +1 Carga e Controle, salvo chegada a 10, que inicia Ruptura. Encerrar após cinco ou mais causa Exausto; Ruptura bloqueia até descanso longo seguro.</td></tr>'
            '</tbody></table>'
            '<p>Com Presença 0, Controle da Corrupção destreinado usa 1d20 −4; treinado usa 1d20 +2, +5 ou +10, sem o −4.</p>')
    _save(item, tree)


def _pacts(book):
    item = chapter(book, 15)
    tree = _tree(item)
    _set(tree, 'Pague manutenção ao iniciar cada rodada seguinte',
         'Pague manutenção ao iniciar cada rodada seguinte à chamada em combate. Fora de combate, pague uma taxa de exploração na primeira vez que a invocação fizer esforço físico, transportar carga ou ativar uma habilidade. A taxa cobre até 2 TE (4 horas) contínuos ou até mudar de Zona, o que ocorrer primeiro; encerrado esse período, o próximo esforço elegível exige nova taxa. Entrar em combate passa a usar a manutenção por rodada, sem devolver a taxa já paga. Use o custo do Grau, com desconto de Regência de Comando Neural quando aplicável. Uma invocação de Grau IV paga 3 Karma por taxa de exploração, ou 2 com Regência.')
    _set(tree, 'Uma ordem fora do serviço permite recusa.',
         'Uma ordem fora do serviço permite recusa. Forçar obediência exige Presença + Conjuração contra CD 15 + 2 × Grau; na falha, a criatura não age. Cada Fratura reduz sua CA e seus testes em 1. Em 3/3 ocorre Colapso Estrutural, e a chamada fica bloqueada até reparo completo em oficina. O reparo pode ser realizado também em 1/3 ou 2/3 Fraturas e em invocação recolhida com 0 Vida: exige 1 TE, Criação CD 14 e 2 M$ em peças. Para pactos orgânicos ou espirituais, substitua peças por reagentes ou incensos de 2 M$ e use Medicina ou Canalização de Karma CD 14. No sucesso, zere as Fraturas e restaure a Vida ao máximo; a falha não restaura Vida nem remove Fraturas. Dispensa e nova chamada, isoladamente, continuam preservando dano e condições.')
    _insert(tree, 'comandos-em-consulta', 'comandos',
            '<h3 id="acoes-de-comando">Ações de comando</h3>'
            '<table><thead><tr><th>Recurso do invocador</th><th>Permissão</th></tr></thead><tbody>'
            '<tr><td>Livre, uma vez por turno, ou Movimento</td><td>Comande um ataque básico, incluindo até o Deslocamento da criatura.</td></tr>'
            '<tr><td>Extra</td><td>Comande uma criatura nas opções permitidas.</td></tr>'
            '<tr><td>Principal</td><td>Comande outra criatura nas opções permitidas.</td></tr>'
            '<tr><td>Movimento: Comando Duplo</td><td>Comande duas criaturas distintas.</td></tr>'
            '</tbody></table><p>Todas essas permissões compartilham o mesmo teto de três criaturas distintas por turno e um único comando, de qualquer natureza, para cada criatura. Um recurso gasto numa opção não fica disponível para outra. Manifestar conserva o custo da habilidade e a movimentação própria. Sem comando, apenas acompanhamento e postura defensiva nos limites descritos abaixo.</p>')
    _insert(tree, 'presenca-zero-nos-pactos', 'registro-do-pacto',
            '<p>Conjuração Vincular usa Presença. Com Presença 0, um teste destreinado usa 1d20 −4; um teste treinado usa 1d20 +2, +5 ou +10, conforme o treinamento, sem o −4.</p>')
    _save(item, tree)


def apply(book):
    _path(book)
    _grants(book)
    _corruption(book)
    _pacts(book)
