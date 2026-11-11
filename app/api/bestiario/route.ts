import court from "@/data/court-sheets.json";
import aeria from "@/data/demi-aeria.json";
import demons from "@/data/demon-ignaria.json";
import threats from "@/data/early-threats.json";
import elven from "@/data/elven-gaeria.json";
import gaeria from "@/data/gaeria.json";
import ghouls from "@/data/ghoul-ignaria.json";
import lunaviel from "@/data/lunaviel-ignaria.json";
import nidavellir from "@/data/nidavellir.json";
import thalassia from "@/data/thalassia.json";
import vampires from "@/data/vampire-ignaria.json";
export function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const region = params.get("regiao");
  if (
    region &&
    ![
      "ameacas",
      "ignaria",
      "sarkora",
      "gaeria",
      "elaranth",
      "demonios",
      "ghouls",
      "lunaviel",
      "aeria",
      "nidavellir",
      "thalassia",
      "cortes",
    ].includes(region)
  )
    return Response.json({ error: "Região inválida." }, { status: 400 });
  if (params.get("regiao") === "ameacas")
    return Response.json({
      threats: threats.filter(
        (t) => !params.get("area") || t.region === params.get("area"),
      ),
    });
  if (["ignaria", "sarkora"].includes(params.get("regiao") ?? ""))
    return Response.json(vampires);
  if (params.get("regiao") === "gaeria") return Response.json(gaeria);
  if (params.get("regiao") === "elaranth") return Response.json(elven);
  const additions: Record<string, unknown> = {
    demonios: demons,
    ghouls,
    lunaviel,
    aeria,
    nidavellir,
    thalassia,
  };
  if (params.get("regiao") && additions[params.get("regiao")!])
    return Response.json(additions[params.get("regiao")!]);
  const slug = params.get("integrante");
  if (!slug) return Response.json({ members: court });
  const entry = court.find((c) => c.slug === slug);
  return entry
    ? Response.json(entry)
    : Response.json({ error: "Integrante não encontrado." }, { status: 404 });
}
