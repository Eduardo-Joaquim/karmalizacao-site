import { MarkdownArticle } from "@/components/markdown-article";
import world from "@/data/world-politics.json";
import Link from "next/link";
export const metadata = {
  title: "Povos e soberanias · Karmalização",
  description:
    "Os quatro continentes, nove raças, sucessões reais, Nidavellir e a jurisdição da Torre.",
};
export default function Page() {
  return (
    <main className="site-shell rule-article">
      <nav className="rule-breadcrumb">
        <Link href="/regras/21-bestiario">Voltar ao Bestiário</Link>
        <Link href="/mundo/thalassia">Thalassia</Link>
      </nav>
      <MarkdownArticle html={world.html} chapter={21} />
    </main>
  );
}
