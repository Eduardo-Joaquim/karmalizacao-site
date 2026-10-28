import { SITE_ORIGIN } from "@/lib/public-navigation";
export function GET() {
  return new Response(`# Karmalização

Livro de RPG público. Consultas não exigem login. Use somente os valores publicados; não invente estatísticas ausentes.

- Livro inteiro, sem navegação interativa: ${SITE_ORIGIN}/livro
- Livro inteiro em texto simples: ${SITE_ORIGIN}/livro.txt
- Um capítulo em texto simples: ${SITE_ORIGIN}/livro.txt?capitulo={slug}
- Índice de capítulos e integrantes: ${SITE_ORIGIN}/api/regras
- Capítulo completo: /api/regras?capitulo={slug}
- Pesquisa: /api/regras/busca?q={texto}
- Reino Humano de Gaéria: ${SITE_ORIGIN}/mundo/gaeria/reino-humano
- Reino em JSON: ${SITE_ORIGIN}/api/bestiario?regiao=gaeria
- Reino Élfico de Gaéria: ${SITE_ORIGIN}/mundo/gaeria/reino-elfico
- Elaranth em JSON: ${SITE_ORIGIN}/api/bestiario?regiao=elaranth
- Corte Vampírica de Ignária: ${SITE_ORIGIN}/mundo/ignaria/corte-vampirica
- Sárkora em JSON: ${SITE_ORIGIN}/api/bestiario?regiao=ignaria
- Corte Demoníaca de Ignária: ${SITE_ORIGIN}/mundo/ignaria/corte-demoniaca
- Aqueronte em JSON: ${SITE_ORIGIN}/api/bestiario?regiao=demonios
- Pretendentes ghouls: ${SITE_ORIGIN}/mundo/ignaria/ghouls
- Ghouls em JSON: ${SITE_ORIGIN}/api/bestiario?regiao=ghouls
- Casa Marquesal Lunaviel: ${SITE_ORIGIN}/mundo/ignaria/casa-lunaviel
- Lunaviel em JSON: ${SITE_ORIGIN}/api/bestiario?regiao=lunaviel
- Corte da Falsa Santa: /api/bestiario
- Integrante: /api/bestiario?integrante={slug}
- Página de combate: /regras/21-bestiario?integrante={slug}
- História: /regras/21-bestiario?integrante={slug}&leitura=historia
- Mapa público: /sitemap.xml

## Fichas e conexão de agentes

O servidor MCP está em ${SITE_ORIGIN}/mcp. Conecte o plugin do Site pelo ChatGPT/Codex com autenticação da plataforma. Ferramentas: listar_capitulos, ler_capitulo, pesquisar_regras, ler_bestiario, modelo_ficha, criar_ficha, listar_fichas.

Consulte modelo_ficha para receber o modelo completo e opções de criação. criar_ficha recebe nome e payload (campos do modelo); salva uma ficha nova na conta autenticada e retorna id e link do editor. A ficha pode ser um rascunho; confira as regras antes de usá-la em jogo. listar_fichas lê somente as fichas da conta autenticada. Sem identidade, criar e listar retornam erro de autenticação. Nunca envie identidade em argumentos ou tente acessar registros de outras contas.

No navegador autenticado, GET/POST /api/personagens usa a mesma validação e autorização. POST exige {id, name, payload}; id é UUID novo, payload segue o modelo. Fichas pessoais e links compartilhados não pertencem ao mapa de indexação pública.
`, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
