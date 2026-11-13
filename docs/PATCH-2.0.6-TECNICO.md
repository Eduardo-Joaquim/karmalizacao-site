# Registro técnico do patch 2.0.6

Data: 13/11/2026. Documento de manutenção; não integra o livro nem as notas públicas para jogadores.

## Contrato de inventário

A conciliação não usa o histórico visual de 25 eventos para determinar consumo. Cada item mantém uma revisão tática controlada pelo servidor; a referência observada pelo editor é metadado transitório da requisição. Quantidade, localização e equipamento não invalidam a revisão estrutural da construção.

Campos intocados acompanham a sincronização remota. Edições locais conservam sua intenção e referência; alterações concorrentes do mesmo item produzem conflito explícito. A granularidade de conflito é por item. Rascunhos antigos sem referência não podem ter valores divergentes apagados pelo polling. Confirmações de salvamento atualizam a referência mesmo quando o usuário continuou digitando, preservando as alterações posteriores ao envio.

O inventário conciliado é validado antes da escrita. A revisão tática recebida do cliente não é autoridade; o servidor incrementa o contador nas alterações táticas efetivas, inclusive as feitas pelo proprietário. A autorização por proprietário continua necessária para definição e salvamento completo dos itens.

## Ações e encontros

A deduplicação conserva os identificadores processados durante a sessão, independentemente do histórico visual. Não se usa a maior sequência recebida como prova de execução das sequências anteriores. Identidade de sessão, estado e marcadores de processamento são preservados na mesma escrita protegida por comparação do payload anterior.

A abertura e o encerramento de uma sessão são operações explícitas. A abertura compara a sessão anterior esperada; um comando atrasado não pode substituir uma sessão iniciada posteriormente. Sessões antigas não são reabertas. A rodada da sessão de cada participante é separada do contador acumulado da ficha e da posição global da mesa, permitindo entrada posterior sem saltar efeitos. Iniciar um encontro não restaura Vida, Karma ou outros recursos.

Transições novas são consecutivas. O Mestre persiste a transição e os participantes antes do primeiro efeito. Retomadas reutilizam a identidade original, inclusive quando a resposta HTTP se perdeu depois da gravação. NPCs locais conservam estado e confirmação no mesmo snapshot persistido.

A fila de ações é persistida antes do envio. Confirmações removem a operação; falhas transitórias recebem novas tentativas; falhas definitivas ficam visíveis e não são repetidas automaticamente. Conflitos de gravação transitórios são diferenciados de conflitos de domínio ou sessão.

## Conteúdo e apresentação

O campo estruturado Uso conserva seu HTML integral, sem cortar tags com expressão regular. Atributos como Constituição permanecem no mesmo agrupamento das demais mecânicas. Identidades dos dossiês são explícitas, a chance usa o metadado de cada habilidade e a API obsoleta de ornamentos foi removida dos chamadores.

As quatro técnicas contraditórias de Atargatis foram corrigidas na fonte editorial e propagadas aos arquivos derivados. Acerto Parcial termina em CA − 1; igualar a CA continua sendo Acerto Total. Nenhuma estatística ou custo foi rebalanceado.

A declaração de apresentação da barra de combate deixa de vencer a ocultação de impressão. O comportamento de recolhimento em tela permanece protegido pelo atributo hidden.

## Validação

Tipos, lint, formatação e build de produção aprovados. A suíte completa terminou com **203 testes aprovados**, sem falhas, cancelamentos ou testes ignorados. Inclui regressões de inventário, concorrência, recuperação, deduplicação após 600 ações, sessões distintas, transições consecutivas e renderização explícita dos **65 dossiês**, com verificação de integridade das tags HTML.

O artefato de produção foi consultado em **57 rotas**, todas com os status esperados, sem referências ao domínio antigo. A geração editorial foi executada duas vezes em cópia isolada, sem diferença da primeira para a segunda saída. A auditoria de dependências de produção retornou **zero alertas**. O teste de privacidade das notas públicas verifica a ausência de metadados técnicos na nova entrada.

A revisão independente também cobriu confirmação de salvamento chegando após sincronização mais recente, compactação de sessão encerrada, reabertura de filas após fechar a aba, escritores concorrentes de operações diferentes e respostas HTTP de erro sem JSON. O limite físico do registro recusa novas ações sem descartar recibos da sessão ativa; o encerramento compacta os recibos e continua disponível.

O fluxo gerenciado não disponibiliza a ferramenta de navegador necessária para homologação interativa. Testes de domínio, SSR e inspeção da cascata não são apresentados como execução de impressão/PDF, acessibilidade, Lighthouse ou teste entre navegadores.
