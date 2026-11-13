# Combate conectado — revisão de 13/11/2026

A página `/mestre` concentra o encontro e conserva `/mesa`, os dossiês e o Teatro de Geppeto. A barra inferior de `/personagem` e `/ficha/id/token` abre a ficha tática. O encontro e seus NPCs são locais ao navegador do Mestre; os recursos dos jogadores vinculados são persistidos no D1. Não há campanha compartilhada entre dois Mestres nem iniciativa global armazenada no servidor.

## Acesso e dados

O dono usa a sessão autenticada. O portador de um link habilitado pode ler a ficha e executar somente operações dinâmicas em `/api/combate/sync`: recursos, condições, Domínios, Forma, rodadas e registro de ações. No inventário, o link só move, equipa ou consome unidades existentes. O endpoint protege atributos, perícias, técnicas, identidade, Votos e a definição dos itens. Compartilhar o link concede essa capacidade de combate; revogação e renovação são verificadas em cada leitura e escrita. Dados da conta e e-mail nunca integram a resposta.

As operações são validadas antes da gravação. Cada alteração usa comparação do payload anterior no UPDATE e repete a leitura em conflitos. Os 25 eventos recentes continuam sendo apenas o histórico visual; os identificadores processados são conservados durante a sessão ativa inteira. Recursos e recibos são gravados juntos. Encerrar a sessão permite compactar os recibos porque os demais comandos dessa sessão passam a ser recusados. O limite físico do registro é verificado antes da escrita; excedê-lo recusa a ação sem expulsar identificadores de uma sessão ativa, e o encerramento continua possível.

O inventário usa revisão tática por item e referência observada pelo editor. Consumos, localização e equipamento são conciliados sem depender do histórico visual. A definição dos itens continua exclusiva do proprietário. Rascunhos antigos sem referência não perdem valores divergentes durante a sincronização; alterações concorrentes do mesmo item exigem conciliação explícita. O salvamento preserva os recursos e a sessão de combate atuais.

O estado anterior `combat` continua legível e recebe espelhamento para compatibilidade. `combatState` é inicializado a partir dos máximos derivados ou dos recursos antigos, nunca redefinido para cheio em uma atualização de combate. Tipos e constantes ficam em `character-model.ts`; `character-data.ts` mantém a interface pública e a normalização sem dependência circular.

## Sincronização

Polling serial a cada 1,5 s na aba visível, 6 s em segundo plano e consulta imediata ao voltar à aba. ETag compara `updatedAt` em consulta de metadados; uma resposta 304 não carrega o payload. As ações são persistidas individualmente no navegador por conta ou vínculo e ficha antes do envio, sem armazenar credenciais na fila. Reenvios conservam a mesma identidade após recarregamento ou fechamento da aba. Falhas transitórias usam backoff; recusas definitivas ficam visíveis e exigem intervenção. BroadcastChannel `karmalizacao:combat-sync` distribui o estado confirmado entre abas da mesma origem; não promete latência física de zero milissegundos.

Encontros têm abertura e encerramento explícitos. A abertura exige a sessão anterior esperada, impedindo que um comando de abertura atrasado substitua uma sessão mais recente. Iniciar um encontro não restaura recursos. O índice de rodadas da sessão de cada participante avança consecutivamente e é independente tanto do contador acumulado da ficha quanto da posição global da mesa, permitindo conectar participantes posteriormente.

Antes de avançar a rodada, o Mestre persiste a identidade da transição e seus alvos individuais. A retomada reutiliza essas identidades mesmo quando a resposta se perdeu após o servidor gravar. Para NPCs locais, estado, recibo e progresso da transição são salvos no mesmo snapshot antes de atualizar a tela. Falha ao persistir impede a aplicação local.

## Resolução preservada

Todas as 35 perícias publicadas estão disponíveis, com abordagem selecionável. A reserva social padrão usa Presença. Uma troca social precisa ser autorizada pela técnica ou Domínio. O cálculo reutiliza treinamento comum/evolutivo/transcendental, Analítico limitado a +3, Essências e penalidades de inventário. Desvantagem retira um dado; abaixo do mínimo, rola dois e escolhe o menor. Não foi substituída pela opção incompatível de escolher sempre o menor de toda reserva treinada.

Um ataque igual à CA é total. O parcial vai de metade da CA, arredondada para baixo, até CA − 1. Dano parcial é dividido e arredondado antes de Resistência e escudo temporário. Não existe mínimo gratuito de dano após proteções. Crítico dobra apenas os dados-base registrados; dados adicionais e condições exigem sua própria resolução. O Mestre confirma o alvo e aplica o dano depois de ver o resultado. Poderes condicionais, respostas opostas e custos variáveis conservam seus textos e exigem confirmação; o programa não presume sucesso de controle ou Evasão.

A Saturação mantém `CD 14 + Saturação total` conforme `lib/alchemy.ts`, não `19 + excesso`. Consumo registra Saturação 1/2/3, com aceitação e benefício resolvidos antes de curar. O dono define o inventário. Quem tem o link pode consumir unidades existentes e ajustar local e equipamento. Domínios pagam ativação uma vez por cena, com Refinamentos e duração; não há manutenção automática inventada. A Transformação Corrompida conserva ativação em Movimento, custo 0 e os requisitos próprios; seu teste de controle e a Ruptura são resolvidos na mesa.

## Escudo do Mestre

Busca em todas as fichas oficiais estruturadas, invocações e ameaças; a família humana também recupera fichas legadas do HTML compilado. Ajustes no encontro não alteram o Bestiário. Resistência do NPC é selecionada conforme a fonte de dano e seus traços. Não se infere uma proteção universal de um texto condicional.

Forja com Etapas I–VII, papel, atributos, perícias, recursos e técnica de função primária com ação, alcance, duração e um efeito menor. Acesso a Grau III em III, IV em V e V em VII; treinamento precisa ser conferido na fonte. Área e secundárias usam o construtor completo do Capítulo 10. Doze presets são cópias das ameaças iniciais existentes.

Rodadas restauram Reações, reduzem contadores e cobram a manutenção de Invocações ativas. A criatura é recolhida se faltar Karma. Fases de Euphere (90 e 1), Maélia (metade da Vida máxima) e Geppeto (40 ou três Âncoras desligadas) geram avisos uma única vez no encontro. Fases gratuitas aplicam apenas os valores finais explicitamente configurados. A Mãe do Vazio fica disponível, mas requer confirmação de Controle CD 17 e pagamento de 13 Karma e 6 PC; não há cura ou restauração de recursos ao transformar. A Falsa Santa usa fases configuradas pelo Mestre, sem limiar canônico inventado. Os limites de Geppeto continuam na tabela: até quatro peças, soma de Graus 8, três comandos; as artes pagas das marionetes exigem Geppeto no encontro. Adicionar uma ficha ao encontro não equivale a pagar sua manifestação nem concede ações.

## Verificação

Testes com SQLite em memória executam as queries reais da API com sessão substituída apenas no ambiente de testes. Cobrem acesso por token/dono, revogação, ETag, validação, operações simultâneas, reenvio e preservação ao salvar. Testes de motor cobrem reservas, treinamento, Analítico, inventário, dano misto, escudo, cura, Karma, duração e catálogo. A verificação visual usa uma ficha fictícia exclusivamente no banco local da prévia, sem modificar personagens de produção.

## Cinema e acessibilidade

Rolagens guardam os dados reais, a seleção e o modificador no evento. A animação de 600 ms apenas revela esse resultado, sem rolar novamente. O selo natural 20 ou 1 considera exclusivamente o dado selecionado; o brilho de crítico não ignora CA ou CD. Números flutuantes refletem diferenças confirmadas de Vida, escudo e Karma.

Som sintetizado e vibração começam desligados e exigem ativação do usuário. Movimento reduzido respeita a preferência do sistema e o botão próprio. Avisos têm fechamento por botão/Escape e não bloqueiam o foco nem interrompem ações de combate.

O Mestre mantém uma caixa local de avisos de fase e entrega cada evento às fichas vinculadas pela API de combate; rolagens de NPCs também são retransmitidas sem cobrar Karma dos espectadores. Reenvios usam o mesmo ID e há recuperação após falhas transitórias. Cada ficha conserva um resumo das últimas fases por chefe, separado da própria CA e dos próprios recursos. Isso transporta avisos entre dispositivos; não torna o encontro, a iniciativa ou os NPCs uma campanha compartilhada no servidor.

Fases personalizadas permitem limiar de Vida/percentual/Âncoras, CA final, Resistência e habilidades existentes liberadas. Configurações e efeitos valem apenas no encontro. Nenhuma fase reabastece Vida ou Karma. A redução não divina da Mãe do Vazio exige selecionar a fonte de dano; efeitos condicionais seguem a ficha.

## Patch 1.14

Iniciativa usa Reflexos com Agilidade, sem reservar a parada completa para destreinados. Defesas rápidas usam as abordagens indicadas nos botões; perícias agrupadas são lidas pelo parser compartilhado do catálogo. A seleção de alvos de área é local; cada aplicação preserva a autorização por ficha, Resistência e escudo individuais. Falhas parciais de sincronização nomeiam os alvos que não receberam o efeito, sem cobrar novamente os demais.

Exportação de encontro leva estado dos NPCs, rodada e iniciativa. Jogadores são referências por ID, nome, equipe e iniciativa, sem payload completo nem tokens. Ao importar, reconectar os jogadores por seus links recupera a equipe e iniciativa salvas; não sobrescreve recursos no servidor. Arquivos são validados antes de substituir o encontro, até 5 MB e 60 participantes. A biblioteca da Forja valida até 30 modelos e informa falhas de armazenamento. Limpar o encontro não apaga fichas de jogadores.

O descanso seguro é uma ação autorizada e confirmada: Vida/Karma máximos, escudo e Saturação zero, rodada 1, Domínios limpos, Reação padrão, Forma encerrada/desbloqueada. Carga de Corrupção e condições são preservadas. Testes, dano e cura não são disparados pelo descanso. Técnicas e armas exibem dados-base dobrados em 20 natural, sem somar gratuitamente dados adicionais ou aplicar dano ao alvo.
