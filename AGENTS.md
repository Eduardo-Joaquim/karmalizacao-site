# Atualizações do site

## Novos verbetes de Ignária

Grafia obrigatória: família **Lunaviel**, nunca Lunavir. Casa Marquesal Lunaviel: Caroline “A Patriarca” (Duelista V, SS, Vida 168, Karma 84, CA 26, atributos 6/7/6/5/7/5, duas espadas e Estilo da Espada da Lua, sete técnicas e Gekkō), Valentino Heathcliff (S, consorte e protetor, Vida 132, Karma 68, CA 24, Força 6 e Constituição 7) e Alaric Voss (mordomo Pugilista V, S, Vida 164, quatro técnicas e Réquiem). Caroline é a combatente mais forte da casa. Helena foi excluída; não a restaure. Maximillian e Dominick aparecem somente em menções narrativas, sem fichas. Todos usam duas Reações por rodada, uma por resolução.

Manuscritos novos: docs/corte-demoniaca-ignaria.md, docs/ghouls-ignaria.md, docs/casa-lunaviel-ignaria.md. O compilador regional aceita --demons, --ghouls, --lunaviel; build-vampire-ignaria.py integra os quatro manuscritos de Ignária. Novas páginas /mundo/ignaria/corte-demoniaca, /ghouls e /casa-lunaviel; API/MCP regiao demonios, ghouls e lunaviel, mantendo ignaria para vampiros.

Valac Lucifero é Ocultista VII, 86 anos, atributos FOR/AGI/CON/INT/PRE/ESP 6/7/8/5/12/10. Nove técnicas (2 Abismo, 2 Bênção, 2 Corrupção, 3 Ocultismo) + Miserere; quatro técnicas normais exigem Domínio. Quatro Domínios nível 2. Desespero é Bênção Verdadeira não hereditária, contador 50 por dano efetivo, +2 dados de dano-base e +5 redução; terceiro uso dobra benefícios e duração. Quatro herdeiras V, classes/elementos distintos, sem Domínios, 5 técnicas+assinatura cada; só Belial e Asmodeus possuem bênçãos. Agares é duque de Ignária, não de Gaéria; preserve exclusividade continental Solvaldren em Gaéria.

Al-Aqwa: ghoul Tanque VII, 20 anos, atributos 10/3/14/3/5/3; sete técnicas marciais/kármicas com condições e assinatura Ananké 4d10 + condição grave. Sahar, Naima e Zahra são ghouls VI candidatas, não rainhas empossadas. Patch 1.9 corresponde a 24/10/2026; consolidar novas entregas desse dia na mesma entrada.

## Corte Vampírica de Ignária

A Corte Haimaton de Sárkora usa docs/corte-vampirica-ignaria.md. build-vampire-ignaria.py gera data/vampire-ignaria.json pelo compilador regional compartilhado e integra Ignária ao Bestiário; build-bestiary.py executa todos. Nosferato V. Drácula, sexta rainha, 1.767 anos, Mercenária VII, atributos 7/7/7/7/7/7, tem sete técnicas e assinatura, duas Reações. A divisão obrigatória, sem a assinatura, é Água 1 (Aegis), subdobra de Sangue 3 (Cruor, Rubedo, Coagulum), Karma 2 (Retorsio, Sutura) e Marcial 1 (Hasta). Imperium usa estacas, passagem régia, Estigmas da lança e recolhimento; não restaurar a antiga assinatura em linha. A bênção Haimaton foi transmitida a Alucard no nascimento; a rainha conserva a subdobra elemental de Sangue, sem duplicar a bênção. Alucard é Assassina VI, 100 anos, seis técnicas e assinatura: Mors, Tacita, Umbra, Acus, Exúvia, Sepulcrum e Erebos. Preserve Primeiro Sangue, preparo, ocultação e isolamento, sem voltar a uma rotação de prisão e drenagem. Sávia Vita é Curandeira IV. Dorne e Kessel são casas marquesais; Senn, condal; Kost, viscondal. Seus combatentes são vampiros III–IV. A nova página /mundo/ignaria/corte-vampirica e regiao=ignaria na API/MCP são públicas. CrownNavigation aceita região e destino de retorno; preserve os padrões de Gaéria.

## Texto do Bestiário

Os integrantes da Corte da Falsa Santa devem ter somente História e Origem e Ficha de Combate em seus registros. Preserve a identidade canônica de cada integrante: Inveja é Maélia Veyr, com Argila Viva e a boneca azul de Eron. Não a substitua por Cinderela. Não inclua histórico de versões, arquivos, datas de recuperação, avisos de playtest ou comentários de bastidores no texto do livro; atualizações pertencem à aba de Patch notes.

O Bestiário usa apresentação própria em `components/bestiary-reader.tsx` e `app/bestiary.css`, com fichas estruturadas em `data/court-sheets.json`. Preserve os painéis de recursos, atributos e cartões de habilidades; não volte a exibir fichas como tabelas extensas no leitor genérico. Ao editar a corte, mantenha os manuscritos em `docs/corte-da-falsa-santa.md` e `docs/bestiario.md` coerentes e execute `python3 scripts/build-bestiary.py` para atualizar os dados de busca e as fichas. Os valores-base e os percentuais do ajuste estão em `data/court-balance.json`; aplique-os uma única vez, sem aumento cumulativo ao gerar as fichas. Euphere usa a base anterior ao buff individual para os percentuais; os valores finais devem considerar os overrides manuais descritos abaixo. Campos sem valor-base permanecem indefinidos.

Os ajustes manuais mais recentes ficam em `overrides` de `data/court-balance.json` e são aplicados depois dos percentuais: Euphere Vida 121 (fase II em 60); Gula Vida compartilhada 124; Geppeto Vida 91 (fase II em 45); Ganância CA 26; Nemetor Vida 160 e Karma máximo 54 (fase II em 80). As sete invocações usam `data/geppeto-summons-source.json`; o fator 130 aplica-se uma vez a Vida, CA, atributos e deslocamento, não a custos. Chamadas, técnicas e manutenção são pagas por Geppeto. Pinóquio mantém uma Bênção observada e uma técnica de até Grau IV em espaços separados. `scripts/build-bestiary.py` também gera seus dados e o apêndice detalhado; não edite as saídas geradas isoladamente.

A pedido do usuário, toda atualização publicada deve incluir um registro na aba de Patch notes.

Antes de publicar, atualize `lib/patch-notes.ts`: adicione a entrada mais recente no início de `PATCH_NOTES`, com ID único, data real e resumo em português das alterações daquela entrega. Preserve as entradas anteriores e descreva limitações relevantes sem apresentar trabalho pendente como concluído. O primeiro registro define `LATEST_PATCH` e permite que o aviso de nova versão apareça novamente.

## Patch notes para leitores

A entrada de 18/10/2026 consolida todas as atualizações desse dia. Mantenha uma única entrada para essa data ao acrescentar novas mudanças; atualize seu ID de revisão para reexibir o aviso. Escreva apenas mudanças relevantes para leitores e jogadores, com valores finais em vigor. Não inclua mensagens dirigidas ao autor, conversas, bastidores, arquivos consultados ou ajustes intermediários já substituídos. Preserve os registros de outras datas. Uma revisão editorial do histórico deve atualizar a entrada consolidada, sem criar uma nota sobre a própria edição dos patch notes.

## Público e versões

O usuário autorizou acesso público por link. Preserve `public` nas próximas publicações e use `save_site_version` seguido de `deploy_site_version`; não use publicação owner-private. Livro, Bestiário, portal e busca são públicos. Criação, gravação e gestão de personagens exigem identidade e autorização por proprietário no servidor. A numeração dos novos patch notes continua da sequência existente: a entrada consolidada de 18/10/2026 é Patch 1.5; a próxima nova entrada será 1.6. Revisões no mesmo dia mantêm 1.5, atualizando apenas o ID de revisão para o aviso. Não renumere registros históricos sem número nem exponha IDs internos no cabeçalho; use `version`/`getPatchVersion`.

## Navegação automatizada

Patch 1.6 adiciona /llms.txt, /robots.txt, /sitemap.xml, /api/regras, /api/bestiario e MCP em /mcp. Preserve capability mcp. Consultas públicas não exigem identidade. Ferramentas de fichas reutilizam a API validada e a autorização por proprietário; criar_ficha gera novo UUID, mantém compartilhamento desativado e não sobrescreve fichas existentes. Nunca aceite proprietário ou identidade nos argumentos do agente. Mantenha links diretos do Bestiário com integrante e leitura nos parâmetros, renderizando o integrante solicitado no servidor. Verificação: node --experimental-vm-modules --test tests/agents.test.mjs.

## Reino Humano de Gaéria

Valdária tem fonte em docs/reino-humano-gaeria.md. scripts/build-gaeria.py gera data/gaeria.json e recompõe a seção Gaéria de docs/bestiario.md; build-bestiary.py chama esse gerador. A rainha Aveline (38 anos, Especialista VII, atributos 5/7/10/7/5/10) tem sete habilidades; Isadora (Bardo V), seis; Brígida (Pugilista IV), quatro; Tomás (Tanque V), cinco. Aveline governa um reino regional, distinto da Imperatriz Humana. Preserve reflexões com reação comum, confronto, três rodadas, manutenção e proibição de ciclos de reflexão. A página /mundo/gaeria/reino-humano e regiao=gaeria no Bestiário/API/MCP são públicas. Novas mudanças do dia 20 mantêm Patch 1.6 com novo ID de revisão e resumo consolidado.

A Corte Humana usa components/human-court-sheets.tsx, com identidade visual própria para Aveline dentro do template comum de nobres e duas seções por personagem. Não renderize a corte como artigos de parágrafos uniformes. data/gaeria.json.courtProfiles é gerado a partir do mesmo manuscrito; não edite habilidades na saída. As oito figuras civis têm História e Origem e Ficha básica. A página do reino não inclui SiteHeader, menus de conta ou patch notes; o registro permanece na aba global.

Gaéria tem diretório público /mundo/gaeria com cards reais de cortes, organizações e estado vazio de monstros. CrownNavigation é o índice reutilizável das cortes, autorizado pelo pedido mais recente, com botão à esquerda e nome/título da figura em leitura; não o remova pela regra anterior sobre menus globais. Valdária não exibe intervalos numéricos de acerto da CA; preserve a resolução parcial das habilidades. Germano Ferromonte (Tanque III), Celina Vesperal (Elementalista III) e Raul Cedral (Ranger II) são combatentes das três casas, com três técnicas cada.

## Falsa Santa

A Prorrogadora da Extinção (`prorrogadora-da-extincao`) é a oitava ficha da corte, sua soberana, não um oitavo pecado. Fonte editorial em docs/corte-da-falsa-santa.md; o gerador acrescenta seu perfil depois dos percentuais antigos, que não se aplicam a ela. Vida 240, Karma 300, PC 20, CA 17, seis atributos 7/7/7/10/10/10, Luta e Atletismo 2. Assinaturas compartilham um ápice por cena. Use as rolagens do livro publicado, sem restaurar a convenção de somar atributo do documento anexado. Patch 1.7 inicia o dia 21/10/2026.

A partir do Patch 1.8 (22/10/2026), a Falsa Santa não usa nenhuma técnica corrupta em si mesma nem recebe benefícios indiretos delas. A metade da cura do Manto que lhe seria destinada se dissipa. Sua única autocura é Adão — Primeiro Sopro uma vez por cena, sem ativação extra. Sutura Impossível e Costura do Excedente são apenas para terceiros.

Perícias declaradas usam SkillPanel e lib/skill-display.ts; nobres HTML usam scripts/skill_panels.py no gerador. Não deduza níveis ausentes a partir de bônus temporários ou de perícias das vítimas. A Falsa Santa usa FalseSaintRepertoire, com 13 técnicas, duas assinaturas incluídas, e sete trombetas separadas; preserve integralmente os efeitos e a restrição de autocura. Novas entregas do dia 22 consolidam Patch 1.8.

## Elaranth e revisão das fichas

A Casa Solvaldren é a única casa ducal de todo o continente de Gaéria, com sede em Elaranth. Não restrinja essa exclusividade apenas ao reino élfico.

O Reino Élfico tem fonte em docs/reino-elfico-gaeria.md. scripts/build-elven-gaeria.py gera data/elven-gaeria.json, e scripts/build-gaeria.py integra Valdária e Elaranth ao Bestiário. A página pública é /mundo/gaeria/reino-elfico; regiao=elaranth expõe a mesma fonte na API e no MCP. Preserve a navegação lateral por nome e título.

Naerith Vaelora, Dryás Basíleia, é Ranger VII SSS e mantém sete técnicas, três reações próprias e Heliánthos. Sua economia é de três Reações por rodada, sem duas respostas à mesma resolução. A Falsa Santa também possui três Reações por rodada; Aveline possui duas. Thaerion Solvaldren usa a subdobra Heliose, cujas condições são Ofuscado, Insolado e Ressequido.

Fichas de personagem não exibem blocos intitulados Fraquezas, Recompensas, Vitória e recompensa, Atitudes no combate, Condução do encontro ou Ritmo do confronto. Limites indispensáveis devem permanecer dentro das habilidades ou em traços com nome próprio. Não restaure orientações de comportamento tático removidas. Os epítetos de Gaéria são curtos e pertencem à cultura de cada corte; preserve os títulos atuais ao regenerar os dados.


## Inventário e códice de equipamento

A fonte dos capítulos 17/20 é docs/equipamentos-tecnologia.md; scripts/build-equipment.py integra os capítulos em data/rules.json e gera o catálogo usado pelo InventoryManager. Execute esse gerador após outras regenerações do livro. Carga aceita frações, local externo não conta, armadura vestida conta, somente uma armadura e um escudo alteram CA. lib/inventory.ts define as faixas e fontes independentes de desvantagem; character-rules aplica CA, movimento e reserva de dados. Preservar dados antigos e validação/autorização por proprietário. Mochila e recipientes não criam capacidade corporal. Não tratar CA condicional de colete como bônus universal.

## Fichas nobres e precedência

CourtDossier é o template comum das cortes humanas, élficas, vampíricas e demoníacas, nobres de Ignária e governantes marquesais de Valdária. NobleTraitCards distingue Domínio, Bênção e Arma/Estilo, sem truncar os efeitos. NobleOrnament fornece desenhos heráldicos individuais de fundo. O usuário esclareceu que ilustração significa ornamento, não retrato: não inserir retratos. Preservar paletas individuais. Índice do códice mostra Gaéria e Ignária. Diretórios continentais apresentam precedência imperial no topo; casas seguem ducal, marquesal, condal, viscondal e baronial. Não converter uma rainha regional em imperatriz. Patch 1.9 mantém data 24/10/2026, consolidando novas mudanças com revisão de ID.

Caroline tem patamar de chefe equivalente aos Pecados, abaixo das rainhas. Preserve duas espadas, Espada da Lua, duas Reações e superioridade dentro da família; não restaurar Vida 240, CA 28, atributos de 8–10 ou assinatura de 5d10. Gekkō custa 12 Karma e causa 4d8, com resposta única de 2d6 que gasta Reação.

## Transformação e sincronização do livro

docs/corrupcao-marca-base.html preserva integralmente o Capítulo 14 original; docs/transformacao-corrompida.md é adição antes de Ruptura. scripts/build-corruption.py recompõe somente esse capítulo sem alterar o texto retido. A rede base continua Movimento/0 Karma, Carga 7–9, 2/4/8 Enxertos a 15 m. Mutações são pacote corporal opcional: Etapa III e Controle 1, 6 Karma para ativar, 1 por turno seguinte; espaços 1 em III, 2 em IV/V, 3 em VI/VII com Controle 2 (senão 2). Cinco turnos acumulados da cena geram marco +1 Carga e Controle; encerrar depois de cinco causa Exausto. Ruptura encerra e bloqueia tudo até descanso seguro. lib/corrupted-form.ts valida benefícios; nunca conceder aumento de Vida, atributos, ações ou bônus geral em Controle. Instinto exige contexto específico, sem contaminar toda Perícia. O Word do Drive contém apenas capítulos 1–20; nunca inserir Bestiário, famílias ou interface nele. Execute build-equipment e build-corruption após regenerar o códice. Sem retratos no site, apenas ornamentos heráldicos.

O catálogo usa ItemCatalogPicker, sem select nativo. lib/item-catalog.ts ordena com Intl.Collator pt-BR e busca normalizada sem acentos/caixa; Item personalizado fica no topo. Preservar abertura ao digitar, teclado, etiquetas de carga/preço e o catálogo único gerado a partir das tabelas.

## Alquimia e títulos editoriais

docs/alquimia.md está integrado em docs/equipamentos-tecnologia.md. Ao alterar a alquimia, manter ambos coerentes e executar build-equipment.py e build-alchemy.py; este último alinha a dose de Poção Restauradora em rules/character-rules (0,25 espaços, Saturação 1). Limiar 2+teto(CON/2), rejeição CON+Atletismo CD14+total, falha por excesso 1/2/3/4; nunca inventar Fortitude ou Concentração como Perícias. Purgador é uma tentativa entre descansos seguros, após sua própria Saturação/teste. alchemicalSaturation é opcional, validado e preservado; não descontar Vida/Karma automaticamente pela simples ultrapassagem do limiar. Cabeçalhos de seções não usam prefixos numéricos como 17 3; preserve títulos descritivos e pontuação, com Heading 1 nos capítulos, Heading 2/3 nas seções.

## Continuidade das rainhas

Consultar docs/CONTINUIDADE-DAS-COROAS.md antes de alterar passados, sucessões ou genealogias. Nosferato é a sexta rainha; Ganância serviu cerca de 800 anos à quarta e à quinta e foi expulso pela sexta antes de ingressar nos Pecados. Alucard nasceu depois da posse de Nosferato, recebeu Haimaton no nascimento e não presenciou a expulsão. As Asas da campanha do terceiro andar pertencem à Santa daquele período; não identificá-las automaticamente com a corte atual. O juramento de Isadora confirma a herdeira e não é coroação imediata. Não atribuir a Al-Aqwa a morte das soberanas atuais nem identificar suas vítimas com personagens de Valdária sem fonte. A nova sucessão de Aéria foi confirmada pelo autor: Al-Aqwa matou a antecessora de Sael, que assumiu pouco depois. Valac tem 77 anos de reinado; suas filhas não participaram do golpe da infância. Geometria do Amparo admite mãe e filha portadoras; Nemeton tem transferência exclusiva na coroação; Haimaton pertence a Alucard; Desespero não passa às filhas. Preservar todas as estatísticas e técnicas em revisões narrativas.

## Aéria

docs/corte-demi-humana-aeria.md é fonte; build-aeria.py chama compilador --aeria e integra ao Bestiário. Sael Aruven mantém 46 anos, Pugilista VII, atributos FOR/AGI/CON/INT/PRE/ESP 8/8/8/5/5/8, três Domínios 3, nove técnicas e Anábasis. Para a sucessão confirmada pelo autor, tomou a coroa aos 42 há quatro anos, após Al-Aqwa (16 então) matar a antecessora; não restaurar posse aos 27. Maelis 16, Tanque IV, única filha legítima; os outros filhos são somente mencionados. Tiamat é Bênção hereditária com portadores simultâneos; Combustão é subdobra de Fogo separada da bênção. Recuperados dos arquivos: Sael, Grão-Duque Darian Corvel (Miravéu) e Condessa Octavia Valeri (Ferravento); marquesados Talassar/Aster e baronato Nacar são expansões novas. Aéria possui /mundo/aeria e /corte-demi-humana, regiao=aeria na API/MCP e ornamentos sem retratos. Bestiário somente no site.

Criação de personagem: orçamento atual de 8 pontos-base de Perícia Comum; bônus de raça/classe separados, preservando as regras vigentes de progressão. Não restaurar o antigo orçamento 12. Prosa pública de Aéria não deve antecipar planos ou reviravoltas de Ferravento nem conter instruções como “Em cena”.

## Patch 1.10 — revisão de custos e leitura
O pedido de 25/10/2026 substitui os overrides anteriores da corte: Euphere é a única Pecado VI, SS, 150 Vida, CA 27 com armadura; todos os outros Pecados V, S, 120 Vida e CA 25. Gula compartilha Vida 120. Branca de Neve tem ficha completa e seis artes. Não restaurar antigas CAs 32/33, Vida 91/121/124/160 ou Etapa VII de Gula / VI de Maélia. data/court-balance.json é a base final, sem multiplicação posterior. Figuras nobres e régias com ranque definido, exceto duques e Caroline, usam Vida/CA exatas da tabela de chefes do ranque declarado; figuras civis continuam sem economia de chefe.
Todos os custos personalizados têm composição em data/technique-construction.json e nos manuscritos. Não restaurar preços antigos nos blocos. Reservas máximas de Karma de rainhas, princesas e duques preservadas. Bases ofensivas por Grau: 1d6/1d12/2d10/2d12/3d10; cura/escudo 1d4/1d8/2d6/2d10/3d10. Assinaturas régias têm dados distintos pela substituição de um dado pela arma (Cap.10): Naerith 2d10+1d8; Nosferato 2d10+1d12; Sael 2d10+1d6; Valac 3d10; Aveline reflete o original. Não empilhar dano integral da arma ou dados adicionais gratuitos.
SinCourtDossier usa CourtDossier; FalseSaintRepertoire continua preservado. RuleOrnament contém vetores do leitor, não assets de retrato. Os sete pactos de Geppeto são conhecidos, não sete presenças simultâneas: com Conjuração 2, quatro ativos, soma de Graus 8 e três comandos. Chamadas/funcionamento seguem Cap.15; custos das artes são pagos pelo invocador.

Pop-up de atualização: escrever exclusivamente para jogadores, com mudanças observáveis e regras que afetam o uso da ficha. Não mencionar implementação, APIs, MCP, testes, builds, arquivos consultados, pedidos do autor, exclusões editoriais ou limitações da hospedagem. Manter o histórico por versão, sem repetir estatísticas antigas que confundam o uso atual. Revisão editorial não cria uma atualização sobre a própria revisão.

Todas as fichas usam o disclosure “Composição do custo” (TechniqueCost / costDisclosureHtml) para explicações de Karma, inclusive Pecados, Falsa Santa, nobres e invocações. Preservar efeitos visíveis; não inventar decomposição a partir do custo total. Fichas de jogadores exibem o cálculo registrado, sinalizando quando ausente.

Ajuste posterior de 25/10: Euphere tem Vida máxima 180 (+20%) e Karma 126 (+100%), segunda fase com 90 Vida ou menos. Essa exceção substitui a Vida 150 anterior; preservar Etapa VI, ranque SS e CA 27.

Etapa e ranque de ameaça não são equivalentes obrigatórios: capítulos 4 e 18 os distinguem. Não converter automaticamente V→S ou VI→SS em fichas existentes. Cabeçalhos usam bestiaryClassification a partir da identidade canônica; badge Ameaça evita confusão com ranque institucional. Valentino é Tanque V.

Euphere: Coração de Plasma — Lança do Sol Negro foi removida e substituída por Nadir, assinatura IV de Bênção/Plasma/Karma, 15 Karma, Principal, centro 15 m/raio 2 m, 2 UM, 2d12 e contenção apenas em total, uma vez/cena. Manter Vida 180 e Karma 126.

Ajuste individual de Geppeto em 25/10: Vida 80, Karma 124 (40 transferidos da Vida), CA 23; parcial 11–23/total 24+. Máscara rompe aos 40 Vida ou três Âncoras. Preservar Etapa V/ameaça S e estatísticas próprias das invocações; esta exceção substitui Vida 120/Karma 84/CA 25.

Nidavellir: docs/republica-nidavellir.md, compilador --nidavellir, data/nidavellir.json; build-aeria integra ao Bestiário sob Aéria, sem inserir no livro Word. /mundo/aeria/nidavellir, API/MCP regiao=nidavellir. Cinco perfis (quatro Pugilistas VI SS e Eirik Inventor VI SS), 37 técnicas, quatro Domínios manifestados sem Superação nos reis, Técnica/Resistência no presidente. Dois Refinamentos de Eficiência por Domínio: 1 Karma, quatro rodadas; Essências de CA/movimento incluídas. Cópia não rouba fontes, assinaturas, Caminhos, Domínios ou treino alheio. Járn não cria ações ou segunda reserva de Vida. Ornamentos vetoriais únicos, sem retratos.

Eirik possui DUAS Bênçãos independentes: Magnetismo e Criação de Matéria Inorgânica (qualquer material inorgânico). Exibir dois cards próprios, com prosa descritiva; não restaurar o antigo bloco Ímã e Matriz com lista de proibições. Volume/duração/custos específicos ficam nas técnicas, não limitam o conceito geral da Bênção.

Eirik revisado: Etapa VI, ameaça A, Vida 100/CA23, Karma132; menor resistência direta dos cinco regentes. Nove artes IV substituem repertório antigo; Járn cria a matéria sem exigir sucata, compartilha Vida atual máxima100 e CA23, manutenção2, ataque mecânico1d12. Saira copia técnicas marciais E Karma puro dos oponentes, Canalização2; três espaços, custos originais e atributos próprios, sem roubar outras fontes/assinaturas/Domínios.

## Patch 1.13 — revisão de mesa em 28/10/2026

Revisão registrada em docs/AUDITORIA-2026-10-28.md. Porte canônico em data/size-rules.json e docs/porte.md: 70/130/210 cm, Grande −1 m, demais sem bônus de velocidade. build-size-rules.py recompõe só a seção do Capítulo 2. Sem buff de Perícia 0, mínimo de dano, alteração das CDs de risco ou dos recursos da Falsa Santa.

compile-region.py e data/compiler-regions.json atendem também --human; build-elven-gaeria.py é compatibilidade. build-gaeria.py monta continentes e civis usando a corte compilada. Identificadores data-item do equipamento apontam para data/equipment-mechanics.json; não inferir propriedades por nome. Divergência de carga interrompe build-equipment.

Bestiário tem seis seções: vinte ameaças de Etapas I–IV em data/early-threats.json, fontes compiladas em docs/ameacas-iniciais.md; build-early-threats.py roda após os compiladores regionais. Página /bestiario/ameacas, API/MCP regiao=ameacas. /mesa compara dois NPCs. Preserve estatísticas, estilos e limites canônicos dos nobres e Pecados.

/personagem aceita visitante, com rascunho local e recuperação explícita após login; APIs e nuvem continuam por proprietário. Recursos combat são opcionais, validados e persistidos. Domínios pagam só ativação, com refinamentos; contadores não executam dano, risco ou manutenção por conta própria. Novos retratos são miniaturas de até 512 px /64 mil caracteres; legado mantém limite anterior. npm test cobre testes atuais; regras históricas 1.2 ficam em test:legacy.

## Combate conectado em 28/10/2026

/mestre reúne combate, Forja, calculadoras e consulta /mesa. Tipos/constantes foram extraídos para lib/character-model.ts, reexportados por character-data.ts. Não reintroduzir dependência circular entre normalização e regras. combatState é canônico; combat permanece como espelho legado. Logs limitados a 25. API /api/combate/sync aceita ações dinâmicas pelo dono ou token habilitado, com CAS e reenvios idempotentes recentes; nunca abrir gravação completa por token. O link agora concede capacidade de combate e seus avisos devem ser explícitos. Fichas e recursos não são restaurados ao entrar/sair de combate.

Polling de 1,5 s visível/6 s em segundo plano, ETag e BroadcastChannel. Não prometer latência literal zero. Manter a Saturação CD14+total e Desvantagem canônica (−1d20, mínimo especial), as 35 perícias e a Forma sem Karma de ativação. Custos variáveis, defesa oposta e efeitos condicionais são confirmados, sem inferir resultado automático. Encontros e NPCs são locais ao navegador; jogadores vinculados persistem no D1. docs/COMBATE-CONECTADO.md documenta o contrato e os limites.


## Cinema de combate

lib/combat-visuals.ts e boss-phase-state.ts são a fonte dos avisos: dados reais, crítico no dado selecionado, fases idempotentes, sem reposição de recursos. Euphere 90/1, Geppeto 40 ou três Âncoras; Maélia metade da Vida só desbloqueia a forma, exige Controle 17, 13 Karma e 6 PC. Não inventar fase oficial da Falsa Santa. Fases/rolagens de NPCs chegam às fichas pelo endpoint como phase/spectacle, sem modificar a defesa do jogador. Som/vibração desligados por padrão, movimento reduzido por sistema ou botão. Manter tests/combat-visuals.test.mjs e os contratos de sincronização.


## Patch 1.14

As ameaças iniciais têm curva I/I/II/III/IV por região e dano básico 1d6/1d8/1d10/2d6. build-early-threats valida reservas e curva. skillsIn lê grupos de perícias sem inferir treino não declarado. Montante, Azagaia, Funda e Baioneta são armas por identificador. Descanso seguro preserva Carga/condições, restaura recursos e desbloqueia a Forma por ação validada. gm-encounter valida importações e biblioteca: não exportar tokens nem payload de jogadores; reconectar referências importadas recupera equipe/iniciativa sem alterar a ficha remota. Não transformar alarmes/terreno em ataques contra CA por conterem a palavra dano.
