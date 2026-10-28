# Karmalização — Patch 1.2

Este patch atualiza o criador de fichas, a apresentação final e o livro. Não altera autenticação, público do site, dados de contas ou identidade visual. Publicação depende de confirmação do proprietário do site público.

## Conferência rápida

- Página 5 sem poderes não escolhidos, registros vazios ou perícias não treinadas; inventário continua editável.
- Intelecto: bônus Analítico e abordagem racional social; nenhuma perícia nova.
- Presença exclusiva apenas para Conjuração Vincular, Comunhão Divina e Controle da Corrupção.
- CA base 12; Karma base 10; Vida e Deslocamento por tamanho.
- Votos com potência 1/3/7/15/31, limites e consequências.
- Sacrifício de quatro pontos-base comuns por um teste evolutivo de uso único.
- Área de Votos na página 4, com estado persistido na conta.
- Modal de atualizações na entrada, fechamento por X/Escape e botão superior central para reabrir.

## 1. Testes e atributos

O sistema mantém sua reserva de d20. Atributo positivo fornece `ceil(valor / 2)` dados; nível 0 de Perícia reduz um dado, mínimo um. Atributo 0 usa dois dados e escolhe o menor. O Atributo não é somado integralmente ao resultado.

Em Perícia mental ou social treinada, quando o Atributo efetivamente usado é Intelecto:

`resultado = dado selecionado + 2 × nível + min(3, floor(Intelecto final / 2))`

O bônus Analítico melhora a chance de sucesso, não o nível, dano, cura, duração, CA, graus ou pré-requisitos. Usa o Intelecto final com bônus de raça e classe. Sem treinamento, não há bônus Analítico. Em uma abordagem social racional descrita antes da rolagem, Intelecto pode substituir Presença se for maior. Carisma instintivo, autoridade e expressão permanecem abordagens de Presença; não há substituição automática de toda interação ficcional.

Exemplo: Medicina 2 e Intelecto 5 = 3d20, maior resultado, +6. Persuasão 2 e Intelecto 6 = 3d20 +7 em abordagem racional. A mesma Persuasão com Presença 2 = 1d20 +4 em abordagem carismática.

Conjuração Vincular é um uso da Perícia Conjuração, não uma perícia adicional: compartilha seus pontos, bônus e nível. Somente Conjuração Vincular, Comunhão Divina e Controle da Corrupção ignoram propostas de regência por Espírito/Intelecto e usam Presença. Conjuração comum mantém o Atributo da abordagem ou técnica, como Espírito para contenção, e não tem o seletor bloqueado nem o Atributo salvo sobrescrito. O editor oferece o uso Vincular separadamente, sem criar uma 31ª Perícia. Somente técnicas explicitamente identificadas com um dos três usos exclusivos têm o Atributo normalizado para Presença. Texto livre de cálculos deve ser conferido pelo autor conforme a regra; não é interpretado como código.

Karma máximo continua dependendo de Espírito. Favor continua 0–3; Carga, 0–10. Manifestação de Bênção conserva seu próprio regente; ela é distinta de Comunhão. Estatísticas de invocações e limites de quantidade/grau não foram substituídos por Presença.

## 2. Bases e tamanhos

| Tamanho | Altura canônica | Vida-base | Ajuste de movimento | Ajuste de CA |
|---|---|---:|---:|---:|
| Minúsculo | 30 a menos de 100 cm | 8 | +2 m | 0 |
| Pequeno | 100 a menos de 165 cm | 10 | +1 m | 0 |
| Médio | 165 a 190 cm, inclusive | 14 | 0 | 0 |
| Grande | Acima de 190 cm | 18 | −3 m | +1 |

- Vida máxima = base do tamanho + 2 × Constituição + Força + bônus.
- Karma máximo = 10 + 2 × Espírito + bônus.
- CA sem armadura = 12 + Agilidade + ajuste de tamanho + bônus.
- CA com equipamento mantém o limite de Agilidade da armadura, armadura e escudo ativo do livro.
- Movimento = máximo(1, 5 + Agilidade + ajuste de tamanho + bônus), antes de impedimentos de movimento.
- Carga confortável continua 8 + 2 × Força.

A ficha existente não possui equipamento estruturado suficiente para calcular armadura/escudo automaticamente: a CA exibida é a CA sem armadura, com bônus de raça/classe/progressão/Domínio. O patch não finge ler armaduras de anotações de inventário.

Com Constituição 2, Força 1 e Agilidade 2, antes dos bônus de origem, os pares Vida/movimento/CA são 13/9/14, 15/8/14, 19/7/14 e 23/4/15. Grande troca três metros por quatro de Vida e um de CA em relação a Médio; não recebe alcance/dano/carga extra. Pequeno e Minúsculo priorizam movimento. Esses ajustes foram revisados matematicamente e testados no código, não validados por campanhas de playtest.

Fronteiras pertencem a uma só categoria. Altura determina tamanho quando preenchida; sem altura, o jogador escolhe a categoria. Fichas antigas sem porte usam Médio provisoriamente, com aviso para revisão. Mudanças cosméticas não autorizam troca mecânica em jogo. Não há mudança em monstros, máquinas ou invocações.

## 3. Votos Vinculativos

### Revisão incorporada ao Patch 1.3 — criação sem ambiguidade

O capítulo 16 e a página 4 agora ensinam a criação na mesma ordem de sete passos: resumir o desejo sem números; escrever a renúncia antes do benefício mecânico; classificar o Peso apenas pela renúncia; receber automaticamente a Potência correspondente; escolher um único pacote de benefício; conferir a equivalência; e, somente após aprovação, pagar e testar a selagem.

**Peso e Potência deixaram de ser apresentados como duas pontuações para o jogador combinar.** Peso mede a gravidade do que foi realmente abandonado. Potência é apenas o nome do teto de benefício liberado por aquele Peso. Ela não entra em rolagens, não é somada a dano, CA ou Karma e não funciona como orçamento: qualquer parte não utilizada desaparece. O jogador seleciona um pacote completo da própria linha ou de uma linha inferior; somente a permissão expressa do Peso 5 pode combinar até dois pacotes Sacrificiais na mesma execução definida.

| Peso | Renúncia que justifica a categoria | Potência | Teto de benefício de referência | Selagem |
|---:|---|---:|---|---|
| 1 — Limitado | Uma opção útil fica indisponível por uma cena, ou uma condição tática pode ser explorada. | 1 | +1 dado em um teste definido, uma vez. | CD 15; 1 Karma; 1 espaço |
| 2 — Severo | Uma ferramenta, posição ou opção central fica indisponível durante um conflito inteiro. | 3 | +2 CA sob gatilho específico por uma cena **ou** −1 Karma em uma técnica nomeada, uma vez na cena. | CD 18; 3 Karma; 1 espaço |
| 3 — Grave | Um recurso importante fica comprometido por longo prazo, ou ocorre um sacrifício menor irrevogável. | 7 | +2 dados em um teste definido **ou** uma técnica conhecida um grau acima, até IV, uma vez **ou** o sacrifício especial. | CD 21; 5 Karma; 2 espaços |
| 4 — Sacrificial | Uma capacidade central, acesso importante ou parte decisiva da identidade é perdida permanentemente. | 15 | Técnica preparada de grau V, uma vez, **ou** duplicação somente dos dados-base de uma execução. | CD 24; 8 Karma; 3 espaços |
| 5 — Absoluto | Uma fonte inteira, um futuro indispensável ou uma consequência irreversível de campanha é colocado em jogo. | 31 | Até duas permissões Sacrificiais na mesma execução definida **ou** exceção narrativa equivalente, finita e contestável. | CD 27; 13 Karma; 3 espaços |

A tabela é uma régua, não uma loja. Primeiro leia somente a coluna de renúncia. Depois confira em qual linha o benefício cabe. Se o benefício exigir uma linha superior à perda, reduza o benefício ou reescreva uma renúncia genuinamente mais severa; mudar apenas o adjetivo não aumenta o Peso. Os valores mecânicos, custos, capacidade, consequências e o pacote especial de quatro pontos permanecem iguais aos do Patch 1.2.

| Peso | Nome | Potência | CD de selagem | Karma | Espaços |
|---:|---|---:|---:|---:|---:|
| 1 | Limitado | 1 | 15 | 1 | 1 |
| 2 | Severo | 3 | 18 | 3 | 1 |
| 3 | Grave | 7 | 21 | 5 | 2 |
| 4 | Sacrificial | 15 | 24 | 8 | 3 |
| 5 | Absoluto | 31 | 27 | 13 | 3 |

A potência cresce por `2^peso − 1`, mas funciona somente como teto de categoria, nunca como orçamento, moeda ou +31 em um teste. O capítulo 16 traz pacotes fechados: +1 dado uma vez por 1; +2 CA condicionais por uma cena ou redução estreita de custo por 3; +2 dados ou exceção de grau até IV por 7; execução de grau V ou duplicação de dados-base por 15; até duas permissões de 15 por 31. Uma restrição trivial não compra um Peso maior. Bônus de dados explícitos permanecem limitados a +2; Votos não se acumulam no mesmo efeito.

Capacidade: `1 + floor(Espírito final / 2)`, mínimo 1. Selagem normal usa Espírito + Canalização; selagem vinculada às três fontes exclusivas usa Presença. A ficha registra aprovação/selagem resolvidas na mesa, não simula a decisão do Mestre nem uma reserva corrente de combate.

### Sacrifício dos quatro pontos

1. Escolha uma Perícia existente no nível 2 como alvo.
2. Escolha quatro pontos-base comuns efetivamente distribuídos em outras Perícias, no máximo dois por fonte.
3. Não use bônus raciais/de classe, ajustes, progressão ou a perícia-alvo como pagamento.
4. Confirme aprovação e selagem bem-sucedida na mesa: peso 3, CD 21, 5 Karma, dois espaços.
5. Ao selar, os pontos são subtraídos do treinamento efetivo. A distribuição original permanece registrada para auditoria e não devolve pontos ao orçamento de 12.
6. Declare e consuma o uso antes de rolar: a perícia-alvo funciona como nível 3 (+6) somente nessa resolução. O bônus Analítico, quando aplicável, pode coexistir.
7. Falha, cancelamento ou quebra não restituem os pontos. Não há evolução permanente, nível 4, técnica aprendida ou repetição do voto.

Exemplo: sacrifique História 2 e Condução 2 para usar Criação 2 como Criação 3 uma vez. Com Intelecto 5, esse teste usa 3d20 +8; depois volta a Criação 2 e as perdas permanecem. Pontos novos adquiridos legitimamente em campanha podem reconstruir treinamento, sem reembolsar os quatro pontos originais.

### Persistência e proteção

Os Votos são armazenados no JSON da ficha já persistido no D1. Nenhuma migração SQL é necessária. Novos campos são opcionais na leitura, preservando fichas antigas. Cláusulas de Votos selados são imutáveis; estados consumidos/quebrados não retornam a selado. Cliente e servidor validam perdas, nível-alvo, capacidade e unicidade. A gravação usa comparação com o conteúdo anterior para detectar uma alteração concorrente durante a operação.

O sistema não é uma plataforma antitrapaça ou uma autenticação de Mestre: aprovação é um registro da decisão da mesa. Apagar um personagem inteiro, criar uma cópia ou editar texto narrativo não altera as regras de campanha. A página 5 é somente leitura fora do inventário.

## 4. Apresentação e histórico

`lib/sheet-visibility.ts` distingue texto real de opções vazias. IDs automáticos, ação e grau padrão de uma técnica não fazem uma técnica vazia aparecer. Grupos de perícias sem treinamento e campos opcionais vazios desaparecem. Valores essenciais válidos, inclusive Atributo 0, continuam sendo exibidos. Votos em rascunho ainda não são possuídos; selados e histórico de sacrifícios aparecem.

`components/patch-notes.tsx` usa o Dialog existente: foco contido, retorno de foco ao botão, Escape e X. O histórico lateral vira faixa horizontal em telas estreitas. A estética mantém fundo escuro, ouro e violeta. Registros anteriores foram reconstruídos dos commits reais, sem inventar números ou datas de lançamento.

O aviso abre na primeira entrada de cada sessão/aba e quando muda o identificador do patch. `sessionStorage` guarda somente a preferência local de fechamento. Falha nesse armazenamento não impede fechar/reabrir. Personagens e Votos nunca dependem dele.

Para um patch futuro, adicione um item no início de `PATCH_NOTES`, em `lib/patch-notes.ts`, com identificador único, título, rótulo e tópicos. O primeiro item vira o aviso mais recente; preserve os anteriores.

## 5. Código e manutenção

| Arquivo | Responsabilidade |
|---|---|
| `lib/character-data.ts` | Tipos, valores iniciais e compatibilidade de fichas |
| `lib/character-rules.ts` | Bases, tamanhos, testes, sacrifícios e validações |
| `lib/character-schema.ts` | Validação de formato no servidor |
| `lib/sheet-visibility.ts` | Critérios de exibição da ficha |
| `components/character-builder.tsx` | Altura/tamanho, prévias e salvamento |
| `components/character-power-editor.tsx` | Regência exclusiva e integração de Votos |
| `components/vow-editor.tsx` | Registro, selagem e consumo dos Votos |
| `components/character-sheet-view.tsx` | Ficha final condicional e inventário |
| `components/patch-notes.tsx` | Modal acessível e preferência de fechamento |
| `lib/patch-notes.ts` | Conteúdo versionado do histórico |
| `app/api/personagens/route.ts` | Persistência e proteção das transições |
| `app/globals.css` | Estilos responsivos do patch |
| `scripts/patch-rulebook.py` | Aplicação reproduzível das alterações ao Word original |
| `scripts/generate-rules.mjs` | Conversão do Word atualizado em livro on-line |
| `tests/patch-1.2.test.mjs` | Regressões do patch |

O Word revisado preserva os 20 capítulos. As alterações se concentram nos capítulos 1, 2, 3, 7, 9, 14, 16 e no exemplo de viagem do capítulo 19. O capítulo 16 foi reescrito; classes, raças e tabelas de inimigos não foram redesenhadas. O livro on-line foi regenerado do mesmo Word.

### Verificações

Nesta entrega: build de produção aprovado, 25 testes aprovados (zero falhas), ESLint dos arquivos alterados aprovado e revisão visual do Word concluída. Os 20 capítulos do livro on-line foram conferidos contra o Word atualizado. A regressão de Conjuração verifica que apenas o uso Vincular exige Presença e que ambos compartilham o treinamento existente.

Build de produção e testes de regras/renderização devem ser executados antes de salvar cada versão. A checagem completa de TypeScript do projeto original apresenta pendências de tipos Cloudflare e de um exemplo antigo que importa `getDb`; a geração dos tipos do ambiente foi bloqueada nesta sessão. Não tratar essa checagem como aprovada. Nenhum teste interativo em navegador ou playtest de mesa foi realizado.

```bash
npm run build
node --test --test-concurrency=1 tests/*.test.mjs
```
