import { publicRoutes, SITE_ORIGIN } from "@/lib/public-navigation";
export function GET() {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${publicRoutes().map(path => `<url><loc>${(SITE_ORIGIN + path).replaceAll("&", "&amp;")}</loc></url>`).join("")}</urlset>`, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
