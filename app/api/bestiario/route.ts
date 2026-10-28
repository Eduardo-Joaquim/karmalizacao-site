import nidavellir from "@/data/nidavellir.json";
import aeria from "@/data/demi-aeria.json";
import demons from "@/data/demon-ignaria.json";
import ghouls from "@/data/ghoul-ignaria.json";
import lunaviel from "@/data/lunaviel-ignaria.json";
import gaeria from "@/data/gaeria.json";
import elven from "@/data/elven-gaeria.json";
import vampires from "@/data/vampire-ignaria.json";
import court from "@/data/court-sheets.json";
export function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  if (["ignaria", "sarkora"].includes(params.get("regiao") ?? "")) return Response.json(vampires);
  if (params.get("regiao") === "gaeria") return Response.json(gaeria);
  if (params.get("regiao") === "elaranth") return Response.json(elven);
  const additions:Record<string,unknown>={demonios:demons,ghouls,lunaviel,aeria,nidavellir};
  if (params.get("regiao") && additions[params.get("regiao")!]) return Response.json(additions[params.get("regiao")!]);
  const slug = params.get("integrante");
  if (!slug) return Response.json({ members: court });
  const entry = court.find(c => c.slug === slug);
  return entry ? Response.json(entry) : Response.json({ error: "Integrante não encontrado." }, { status: 404 });
}
