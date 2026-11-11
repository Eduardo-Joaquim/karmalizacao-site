"""Keep combat errata synchronized between the manuscript and online chapters."""
from pathlib import Path
import json
import re
from lxml import html

root = Path(__file__).resolve().parents[1]
rules = {
    1: [
        ("Liora possui Intelecto 5", "Liora possui Intelecto 5 e Medicina 2. Ela escolhe o maior de 3d20 e soma +5 de treinamento e +3 Analítico. Com dados 8, 14 e 17, o resultado é 25. Analítico é igual ao Intelecto, limitado a +3, somente em perícias mentais ou técnicas regidas por Intelecto. Perícias Sociais usam Presença."),
        ("Com Atributo 0, role", "Com Atributo 0, um teste puro ou destreinado usa 1d20 −4. Uma perícia treinada usa 1d20 +2, +5 ou +10, conforme o treinamento. Vantagem e Desvantagem ajustam a reserva sem alterar o bônus."),
        ("Exemplo: Presença 0", "Exemplo: Presença 0 e Persuasão 2 produzem 1d20 +5."),
        ("Com Atributo 0, Vantagem", "Com Atributo 0 em teste puro ou destreinado, Vantagem produz 2d20, escolhendo o maior e subtraindo 4. Desvantagem produz 2d20, escolhendo o menor e subtraindo 4."),
        ("Uma rodada de combate representa", "Uma rodada de combate representa cerca de 10 segundos. Uma cena reúne um conflito, conversa, investigação ou travessia. 1 TE (Tempo de Expedição) equivale a 2 horas de trabalho focado ou manutenção. Um Descanso Curto comporta 1 TE. Um Descanso Longo de 8 horas comporta até 3 TE de criação ou reparo."),
    ],
    3: [
        ("Reflexos: Iniciativa", "Reflexos: Evasão e resposta a perigo repentino. Normalmente usa Agilidade."),
        ("Pontos de categorias diferentes não se convertem", "Pontos de categorias diferentes não se convertem e podem ser guardados. Nível de Perícia e Grau de técnica são escalas distintas. Com Atributo 0, aplique −4 somente no teste puro ou destreinado."),
    ],
    7: [
        ("Sucesso parcial: resultado do ataque", "Acerto Parcial: do limiar parcial até CA Total − 1. Aplique metade do dano, arredondada para baixo. Condições menores (Caído, Lento, Abalado, Desorientado e Empurrado) exigem Acerto Total. Condições severas (Sangramento, Envenenado, Silenciado, Imóvel, Cego, Atordoado e Danificado) entram integrais no Acerto Total. No parcial, reduza potência e duração aplicáveis pela metade, arredondando para baixo e com mínimo de 1 rodada."),
        ("No parcial, calcule o dano-base", "No parcial, some dano-base, crítico cabível, dados adicionais e bônus fixos. Divida por dois e arredonde para baixo antes de aplicar Resistência, escudo temporário e Vida. A CA Parcial também arredonda para baixo. Reservas de Atributo e o limiar de Saturação Alquímica arredondam para cima."),
    ],
    8: [("Todos fazem Agilidade + Reflexos", "Todos fazem um teste puro de Agilidade. Role a reserva da Agilidade final, escolha o maior dado e some a Agilidade final e os bônus específicos de Iniciativa. Agilidade 0 usa 1d20 −4. Empates favorecem a maior Agilidade e depois a decisão da mesa. Inimigos idênticos podem compartilhar a rolagem.")],
    15: [
        ("Um pacto forçado é corrompido", "Um pacto forçado é corrompido. Seu primeiro comando da cena recebe Desvantagem quando houver teste. A ordem precisa respeitar o serviço e as ações disponíveis."),
        ("Pague manutenção ao iniciar", "Pague manutenção ao iniciar cada rodada seguinte à chamada em combate. Fora de combate, cobre uma única taxa por cena de exploração na primeira vez que a invocação fizer esforço físico, transportar carga ou ativar uma habilidade. Use o custo de manutenção do Grau, com desconto de Regência de Comando Neural quando aplicável. Uma invocação de Grau IV paga 3 Karma por cena, ou 2 com Regência."),
        ("A 0 Vida, a invocação", "Ao cair a 0 Vida em cena, a invocação é recolhida e recebe exatamente uma Fratura. A dispensa voluntária e a nova chamada preservam dano e condições."),
        ("Atacar: mova até", "Atacar: use Movimento ou uma ação Livre, uma vez por turno, para comandar o ataque básico. A criatura pode se mover até seu Deslocamento. Conte esse comando no limite compartilhado do invocador."),
        ("Âncora: habita", "Âncora: habita um item, símbolo ou local. A chamada custa metade, arredondada para cima. Apenas uma Âncora pode permanecer ativa. Destruí-la causa 1d6 de dano espiritual ao invocador. A criatura continua contando para capacidade e soma de Graus."),
        ("A Âncora percebe", "A Âncora percebe e manifesta sua habilidade pelo suporte. Mover o suporte muda a origem dentro das permissões do objeto. Ataques ao espírito usam sua ficha. Destruir o suporte encerra a chamada e só marca Fratura se a Vida da invocação cair a 0."),
        ("Uma ordem fora do serviço", "Uma ordem fora do serviço permite recusa. Forçar obediência exige Presença + Conjuração contra CD 15 + 2 × Grau. Na falha, a criatura não age. Cada Fratura reduz a CA e os testes da invocação em 1. Em 3/3, ocorre Colapso Estrutural e a chamada fica bloqueada até reparo completo em oficina. O reparo exige 1 TE, Criação CD 14 e 2 M$ em peças. No sucesso, zere as Fraturas e restaure a Vida."),
    ],
}

manuscript = root / 'docs/regras.md'
segments = re.split(r'(?=^# Capítulo \d+ )', manuscript.read_text(), flags=re.M)
compiled = root / 'data/rules.json'
book = json.loads(compiled.read_text())
for chapter in book['chapters']:
    number = chapter['number']
    if number not in rules and number != 19:
        continue
    source = next((i for i, segment in enumerate(segments) if segment.startswith(f'# Capítulo {number} ')), None)
    if source is None:
        continue
    tree = html.fragment_fromstring(chapter['html'], create_parent='div')
    for old, new in rules.get(number, []):
        segments[source] = re.sub(r'^' + re.escape(old).replace(r'\ ', r'\s+') + r'[^\n]*$', lambda _: new, segments[source], flags=re.M) if not old.startswith(('Exemplo:', 'Reflexos:', 'Sucesso parcial:', 'Atacar:', 'Âncora:', 'Um pacto forçado é corrompido')) else re.sub(r'^\*\*' + re.escape(old.split(':')[0]) + r'[:\*].*$', lambda m: new if m.group(0).replace('*','').startswith(old) else m.group(0), segments[source], flags=re.M)
        for paragraph in tree.xpath('.//p'):
            if re.sub(r'\s+', ' ', paragraph.text_content()).strip().startswith(old):
                paragraph.clear(keep_tail=True)
                paragraph.text = new
    if number == 19:
        def expedition_text(value):
            return (value.replace('12 TE', '8 horas').replace('Turno de Exploração', 'Tempo de Expedição')
                .replace('30 minutos', '2 horas').replace('os 8 horas', 'as 8 horas').replace('seus 8 horas', 'suas 8 horas').replace('esses 8 horas', 'essas 8 horas'))
        segments[source] = expedition_text(segments[source])
        for node in tree.iter():
            for attr in ('text', 'tail'):
                value = getattr(node, attr)
                if value:
                    setattr(node, attr, expedition_text(value))
    chapter['html'] = ''.join(html.tostring(node, encoding='unicode') for node in tree)
    chapter['searchableText'] = re.sub(r'\s+', ' ', tree.text_content()).strip()
    chapter['wordCount'] = len(chapter['searchableText'].split())
    for section in chapter['sections']:
        nodes = tree.xpath('//*[@id=$id]', id=section['id'])
        if not nodes:
            continue
        content = [nodes[0].text_content()]
        for sibling in nodes[0].itersiblings():
            if re.fullmatch(r'h[1-6]', sibling.tag) and int(sibling.tag[1]) <= section['level']:
                break
            content.append(sibling.text_content())
        section['searchableText'] = re.sub(r'\s+', ' ', ' '.join(content)).strip()
manuscript.write_text(''.join(segments))
compiled.write_text(json.dumps(book, ensure_ascii=False, indent=2) + '\n')
