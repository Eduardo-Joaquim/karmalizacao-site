import nidavellir from "@/data/nidavellir.json";
import aeria from "@/data/demi-aeria.json";
import demons from "@/data/demon-ignaria.json";
import ghouls from "@/data/ghoul-ignaria.json";
import lunaviel from "@/data/lunaviel-ignaria.json";
import { z } from "zod";
import { GET as listCharacters, POST as saveCharacter } from "@/app/api/personagens/route";
import { GET as searchRules } from "@/app/api/regras/busca/route";
import { getAllChapters, getChapterMetadata, getChapter } from "@/lib/rules";
import { createBlankCharacter, ORIGINS, RACES, CLASSES, PATHS, STAGES, ATTRIBUTES, ALL_SKILLS } from "@/lib/character-data";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import gaeria from "@/data/gaeria.json";
import elven from "@/data/elven-gaeria.json";
import vampires from "@/data/vampire-ignaria.json";
import court from "@/data/court-sheets.json";
export const dynamic = "force-dynamic";
const empty = z.object({}).strict();
const schemas = {
  listar_capitulos: empty,
  ler_capitulo: z.object({ slug: z.string().min(1).max(120) }).strict(),
  pesquisar_regras: z.object({ texto: z.string().min(2).max(80) }).strict(),
  ler_bestiario: z.object({ integrante: z.string().max(120).optional(), regiao: z.enum(["gaeria", "elaranth", "ignaria", "demonios", "ghouls", "lunaviel", "aeria", "nidavellir", "cortes"]).optional() }).strict(),
  modelo_ficha: empty,
  criar_ficha: z.object({ nome: z.string().trim().min(1).max(80), payload: z.record(z.unknown()).optional() }).strict(),
  listar_fichas: empty,
};
const definitions = [
  ["listar_capitulos", "Lista os capítulos públicos e seus links.", {}],
  ["ler_capitulo", "Lê o texto completo e as seções de um capítulo público.", { slug: { type: "string" } }],
  ["pesquisar_regras", "Pesquisa as regras e o Bestiário por texto.", { texto: { type: "string", minLength: 2, maxLength: 80 } }],
  ["ler_bestiario", "Lê História e Ficha de Combate, incluindo invocações. Use regiao gaeria para Valdária, elaranth para o Reino Élfico, ignaria para a Corte Vampírica, demonios para Aqueronte, ghouls para os pretendentes, aeria para a corte demi-humana, lunaviel para a casa marquesal ou omita integrante e regiao para listar a Corte da Falsa Santa.", { integrante: { type: "string" }, regiao: { type: "string", enum: ["gaeria", "elaranth", "ignaria", "demonios", "ghouls", "lunaviel", "aeria", "nidavellir", "cortes"] } }],
  ["modelo_ficha", "Obtém o modelo completo de rascunho e opções. Consulte antes de criar uma ficha.", {}],
  ["criar_ficha", "Cria e salva uma NOVA ficha na conta autenticada. Não altera fichas existentes. Campos omitidos usam o modelo de rascunho; não implica conclusão das escolhas do jogador. Requer nome; payload contém campos do modelo_ficha. Não publique fichas sem pedido do jogador.", { nome: { type: "string", minLength: 1, maxLength: 80 }, payload: { type: "object", additionalProperties: true } }],
  ["listar_fichas", "Lista somente as fichas da conta autenticada.", {}],
] as const;
const required: Record<string, string[]> = { ler_capitulo: ["slug"], pesquisar_regras: ["texto"], criar_ficha: ["nome"] };
export const tools = definitions.map(([name, description, properties]) => ({ name, description,
  inputSchema: { type: "object", properties, required: required[name] ?? [], additionalProperties: false },
  annotations: { readOnlyHint: name !== "criar_ficha", destructiveHint: false, idempotentHint: name !== "criar_ficha", openWorldHint: false },
}));
function content(data: unknown, isError = false) { return { content: [{ type: "text", text: JSON.stringify(data) }], ...(isError ? { isError: true } : {}) }; }
export async function callTool(name: string, args: unknown, request: Request) {
  if (!Object.hasOwn(schemas, name)) return content({ error: "Ferramenta desconhecida." }, true);
  const parsed = schemas[name as keyof typeof schemas].safeParse(args ?? {});
  if (!parsed.success) return content({ error: "Argumentos inválidos.", issues: parsed.error.issues }, true);
  const input = parsed.data as Record<string, unknown>;
  if (name === "listar_capitulos") return content(getChapterMetadata().map(c => ({ ...c, url: `/regras/${c.slug}` })));
  if (name === "ler_capitulo") { const chapter = getChapter(input.slug as string); return content(chapter ?? { error: "Capítulo não encontrado." }, !chapter); }
  if (name === "pesquisar_regras") { const response = await searchRules(new Request(new URL(`/api/regras/busca?q=${encodeURIComponent(input.texto as string)}`, request.url))); return content(await response.json(), !response.ok); }
  if (name === "ler_bestiario") { if (input.regiao === "gaeria") return content(gaeria); if (input.regiao === "elaranth") return content(elven); if (input.regiao === "ignaria") return content(vampires); if(input.regiao === "demonios") return content(demons); if(input.regiao === "ghouls") return content(ghouls); if(input.regiao === "lunaviel") return content(lunaviel); if(input.regiao === "nidavellir") return content(nidavellir); if(input.regiao === "aeria") return content(aeria); const entry = input.integrante ? court.find(c => c.slug === input.integrante) : court; return content(entry ?? { error: "Integrante não encontrado." }, !entry); }
  if (name === "modelo_ficha") return content({ payload: createBlankCharacter(), options: { origins: ORIGINS, races: RACES, classes: CLASSES, paths: PATHS, stages: STAGES, attributes: ATTRIBUTES, skills: ALL_SKILLS }, chapters: getAllChapters().filter(c => /cria|personag/.test(c.slug)).map(c => c.slug), instructions: "Use criar_ficha com nome e os campos desejados em payload. Objetos e listas fornecidos substituem o campo completo do modelo. O servidor valida dados e votos. Escolhas vazias representam rascunho. A ficha fica privada na conta autenticada." });
  if (!(await getChatGPTUser())) return content({ error: "Autenticação necessária. Conecte o plugin do Site à sua conta." }, true);
  if (name === "listar_fichas") { const response = await listCharacters(new Request(new URL("/api/personagens", request.url))); return content(await response.json(), !response.ok); }
  const id = crypto.randomUUID();
  const payload = { ...createBlankCharacter(), ...(input.payload as object ?? {}), name: input.nome, sharing: { enabled: false, token: "" } };
  const response = await saveCharacter(new Request(new URL("/api/personagens", request.url), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, name: input.nome, payload }) }));
  const result = await response.json() as Record<string, unknown>;
  return content(response.ok ? { ...result, editorUrl: "/personagem", createdId: id } : result, !response.ok);
}
export async function POST(request: Request) {
  let rpc: Record<string, unknown>;
  try { rpc = await request.json(); } catch { return Response.json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Invalid JSON" } }, { status: 400 }); }
  if (!rpc || typeof rpc !== "object" || Array.isArray(rpc) || rpc.jsonrpc !== "2.0" || typeof rpc.method !== "string") return Response.json({ jsonrpc: "2.0", id: null, error: { code: -32600, message: "Invalid Request" } }, { status: 400 });
  const id = typeof rpc.id === "string" || typeof rpc.id === "number" ? rpc.id : null;
  const reply = (result: unknown) => Response.json({ jsonrpc: "2.0", id, result });
  if (rpc.method === "server/discover") return reply({ supportedVersions: ["2026-07-28"], capabilities: { tools: {} }, serverInfo: { name: "karmalizacao", version: "1.6" } });
  if (rpc.method === "tools/list") return reply({ tools });
  if (rpc.method !== "tools/call") return Response.json({ jsonrpc: "2.0", id, error: { code: -32601, message: "Method not found" } });
  const params = rpc.params as { name?: unknown; arguments?: unknown } | null;
  if (!params || typeof params.name !== "string") return Response.json({ jsonrpc: "2.0", id, error: { code: -32602, message: "Invalid params" } });
  try { return reply(await callTool(params.name, params.arguments, request)); }
  catch { return reply(content({ error: "Não foi possível concluir a operação." }, true)); }
}
