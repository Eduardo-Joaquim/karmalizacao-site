import { SiteHeader } from "@/components/site-header";
import { PATCH_NOTES } from "@/lib/patch-notes";

export const metadata = { title: "Atualizações de Karmalização" };

export default function UpdatesPage() {
  return (
    <div className="site-page">
      <SiteHeader />
      <main className="site-shell rule-content updates-page">
        <h1>Atualizações de Karmalização</h1>
        {PATCH_NOTES.map(patch => (
          <article key={patch.id} id={patch.id}>
            <h2>{patch.label}</h2>
            <h3>{patch.title}</h3>
            <ul>{patch.highlights.map(highlight => <li key={highlight}>{highlight}</li>)}</ul>
          </article>
        ))}
      </main>
    </div>
  );
}
