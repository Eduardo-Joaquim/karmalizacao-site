import { combatCatalog, earlyPresets } from "@/lib/combat-catalog";
export function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const id = params.get("id");
  if (id) {
    const entry = combatCatalog.find((entry) => entry.id === id);
    return entry
      ? Response.json(entry)
      : Response.json({ error: "Ficha não encontrada." }, { status: 404 });
  }
  return Response.json(params.has("presets") ? earlyPresets : combatCatalog, {
    headers: { "Cache-Control": "public, max-age=60" },
  });
}
