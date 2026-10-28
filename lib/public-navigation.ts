import { getChapterMetadata } from "@/lib/rules";
import court from "@/data/court-sheets.json";
const configuredOrigin = process.env.SITE_ORIGIN || process.env.NEXT_PUBLIC_SITE_ORIGIN || "https://karmalizacao-prototipo-edu.exactkoi4.chatgpt.site";
export const SITE_ORIGIN = new URL(configuredOrigin).origin;
export function publicRoutes() {
  return ["/mestre", "/mesa", "/bestiario/ameacas", "/api/bestiario?regiao=ameacas", "/mundo/aeria/nidavellir", "/api/bestiario?regiao=nidavellir", "/mundo/aeria", "/mundo/aeria/corte-demi-humana", "/api/bestiario?regiao=aeria", "/mundo/ignaria", "/mundo/ignaria/corte-demoniaca", "/mundo/ignaria/ghouls", "/mundo/ignaria/casa-lunaviel", "/api/bestiario?regiao=demonios", "/api/bestiario?regiao=ghouls", "/api/bestiario?regiao=lunaviel", "/", "/portal", "/regras", "/livro", "/livro.txt", "/mundo/gaeria", "/mundo/gaeria/reino-humano", "/mundo/gaeria/reino-elfico", "/mundo/ignaria/corte-vampirica", "/regras/21-bestiario?regiao=ignaria", "/api/bestiario?regiao=ignaria", "/regras/21-bestiario?regiao=gaeria", "/api/bestiario?regiao=elaranth", ...getChapterMetadata().map(c => `/regras/${c.slug}`),
    ...court.flatMap(c => [`/regras/21-bestiario?integrante=${c.slug}`, `/regras/21-bestiario?integrante=${c.slug}&leitura=historia`])];
}
