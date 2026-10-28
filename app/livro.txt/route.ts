import { bookText, chapterText } from "@/lib/book-access";
import { getChapter } from "@/lib/rules";
export function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("capitulo");
  const chapter = slug ? getChapter(slug) : null;
  if (slug && !chapter) return new Response("Capítulo não encontrado.", { status: 404 });
  return new Response(chapter ? chapterText(chapter) : bookText(), { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=300" } });
}
