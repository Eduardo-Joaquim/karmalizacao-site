# Registro técnico do patch 2.0.5

Data: 11/11/2026. Este registro não integra o livro, o pop-up ou o histórico público de patch notes.

## Integridade e acesso

- Salvamento de ficha existente exige revisão da construção aberta. Uma edição antiga recebe conflito, sem sobrescrever a atual. Mudanças de recursos em combate não invalidam a revisão da construção; a comparação atômica do payload continua protegendo a gravação.
- Respostas de salvamento preservam alterações digitadas durante o envio. Abertura de fichas cancela requisições anteriores; transição de ficha durante save é impedida.
- Recuperação local por conta/ficha, aviso ao fechar com alterações e exportação explícita. A recuperação é uma ação do usuário, nunca substituição automática da nuvem.
- Listagem com cursor, resumo compacto e indicação de registros incompatíveis. Exportação bruta é restrita ao proprietário e permite recuperar um registro que não passa pelo schema atual.
- Leitura de corpos tem limite de bytes durante o streaming; parsing inválido retorna 400, excesso retorna 413. Respostas privadas declaram no-store.

## Combate e navegação

- Thalassia foi integrada ao catálogo e à mesa de duas fichas, com os quinze perfis existentes, sem rebalanceamento.
- Fórmulas de NPC preservam seleção do menor dado; dano é interpretado antes do desconto de Karma. Rodadas parciais mantêm identidade de operação e conclusão por participante durante a sessão.
- CA segue o patch 2.0.4: igualar a CA Total já concede Acerto Total. A indicação CA+1 da revisão preliminar foi corrigida; não foi aplicada às regras.
- Calculadora de Corrupção reutiliza funções da ficha e distingue contexto de Forma e de técnica; duração de marcha corrigida para horas.
- Domínio oficial, índice das Nove Asas, hashes inválidos, títulos duplicados, Atlas e leitura contínua foram corrigidos.
- O sumário conserva âncoras legadas e o portal abre a asa/divindade ao seguir um hash. A busca informa falha de conexão e permite teclado.

## Desempenho e manutenção

- Busca do mestre e catálogo de combate consultados por endpoint. Dossiês extensos carregam ao abrir a consulta; índices normalizados são reutilizados.
- Bestiário recebe somente integrante selecionado e índice resumido; mapa compacto resolve hashes sem importar prosa regional.
- Persistência do encontro usa debounce; polling tem backoff e jitter nas falhas. Retratos continuam miniaturas incorporadas, com exceção de lint documentada para esse uso.
- Estilos específicos saíram do layout global quando puderam ser associados ao fluxo. Não foram removidos seletores sem evidência de uso visual.
- Campos reutilizáveis e recuperação foram extraídos do criador; TSX/CSS foram formatados e imports/declarações mortos removidos. TypeScript passa a exigir noUnusedLocals/noUnusedParameters.
- Componentes vendorizados de UI foram retidos intencionalmente: parte participa dos testes do catálogo. A ausência de alcance atual não foi usada como prova suficiente para excluí-los.
- Geração editorial verificada em cópia isolada e tornada idempotente. JSON canônico permaneceu inalterado.
- CI verifica formatação, tipos, lint, build, testes e auditoria de produção. Testes de artefato executam após build; o teste SSR fornece somente o binding de plataforma ausente no Node.

## Dependências e verificações

React/RSC, Next, Vinext, Vite e ferramentas Cloudflare foram atualizados em conjunto. Zod foi migrado para v4, mantendo registros parciais e compatibilidade de fichas antigas. A auditoria de produção retornou zero alertas; a árvore completa conserva 15 alertas moderados de ferramentas/transitivos, sem alertas altos ou críticos na medição. Não aplicar downgrade sugerido automaticamente para Vinext ou Drizzle sem avaliar compatibilidade. A classificação npm de produção não substitui análise dos componentes incorporados pelo build.

Verificações automatizadas incluem o conjunto histórico atual e regressões de revisão, preservação do combate, paginação, JSON inválido, tamanho UTF-8, Thalassia e retomada parcial. Os resultados finais da entrega ficam no commit e nos checks de CI.

## Limites ainda abertos

- Testes interativos em Chrome/Firefox/Safari, leitor de tela, responsividade, Lighthouse e carga real com 60 jogadores não foram executados: a ferramenta cua_repl.js exigida pelo fluxo gerenciado não estava disponível. SSR, build e testes de domínio não substituem esses ensaios.
- Não foram alteradas fichas privadas reais nem executadas explorações de vulnerabilidades. Autenticação e revogação foram validadas por contratos simulados; homologação com duas contas reais continua necessária.
- Algumas mecânicas legadas de NPC ainda são extraídas de prosa; a substituição completa por campos estruturados requer migração editorial por região.
- Refatoração completa dos grandes componentes e remoção de CSS por cobertura continuam incrementais; formatação e extrações desta entrega não são apresentadas como eliminação de toda complexidade.
- A retomada de rodada é mantida durante a sessão; recuperação depois de fechar a janela ainda requer conciliar o encontro com as fichas vinculadas.
- O espelho antigo do Drive não foi sobrescrito. Uma cópia versionada da entrega permite identificar o código atual sem apagar os arquivos anteriores.

As notas para jogadores contêm exclusivamente efeitos observáveis: nenhuma lista de arquivos, commits, dependências, APIs, testes, alertas ou limitações administrativas.

## Resultado de homologação automatizada

- Tipos e lint sem falhas; formatação das fontes manuais aprovada.
- 156 testes aprovados, sem falhas, cancelamentos ou testes ignorados.
- Smoke test SSR de 57 rotas com os status esperados e nenhuma referência ao domínio anterior. As 125 âncoras locais do capítulo 13 têm destino no HTML inicial.
- O chunk específico do mestre caiu de 4.521.534 para cerca de 180.555 bytes; o chunk específico do leitor de Bestiário, de 669.136 para 57.799 bytes. Esses valores não representam o total de JavaScript de cada página; há dependências compartilhadas e consulta extensa sob demanda.
- Componente CombatPanel legado, sem referências de aplicação/testes, removido com seus seletores exclusivos. O modo de combate atual permanece em PlayerCombatMode.
