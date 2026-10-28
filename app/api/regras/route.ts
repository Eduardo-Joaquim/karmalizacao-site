import { getChapter, getChapterMetadata } from "@/lib/rules";
import court from "@/data/court-sheets.json";
export function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const slug = params.get("capitulo");
  if (slug) {
    const chapter = getChapter(slug);
    return chapter ? Response.json(chapter) : Response.json({ error: "Capítulo não encontrado." }, { status: 404 });
  }
  return Response.json({ chapters: getChapterMetadata().map(c => ({ ...c, url: `/regras/${c.slug}`, json: `/api/regras?capitulo=${c.slug}` })), bestiary: court.map(c => ({ name: c.name, sin: c.sin, slug: c.slug, url: `/regras/21-bestiario?integrante=${c.slug}`, json: `/api/bestiario?integrante=${c.slug}` })) });
}
