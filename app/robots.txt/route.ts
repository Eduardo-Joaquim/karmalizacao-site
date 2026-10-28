import { SITE_ORIGIN } from "@/lib/public-navigation";
export function GET() {
  return new Response(`User-agent: *
Allow: /
Disallow: /personagem
Disallow: /ficha/
Disallow: /api/personagens
Sitemap: ${SITE_ORIGIN}/sitemap.xml
`, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
