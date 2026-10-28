export type PatchNote = {
  id: string;
  version?: string;
  title: string;
  label: string;
  highlights: readonly string[];
};

// Mais recente primeiro. Não inventar datas ou versões para registros históricos.
export const PATCH_NOTES: readonly PatchNote[] = [
 {id:"patch-1.13-2026-10-28-combate-r2",version:"1.13",title:"Ferramentas de mesa e combate conectado",label:"Patch 1.13 · 28/10/2026",highlights:["A Página do Mestre reúne encontros com jogadores vinculados, fichas oficiais e criaturas criadas na Forja de Ameaças.","Modo Combate na barra inferior da ficha: recursos interativos, perícias, habilidades, Domínios, arsenal e registro de ações.","O link compartilhado agora permite ajustar recursos e condições de combate. Envie-o somente a quem pode conduzir a sessão; renovar ou desativar o link encerra esse acesso. A criação da ficha continua restrita ao dono.","Dano, cura, Karma e ações são sincronizados entre Mestre e jogador. Custos variáveis e efeitos condicionais pedem confirmação; os testes de risco continuam na mesa.","O Mestre pode resolver ataques contra CA, aplicar o dano ao alvo e acompanhar os limiares de fase dos chefes.","Textos pequenos, rótulos e notas das fichas foram ampliados para facilitar a leitura.","A criação de personagem pode ser experimentada sem login. O rascunho fica no navegador, pode ser exportado e recuperado depois de entrar na conta; nuvem e compartilhamento exigem login.","A ficha ganhou um painel de combate com Vida, Karma, escudo, Cargas, rolagens, pagamento de custos simples e contagem de rodadas dos Domínios. Ações e testes de risco continuam sendo resolvidos na mesa.","Os dossiês abrem com resumo e permitem alternar entre técnicas, Domínios e história. A Mesa do Mestre mantém duas fichas abertas lado a lado.","O Teatro de Geppeto ganhou uma tabela de consulta das sete marionetes, preservando os limites de peças ativas e comandos.","Vinte monstros e ameaças de Etapas I a IV foram adicionados: Gaéria, Ignária, Aéria e os andares iniciais da Torre.","O porte Médio agora vai de 130 a menos de 210 cm. Grande começa em 210 cm e reduz somente 1 m de Movimento; os portes menores não recebem velocidade gratuita. Confira o porte de fichas com altura registrada antes da próxima sessão.","Renomear itens mantém suas propriedades mecânicas. Novos retratos são reduzidos a miniaturas mais leves; imagens antigas continuam disponíveis."]},
 {id:"patch-1.12-2026-10-27-dominios-r4",version:"1.12",title:"Regentes e Domínios Manifestados",label:"Patch 1.12 · 27/10/2026",highlights:["Os Domínios Manifestados agora têm cards individuais nas fichas de seus portadores, com ativação, custo, duração, efeitos e Essências separados para consulta.","A ficha de Eirik apresenta separadamente suas duas Bênçãos: Magnetismo e Criação de Matéria Inorgânica.","O repertório de Eirik foi reconstruído: circuitos magnéticos, fabricação de peças, condensação defensiva, ignição programada e o robô Járn, agora montado com matéria criada por ele.","Eirik tem Vida 100 e CA 23: é o mais frágil dos cinco regentes, com ameaça A e Etapa VI. Sua força depende de engenharia e posicionamento.","Os cinco regentes de Nidavellir receberam descrições de execução separadas dos efeitos de jogo e assinaturas revisadas.","Saira agora pode registrar técnicas marciais e de Karma puro dos oponentes. Palimpsesto consome uma das duas memórias exigidas, preservando a outra para uso posterior.","Meio-Dia passa a ser um golpe imediato de compromisso total, com projeção, distinguindo-se da interdição de passagem de Haldor."]},
 {id:"patch-1.11-2026-10-26-nidavellir-r2",version:"1.11",title:"Nidavellir e os quatro reis",label:"Patch 1.11 · 26/10/2026",highlights:["Nidavellir chega ao Bestiário de Aéria: uma república industrial com presidente eleito e quatro governantes municipais conhecidos como reis.","Oren, Haldor, Saira e Idris possuem fichas completas, seis técnicas e uma assinatura cada, com estilos marciais próprios.","Os quatro reis manifestam Força, Velocidade, Resistência e Técnica. As fichas explicam custos, duração, Refinamentos e efeitos nas rolagens.","Saira registra até três técnicas marciais observadas; cada execução paga seu custo e preserva os limites da própria combatente.","Eirik Malm combina Vapor, Combustão, invenções e duas Bênçãos. Járn monta um robô pilotado de sete metros, com ações e recursos compartilhados.","Todos os novos cards permitem consultar a composição dos custos de Karma.","A ficha do Prefeito-Geral Eirik Malm aparece antes dos quatro reis, também no índice de navegação."]},
  {
    "id": "patch-1.10-2026-10-25-qol-r9",
    "title": "Leitura e fichas renovadas",
    "label": "Patch 1.10 · 25/10/2026",
    "highlights": [
      "O livro ganhou desenhos ornamentais, tabelas mais legíveis e melhor espaçamento entre as seções.",
      "As fichas dos Pecados agora seguem a organização das cortes, com atributos, perícias e habilidades mais fáceis de consultar.",
      "Euphere é a única Pecado da Etapa VI. Agora possui 180 de Vida e 126 de Karma; sua segunda fase começa com 90 de Vida ou menos. Os demais Pecados são da Etapa V.",
      "Vida e CA dos nobres e das figuras régias foram ajustadas ao ranque. Duques e Caroline Lunaviel mantêm seus valores próprios.",
      "Os custos de Karma das técnicas foram revisados em todas as cortes, incluindo Pecados, invocações e Falsa Santa. Consulte os novos valores antes de usar cada habilidade.",
      "O dano das rainhas foi ajustado ao Grau das técnicas, e suas assinaturas receberam combinações de dados distintas.",
      "O Karma máximo de rainhas, princesas e duques permanece igual.",
      "Geppeto passa a ter 80 de Vida, 124 de Karma e CA 23. Sua máscara se rompe com 40 de Vida ou três Âncoras desligadas.",
      "Euphere substitui Coração de Plasma por Nadir: assinatura de Grau IV que combina Armadura Viva, plasma e Karma, custa 15 Karma, requer a armadura ativa e ocupa 2 UM temporariamente, sem consumi-las. Pode conter inimigos na descarga uma vez por cena.",
      "As fichas distinguem Etapa de progressão e ranque de ameaça. Valentino Lunaviel passa a ter sua Etapa V explicitada.",
      "Corrigidos os botões de composição do custo que faltavam em habilidades dos Pecados, da Falsa Santa e em consumíveis. A explicação pode ser aberta nas fichas de todas as cortes e invocações. Nas fichas dos jogadores, o botão mostra o cálculo registrado da técnica."
    ],
    "version": "1.10"
  },
  {
    "id": "patch-1.9-2026-10-24-r9",
    "title": "Arsenal, inventário e casas nobres",
    "label": "Patch 1.9 · 24/10/2026",
    "highlights": [
      "A criação de personagem passa a conceder 8 pontos comuns de perícia. Bônus de raça, classe e origem são recebidos separadamente.",
      "Equipamentos e tecnologia receberam catálogos ampliados de armas, armaduras, focos, munições, explosivos, veículos e ferramentas, com preços e carga.",
      "O inventário permite adicionar, editar, equipar e remover itens. A carga é somada automaticamente, com avisos de sobrecarga e seus efeitos na defesa e no movimento.",
      "A busca de itens mostra resultados enquanto você digita, em ordem alfabética, com preço e carga ao lado de cada nome.",
      "Alquimia adicionada ao Capítulo 17, com criação de poções, novos consumíveis e Saturação. A ficha mostra a Saturação atual e o limite do personagem.",
      "Transformação Corrompida adicionada ao Capítulo 14, com mutações à escolha, custos, manutenção e consequências ligadas à Ruptura.",
      "Aéria e novas cortes de Ignária entram no Bestiário, com governantes, herdeiras e casas nobres. As casas aparecem em ordem de título.",
      "A família Lunaviel recebeu fichas revisadas: Caroline luta com duas espadas e o Estilo da Espada da Lua; Alaric Voss é seu mordomo pugilista.",
      "Histórias e sucessões das rainhas foram revisadas para corrigir contradições."
    ],
    "version": "1.9"
  },
  {
    "id": "patch-1.8-2026-10-22-r12",
    "title": "As cortes de Gaéria e Ignária",
    "label": "Patch 1.8 · 22/10/2026",
    "highlights": [
      "Sárkora e a Corte Vampírica Haimaton entram no Bestiário, com Nosferato, Alucard, Sávia Vita e quatro casas nobres.",
      "Nosferato recebeu técnicas de Água, Sangue, Karma e combate com lança. Alucard passou a ter habilidades voltadas a preparação, ocultação e alvos isolados.",
      "Elaranth foi adicionada a Gaéria, com Naerith, Ilyra, Thaerion e Caelen. Os títulos das casas e seus vínculos foram revisados.",
      "As páginas das cortes ganharam índice de personagens e botão para voltar ao Bestiário.",
      "Perícias e habilidades receberam cartões mais claros, com custos e efeitos separados.",
      "A Falsa Santa não pode usar técnicas corruptas para beneficiar a si mesma. Adão — Primeiro Sopro é sua única autocura, uma vez por cena.",
      "Nosferato e Aveline dispõem de duas Reações por rodada; Naerith e a Falsa Santa, três. Cada resolução aceita apenas uma defesa."
    ],
    "version": "1.8"
  },
  {
    "id": "patch-1.7-2026-10-21-r1",
    "title": "A Prorrogadora da Extinção",
    "label": "Patch 1.7 · 21/10/2026",
    "highlights": [
      "A Falsa Santa entra no Bestiário com história, atributos e ficha de combate completa.",
      "Fios da Providência Usurpada reúne habilidades de reconstrução, proteção e ataque. As sete trombetas do Julgamento têm efeitos próprios.",
      "Frankenstein e Dia do Julgamento Final compartilham um único ápice por cena: usar uma assinatura impede utilizar a outra naquela cena."
    ],
    "version": "1.7"
  },
  {
    "id": "patch-1.6-2026-10-20-r6",
    "title": "Gaéria, pesquisa e criação de fichas",
    "label": "Patch 1.6 · 20/10/2026",
    "highlights": [
      "Valdária foi adicionada ao Bestiário, com Aveline, Isadora, Brígida, Tomás e as casas Ferromonte, Vesperal e Cedro Novo.",
      "Gaéria ganhou uma página com acesso às cortes, organizações e casas nobres.",
      "As fichas da Corte Humana receberam painéis de atributos, recursos e habilidades.",
      "O livro completo pode ser lido em uma única página ou em texto simples. Também é possível abrir cada capítulo separadamente.",
      "Livro, Bestiário e pesquisa de regras podem ser consultados sem entrar na conta. Salvar personagens exige login."
    ],
    "version": "1.6"
  },
  {
    "id": "patch-1.5-2026-10-18-r2",
    "title": "Bestiário e Corte da Falsa Santa",
    "label": "Patch 1.5 · 18/10/2026",
    "highlights": [
      "O Bestiário entra no livro, organizado por continentes e cortes.",
      "A Corte da Falsa Santa reúne Euphere, João e Maria, Geppeto, o Colecionador de Vidas, Nemetor, Branca de Neve e Maélia Veyr.",
      "As fichas permitem alternar entre história e combate, com atributos, recursos, habilidades e fases organizados para consulta.",
      "As sete invocações de Geppeto receberam fichas próprias. Seus usos são pagos com o Karma do invocador.",
      "A criação de personagem ganhou acesso rápido às cinco etapas, sem precisar voltar ao topo da página."
    ],
    "version": "1.5"
  },
  {
    "id": "prototipo-2026-10-17",
    "title": "O novo protótipo",
    "label": "Livro · 17/10/2026",
    "highlights": [
      "O livro passa a reunir 20 capítulos de regras.",
      "Raças, classes, habilidades e progressão foram revisadas.",
      "Perícias usam três níveis de treinamento: +2, +5 e +10. Atributo 0 usa 1d20 −4.",
      "Memória de uma Única Obra suspende pontos até o cumprimento do compromisso registrado, sem mudar permanentemente o nível da perícia."
    ]
  },
  {
    "id": "1.4",
    "title": "Poder com proporção",
    "label": "Patch 1.4",
    "highlights": [
      "Invocações passam a ter um Atributo principal e um secundário; os outros quatro ficam no nível 1.",
      "O Atributo principal varia conforme o Grau: 3, 5, 7, 9 ou 12.",
      "As fichas de invocação acompanham essa progressão."
    ]
  },
  {
    "id": "1.3",
    "title": "Pactos que ganham forma",
    "label": "Patch 1.3",
    "highlights": [
      "Votos receberam um roteiro de criação, com benefícios e sacrifícios definidos.",
      "A criação de Invocações ganhou uma seção própria na ficha.",
      "Personagens e Invocações podem ter imagens próprias.",
      "É possível compartilhar uma ficha por um link de leitura. O proprietário pode desativar ou trocar esse link."
    ]
  },
  {
    "id": "1.2",
    "title": "Escolhas que deixam marcas",
    "label": "Patch 1.2",
    "highlights": [
      "A ficha final mostra apenas os poderes e campos preenchidos.",
      "Intelecto pode reger perícias mentais e abordagens sociais racionais.",
      "Conjuração Vincular, Comunhão Divina e Controle da Corrupção usam Presença.",
      "Votos receberam restrições e consequências mais claras."
    ]
  },
  {
    "id": "anterior-pericias",
    "title": "Treinamento com limites claros",
    "label": "Anterior · Perícias",
    "highlights": [
      "A distribuição inicial e os limites de treinamento das perícias foram revisados."
    ]
  },
  {
    "id": "anterior-ficha",
    "title": "Uma jornada em cinco etapas",
    "label": "Anterior · Fichas",
    "highlights": [
      "A criação de personagem foi organizada em cinco etapas.",
      "A ficha passou a reunir bônus de raça, classe e progressão, além de poderes e inventário.",
      "Personagens podem ser salvos e consultados na própria conta."
    ]
  }
];

export const LATEST_PATCH = PATCH_NOTES[0];

export function getPatchVersion(patch: PatchNote): string | null {
  return patch.version ?? (/^\d+\.\d+$/.test(patch.id) ? patch.id : null);
}

export function shouldShowPatch(dismissedId: string | null): boolean {
  return dismissedId !== LATEST_PATCH.id;
}
