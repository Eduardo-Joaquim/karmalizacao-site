"""Final 2.1.0 coherence pass, after the specialized source compilers."""
import re
from lxml import html
from book206.common import chapter


def _rewrite(tree, old, new):
    for node in tree.iter():
        if isinstance(node.tag,str):
            if node.text: node.text=node.text.replace(old,new)
            if node.tail: node.tail=node.tail.replace(old,new)


def apply(book):
    for number in (1,3,8,10,13,18):
        item=chapter(book,number)
        tree=html.fragment_fromstring(item['html'],create_parent='div')
        if number in (1,3):
            _rewrite(tree,'Tática e Condução.','Tática, Condução e Sobrevivência (quando regida por Intelecto para interpretar rastros, clima e ambiente).')
        if number==3:
            for node in tree.xpath('.//li|.//p'):
                text=' '.join(node.text_content().split())
                if text.startswith('Atletismo:'):
                    for child in list(node):node.remove(child)
                    node.text='Atletismo: Usa Constituição para fôlego, marcha, corrida prolongada, natação resistente e Fortitude; usa Força para arranques, saltos, escaladas curtas e testes para romper agarrões ou prisões físicas. Declare a abordagem conforme o esforço exigido; uma reserva não substitui automaticamente a outra.'
        if number==8:
            _rewrite(tree,'A arma cai em alcance curto do portador.','O item cai num ponto livre a até 2 metros do defensor, escolhido por quem venceu.')
        if number==10:
            _rewrite(tree,'total exige igualar ou superar a defesa','total exige superar a defesa ou, na igualdade exata, vencer o confronto de Atributos contra o regente da CA do defensor')
        if number==13:
            _rewrite(tree,'Resistência ou Redução de Dano','Resistência')
            _rewrite(tree,'Pressão Abissal','Pressão Oceânica')
            for node in tree.iter():
                if not isinstance(node.tag,str):continue
                for field in ('text','tail'):
                    value=getattr(node,field)
                    if value:
                        value=re.sub(r'Redução de Dano|redução de dano|reduções de dano','Resistência',value)
                        setattr(node,field,value)
        if number==18:
            # Keep the equality procedure next to the table rather than only at chapter end.
            note='Na igualdade exata com a CA-base da tabela, o ataque também produz Acerto Total se o Atributo do atacante superar o Atributo regente da CA do chefe; defensor maior ou igual produz Parcial.'
            for paragraph in tree.xpath('.//p'):
                text=' '.join(paragraph.text_content().split())
                if text.startswith('A CA-base abaixo já incorpora') and note not in text:
                    extra=html.fragment_fromstring('<span> '+note+'</span>');paragraph.append(extra)
        item['html']=''.join(html.tostring(node,encoding='unicode') for node in tree)
