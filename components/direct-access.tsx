import { absoluteUrl, directLinks } from "@/lib/book-access";
import { getChapterMetadata } from "@/lib/rules";
export function DirectAccess() {
  return <section className="site-shell direct-access" aria-labelledby="direct-access-title">
    <p className="section-label">O arquivo ao seu alcance</p><h2 id="direct-access-title">Acesso direto ao livro</h2>
    <p>Leia todos os capítulos em uma única página ou abra um endereço específico. O conteúdo público já está disponível na resposta da página, sem precisar ativar botões.</p>
    <nav aria-label="Endereços completos de acesso" className="direct-access-grid">
      {directLinks.map(link => <a key={link.path} href={absoluteUrl(link.path)}><strong>{link.title}</strong><span>{absoluteUrl(link.path)}</span></a>)}
    </nav>
    <details><summary>Endereços dos 21 capítulos</summary><nav aria-label="Links completos dos capítulos" className="direct-access-grid">{getChapterMetadata().map(c => <a key={c.slug} href={absoluteUrl(`/regras/${c.slug}`)}><strong>{c.number} · {c.shortTitle}</strong><span>{absoluteUrl(`/regras/${c.slug}`)}</span></a>)}</nav></details>
  </section>;
}
