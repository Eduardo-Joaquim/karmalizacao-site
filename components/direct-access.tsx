import {
  absoluteUrl,
  directLinkGroups,
  type DirectLink,
} from "@/lib/book-access";
import { getChapterMetadata } from "@/lib/rules";

function LinkGrid({
  links,
  label,
}: {
  links: readonly DirectLink[];
  label: string;
}) {
  return (
    <nav aria-label={label} className="direct-access-grid">
      {links.map((link) => (
        <a key={link.path} href={absoluteUrl(link.path)}>
          <strong>{link.title}</strong>
          {link.description && <small>{link.description}</small>}
          <span>{absoluteUrl(link.path)}</span>
        </a>
      ))}
    </nav>
  );
}

export function DirectAccess() {
  const chapters = getChapterMetadata();
  return (
    <section
      className="site-shell direct-access"
      aria-labelledby="direct-access-title"
    >
      <p className="section-label">O arquivo ao seu alcance</p>
      <h2 id="direct-access-title">Acesso direto ao livro</h2>
      <p>
        Leia o livro completo, encontre um capítulo ou consulte os continentes e
        suas cortes. Os endereços abaixo levam diretamente ao conteúdo.
      </p>
      {directLinkGroups.map((group) =>
        group.collapsible ? (
          <details key={group.id} className="direct-access-group">
            <summary>{group.title}</summary>
            <LinkGrid links={group.links} label={group.title} />
          </details>
        ) : (
          <section
            key={group.id}
            className="direct-access-group"
            aria-labelledby={`direct-access-${group.id}`}
          >
            <h3 id={`direct-access-${group.id}`}>{group.title}</h3>
            <LinkGrid links={group.links} label={group.title} />
          </section>
        ),
      )}
      <details>
        <summary>Endereços dos {chapters.length} capítulos</summary>
        <nav
          aria-label="Links completos dos capítulos"
          className="direct-access-grid"
        >
          {chapters.map((c) => (
            <a key={c.slug} href={absoluteUrl(`/regras/${c.slug}`)}>
              <strong>
                {c.number} - {c.shortTitle}
              </strong>
              <span>{absoluteUrl(`/regras/${c.slug}`)}</span>
            </a>
          ))}
        </nav>
      </details>
    </section>
  );
}
