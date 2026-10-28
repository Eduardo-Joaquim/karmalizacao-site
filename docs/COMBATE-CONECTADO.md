# Combate conectado — 28/10/2026

A página `/mestre` concentra o encontro e conserva `/mesa`, os dossiês e o Teatro de Geppeto. A barra inferior de `/personagem` e `/ficha/id/token` abre a ficha tática. O encontro e seus NPCs são locais ao navegador do Mestre; os recursos dos jogadores vinculados são persistidos no D1. Não há campanha compartilhada entre dois Mestres nem iniciativa global armazenada no servidor.

## Acesso e dados

O dono usa a sessão autenticada. O portador de um link habilitado pode ler a ficha e executar somente operações dinâmicas em `/api/combate/sync`: recursos, condições, Domínios, Forma, rodadas e registro de ações. O endpoint não aceita alterações de atributos, perícias, técnicas, identidade, Votos ou inventário. Compartilhar o link concede essa capacidade de combate; revogação e renovação são verificadas em cada leitura e escrita. Dados da conta e e-mail nunca integram a resposta.

As operações são validadas antes da gravação. Cada alteração usa comparação do payload anterior no UPDATE e repete a leitura em conflitos. IDs presentes nos 25 eventos recentes impedem cobrança duplicada durante reenvios imediatos. Não há garantia de deduplicação eterna após o evento sair da janela. Salvar uma edição antiga da ficha preserva eventos dinâmicos mais recentes e os recursos de um combate ativo.

O estado anterior `combat` continua legível e recebe espelhamento para compatibilidade. `combatState` é inicializado a partir dos máximos derivados ou dos recursos antigos, nunca redefinido para cheio em uma atualização de combate. Tipos e constantes ficam em `character-model.ts`; `character-data.ts` mantém a interface pública e a normalização sem dependência circular.

## Sincronização

Polling serial a cada 1,5 s na aba visível, 6 s em segundo plano e consulta imediata ao voltar à aba. ETag compara `updatedAt` em consulta de metadados; uma resposta 304 não carrega o payload. POSTs são enfileirados por ficha, com até três reenvios do mesmo identificador. BroadcastChannel `karmalizacao:combat-sync` distribui o estado confirmado entre abas da mesma origem; não promete latência física de zero milissegundos. Erros ficam visíveis e ações recusadas não descontam recursos.

## Resolução preservada

Todas as 35 perícias publicadas estão disponíveis, com abordagem selecionável. O cálculo reutiliza treinamento comum/evolutivo/transcendental, Analítico limitado a +3, Essências e penalidades de inventário. Desvantagem retira um dado; abaixo do mínimo, rola dois e escolhe o menor. Não foi substituída pela opção incompatível de escolher sempre o menor de toda reserva treinada.

Dano parcial é dividido e arredondado antes de Resistência e escudo temporário. Não existe mínimo gratuito de dano após proteções. Crítico dobra apenas os dados-base registrados; dados adicionais e condições exigem sua própria resolução. O Mestre confirma o alvo e aplica o dano depois de ver o resultado. Poderes condicionais, respostas opostas e custos variáveis conservam seus textos e exigem confirmação; o programa não presume sucesso de controle ou Evasão.

A Saturação mantém `CD 14 + Saturação total` conforme `lib/alchemy.ts`, não `19 + excesso`. Consumo registra Saturação 1/2/3, com aceitação e benefício resolvidos antes de curar. A quantidade física é ajustada pelo dono no inventário; o link não edita itens. Domínios pagam ativação uma vez por cena, com Refinamentos e duração; não há manutenção automática inventada. A Transformação Corrompida conserva ativação em Movimento, custo 0 e os requisitos próprios; seu teste de controle e a Ruptura são resolvidos na mesa.

## Escudo do Mestre

Busca em todas as fichas oficiais estruturadas, invocações e ameaças; a família humana também recupera fichas legadas do HTML compilado. Ajustes no encontro não alteram o Bestiário. Resistência do NPC é selecionada conforme a fonte de dano e seus traços. Não se infere uma proteção universal de um texto condicional.

Forja com Etapas I–VII, papel, atributos, perícias, recursos e técnica de função primária com ação, alcance, duração e um efeito menor. Acesso a Grau III em III, IV em V e V em VII; treinamento precisa ser conferido na fonte. Área e secundárias usam o construtor completo do Capítulo 10. Doze presets são cópias das ameaças iniciais existentes.

Rodadas restauram Reações e reduzem contadores. Fases de Euphere (90), Maélia (60) e Geppeto (40) geram avisos, não transformações ou cura automática. Os limites de Geppeto continuam na tabela: até quatro peças, soma de Graus 8, três comandos; as artes pagas das marionetes exigem Geppeto no encontro. Adicionar uma ficha ao encontro não equivale a pagar sua manifestação nem concede ações.

## Verificação

Testes com SQLite em memória executam as queries reais da API com sessão substituída apenas no ambiente de testes. Cobrem acesso por token/dono, revogação, ETag, validação, operações simultâneas, reenvio e preservação ao salvar. Testes de motor cobrem reservas, treinamento, Analítico, inventário, dano misto, escudo, cura, Karma, duração e catálogo. A verificação visual usa uma ficha fictícia exclusivamente no banco local da prévia, sem modificar personagens de produção.
