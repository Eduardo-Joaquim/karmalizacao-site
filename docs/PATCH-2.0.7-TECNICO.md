# Patch 2.0.7 — preparação editorial e Runas Amaldiçoadas

A revisão editorial ainda em preparação foi renumerada para 2.0.7. A entrada histórica publicada de 2.0.6 permanece no arquivo de notas. Esta preparação não foi publicada.

## Atributos e treinamentos

`getEffectiveAttributes` centraliza os atributos finais; `getFinalAttribute` delega ao mesmo cálculo. A composição distingue base, raça, classe, etapas e ajustes expressos. As dezoito definições de classe registram seus bônus iniciais de atributo em dados estruturados. O Escriba recebe +2 Intelecto, preservando +1 Espírito.

A repetição entre etapas já estava permitida. A regressão protege esse comportamento e aplica distinção somente dentro de um grupo que a exija expressamente. Treinamentos iniciais sobrepostos admitem redirecionamento explícito, mantendo separados os oito pontos-base e as concessões extras. A confirmação do primeiro marco e a migração de fichas anteriores permanecem preservadas.

## Runas Amaldiçoadas

`data/cursed-runes.json` reúne dez Condições, cinco faixas de potência e 21 efeitos completos. `docs/runas-amaldicoadas.md` e `scripts/book207/cursed.py` integram os capítulos 9, 14 e 17. `scripts/build-book-207.py` aplica a edição completa depois dos compiladores especializados; a entrada antiga de 2.0.6 funciona como compatibilidade para o mesmo processo atual.

A inscrição pertence à construção de uma arma individual. Não consome vaga pessoal nem Karma Retido. A conciliação da gravação marca como destruídas as inscrições convencionais daquela arma, conservando o prazo de retorno do Retido. A limpeza ocorre também depois da combinação do estado remoto, evitando ressuscitar inscrições em uma gravação estrutural. A maldição participa da revisão estrutural; ações de combate compartilhadas não alteram sua construção.

O estado de combate conserva marcas por arma/alvo, histórico de Total, alimentação e torpor. As operações reutilizam os recibos e a gravação atômica existentes. Fome consulta o dado selecionado, tributo de Vida é irreduzível e o torpor distingue cenas de combate da exploração. Interações exigem o Controle declarado contra a CD definida antes da rolagem; o procedimento de despertar conserva 1 TE. O painel registra ataques já resolvidos e apresenta o dano e os estados para resolução em mesa, sem reaplicar automaticamente o ataque ou os efeitos heterogêneos.

O preset Deus Selvagem conserva C1 + C4 + C5, três marcas, 2d6 e CD 20. As vinte outras entradas mantêm os textos do autor. A interpretação entre seus estados e as faixas da Tabela B continua identificada para revisão; não foram introduzidos mínimos ocultos de condições.

## Validação

298 testes aprovados, verificação de tipos e build de produção aprovados. Inclui rotas D1, conciliação de inscrições, conservação do Retido, limites de links compartilhados, normalização/exportação, marcas, Fome, tributo, torpor e regressões de atributos/perícias. A geração completa repetida produziu o mesmo livro, com vinte capítulos, dezoito classes e 243 Outorgas; IDs e âncoras do sumário foram conferidos. A comparação do Bestiário preservou os campos protegidos de 94 fichas.

A conferência interativa em navegador não foi realizada. O livro Word foi reaberto para conferência estrutural; isso não substitui a leitura visual. Notas públicas contêm somente mudanças para leitores e jogadores, sem o prompt, auditorias ou detalhes de implementação.

## Conferência geral de classes e raças

O pente-fino das dezoito classes e nove raças corrigiu a exclusão indevida de bônus de atributo repetidos entre criação e marco VI e retirou concessões flexíveis incondicionais de Ladrão, Assassino, Inventor e Invocador. Sobreposições reais continuam oferecendo redirecionamento, sem apagar os oito pontos-base. Os testes confrontam 1.296 combinações de classe, raça e fase, 94 combinações de escolhas raciais e 162 roundtrips de classe/raça, com expectativas transcritas dos benefícios publicados e das duas colunas de progressão. Notas públicas resumem o bug, listam os capítulos alterados e omitem o exemplo individual de maldição.
