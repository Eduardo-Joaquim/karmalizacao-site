# Auditoria aplicada — 28/10/2026

A revisão compara o relatório recebido com os arquivos em vigor. Correções de interface e estrutura foram separadas de escolhas deliberadas de regra. Os textos públicos das atualizações descrevem apenas o que muda para os jogadores.

## Correções confirmadas

| Frente | Evidência e decisão aplicada |
| --- | --- |
| Tipografia | Existiam fontes de 6–9 px. Os estilos autorais passam a usar piso de 0,6875 rem para rótulos, notas de ficha ampliadas e texto de leitura de 1 rem. O layout mantém responsividade e foco visível. |
| Criação de fichas | A rota exigia login antes de mostrar o criador. Agora aceita visitante, guarda rascunho local e permite exportar. Entrar continua necessário para nuvem e link compartilhado. A importação do rascunho gera uma nova ficha em vez de sobrescrever a primeira ficha da conta. |
| Uso em mesa | Rolagens registradas podem ser executadas com comparação por CA ou CD. A ficha tem recursos atuais, custos simples de técnicas e contadores de rodada e Domínios. O jogador ainda declara ação, requisitos, manutenção e consequências. Nenhum resultado inflige dano automaticamente. |
| Dossiês | Abrem com resumo, com filtros de técnicas, Domínios e história. A página /mesa mantém duas fichas independentes lado a lado. |
| Geppeto | O painel de comando reúne Vida, CA, movimento, ataque, técnica e custos das sete peças. Os quatro vínculos simultâneos, soma de Graus 8 e três comandos são preservados. |
| Catálogo | A categoria e as propriedades de armadura eram inferidas pelo nome. Agora vêm de um registro JSON associado a identificadores estáveis. Um teste renomeia uma armadura e verifica que CA, carga e teto de Agilidade permanecem iguais. |
| Compiladores | O compilador compartilhado passou a atender também a corte humana. Regiões e contagens ficam em configuração; o parser de campos é único. A montagem dos continentes e as figuras civis conservam adaptadores próprios. Não houve reescrita total em TypeScript: o runtime já consome JSON, e Python/Pandoc são necessários somente para regeneração editorial. |
| Imagens | Já havia redução e limite de imagem; não eram arquivos originais ilimitados. Os novos envios passam a 512 px e cerca de 48 KB, preservando leitura de imagens anteriores. O limite de ficha passa a verificar bytes UTF-8. Não houve migração para R2 nem exclusão de retratos. |
| Testes | O comando principal executava só a verificação do protótipo. Agora descobre todos os testes atuais, com suporte a módulos VM e execução sequencial. Os dois arquivos históricos de regras 1.2 permanecem no comando legado; expectativas de formato antigas que ainda eram relevantes foram corrigidas. |
| Origem e starter | O domínio admite variável de ambiente. Exemplos D1 de notas, ícones sem uso e caches versionados foram retirados; o banco de personagens e o favicon próprio continuam. |
| Ameaças iniciais | Vinte fichas de Etapas I–IV: cinco em Gaéria, cinco em Ignária, cinco em Aéria e cinco da Torre, com habitat/andar, recursos, traço, ataque e técnica com custo discriminado. |

## Balanceamento adaptado

O porte Grande começava em 191 cm e retirava 3 m de Movimento. A descontinuidade era excessiva para a ficção proposta. A nova tabela usa Minúsculo abaixo de 70 cm, Pequeno de 70 a menos de 130 cm, Médio de 130 a menos de 210 cm e Grande a partir de 210 cm. Grande retira apenas 1 m. Os menores deixam de ganhar velocidade por estatura. Vida-base, ajuste de CA e multiplicadores de carga não foram aumentados. A criação, normalização, inventário, cálculo e Capítulo 2 usam as mesmas fronteiras; fichas com altura preenchida devem ser conferidas antes da sessão.

## Propostas não adotadas

A Perícia 0 com 1d20 está expressamente prevista no Capítulo 1; não é um defeito do programa. Os 8 pontos comuns iniciais coexistem com bônus de raça/classe e progressão. Permitir a reserva completa destreinada alteraria acesso, votos de sacrifício e todos os encontros. Mantidos os 8 pontos, a lista e a reserva destreinada; treinamento continua necessário para superar certas CDs. CDs de tarefas comuns não devem ser confundidas com técnicas e feitos heroicos.

O parcial pode ser absorvido por Resistência ou escudo. Garantir 1 de dano final ignoraria justamente a proteção pela qual um tanque paga. A ordem de resolução foi preservada, assim como imunidades explícitas e perdas diretas de Vida previstas nas técnicas.

O relatório cita Alquimia como “19 + excesso”, mas a regra publicada é Constituição + Atletismo contra CD 14 + Saturação total. Não foi substituída por essa fórmula incorreta. Os Domínios têm custo de ativação e duração, sem manutenção automática de 1 Karma por rodada; a manutenção da Forma Corrompida é outra regra. O painel não unifica medidores que representam riscos distintos nem muda durações aprovadas para uma cena inteira.

A baixa CA da Falsa Santa é real: com 3d20 +10 contra CA 17, total exige dado selecionado de 8 ou mais, com probabilidade de 95,7125%; com 4d20, 98,499375%. O relatório confundia “18+ no resultado” com “18+ no dado”. Isso não demonstra sozinho a duração do encontro: três Reações, defesas, aliados, interrupções e contexto alteram dano efetivo. Vida 240, Karma 300, CA 17 e restrições de autocura foram preservados. Não foi inventada invulnerabilidade de fase nem transferência gratuita de dano. Alterar esses recursos exige avaliação de encontro, não uma correção tipográfica.

As mudanças de ergonomia reduzem consulta e contagem manual sem remover custos, limites, testes de risco ou ações. A revisão matemática e os testes automatizados verificam consistência; não equivalem a teste de mesa de todos os encontros.
