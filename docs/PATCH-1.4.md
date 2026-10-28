# Patch 1.4 — Invocações reequilibradas

## Regra canônica

Cada Invocação continua escolhendo um Atributo principal, mas os valores por Grau foram reduzidos:

| Grau | Atributo principal | Atributo secundário | Demais Atributos |
| --- | ---: | ---: | ---: |
| I | 3 | 1 | 1 |
| II | 5 | 3 | 1 |
| III | 7 | 5 | 1 |
| IV | 9 | 7 | 1 |
| V | 12 | 10 | 1 |

O valor da tabela é o nível do Atributo principal, e não um total de pontos para distribuir. Cada Invocação escolhe somente um Atributo secundário, sempre dois pontos abaixo do principal, com mínimo 1. Os outros quatro Atributos ficam no nível 1.

CA, Vida, dano, Perícias, custo de chamada, manutenção, perfis e formas de chamada não foram alterados.

## Alterações no site

- O cálculo automático usa os novos valores 3, 5, 7, 9 e 12.
- O criador da página 4 exibe apenas um seletor de Atributo secundário.
- O resumo calculado diferencia principal, um secundário e os quatro restantes.
- A ficha final usa o rótulo singular “Atributo secundário”.
- Fichas antigas com dois secundários conservam o primeiro valor registrado; o segundo passa a integrar os demais Atributos de nível 1.
- A validação impede que o Atributo principal também seja escolhido como secundário.

## Alterações no Livro de Regras

- A tabela do Capítulo 15 passou a chamar a coluna de “Atributo principal”.
- A progressão foi substituída por 3/5/7/9/12.
- A construção agora informa explicitamente que há um único secundário e quatro Atributos no nível 1.
- Os exemplos do Cão de Fuligem e da Sentinela de Basalto foram ajustados à nova distribuição.

## Compatibilidade

Não há migração de banco. A normalização acontece quando uma ficha existente é carregada ou salva, preservando todos os campos não relacionados à distribuição de Atributos da Invocação.
