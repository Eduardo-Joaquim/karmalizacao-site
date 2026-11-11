import { WorldBlessingCard } from "@/components/world-blessing-card";
import { deities } from "@/lib/divine-blessings";
import { Gem, Orbit, Sparkles, Swords } from "lucide-react";
type Field = { label: string; html: string };
export function NobleTraitCards({ facts }: { facts: { fields: Field[] }[] }) {
  return (
    <div className="noble-trait-grid">
      {facts
        .flatMap((fact) => {
          const groups: { fields: Field[] }[] = [];
          let current: Field[] = [];
          for (const field of fact.fields) {
            if (
              /domínio|bênção|benção|^armas?$|^estilo|^arsenal/i.test(
                field.label,
              ) &&
              current.length
            ) {
              groups.push({ fields: current });
              current = [];
            }
            current.push(field);
          }
          if (current.length) groups.push({ fields: current });
          return groups;
        })
        .map((fact, i) => {
          const worldId = fact.fields
            .map((f) => f.html)
            .join(" ")
            .match(/data-world-blessing=["']([^"']+)["']/)?.[1];
          if (worldId)
            return (
              <WorldBlessingCard id={worldId} key={worldId}>
                {fact.fields.map((f, j) => (
                  <div key={j}>
                    {j > 0 && f.label && <b>{f.label}</b>}
                    <div
                      dangerouslySetInnerHTML={{
                        __html: f.html.replace(
                          /<span data-divine-grant=[\s\S]*?<\/span>/g,
                          "",
                        ),
                      }}
                    />
                  </div>
                ))}
              </WorldBlessingCard>
            );
          const first = fact.fields.find((f) => f.label)?.label ?? "Traços";
          const kind = /domínio/i.test(first)
            ? "domain"
            : /bênção|benção/i.test(first)
              ? "blessing"
              : /arma|estilo|arsenal|equipamento|combate básico/i.test(first)
                ? "weapon"
                : "trait";
          const Icon =
            kind === "domain"
              ? Orbit
              : kind === "blessing"
                ? Sparkles
                : kind === "weapon"
                  ? Swords
                  : Gem;
          const category =
            kind === "domain"
              ? "DOMÍNIO"
              : kind === "blessing"
                ? "BÊNÇÃO"
                : kind === "weapon"
                  ? "ARMA / ESTILO"
                  : "TRAÇO E REGRAS";
          const html = fact.fields.map((f) => f.html).join(" ");
          const plain = html.replace(/<[^>]+>/g, " ");
          const grantId = html.match(/data-divine-grant=["']([^"']+)["']/)?.[1];
          const grant = deities.find((d) => d.id === grantId);
          const tags = [
            ...new Set(
              plain.match(
                /\b\d+ Karma\b|\b\d+ PC\b|\b(?:Principal|Reação|Movimento|Livre|Extra)\b|\bnível \d+|\b(?:quatro|cinco|seis|\d+) rodadas|\b\d+ m\b/gi,
              ) ?? [],
            ),
          ].slice(0, 6);
          return (
            <section className={`noble-trait noble-trait-${kind}`} key={i}>
              <header>
                <Icon aria-hidden="true" />
                <span>{category}</span>
              </header>
              {kind === "blessing" && grant && (
                <div className="divine-outgrant">
                  <small>{grant.pantheon}</small>
                  <strong>Outorgada por {grant.name}</strong>
                  <span>{grant.epithet}</span>
                </div>
              )}
              <h5>
                {first.replace(
                  /^(Domínios?|Bênçãos?|Bençãos?|Armas?|Estilo)\s*[—:–-]?\s*/i,
                  "",
                ) || first}
              </h5>
              {tags.length > 0 && (
                <div className="noble-trait-tags">
                  {tags.map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </div>
              )}
              <div className="noble-trait-content">
                {fact.fields.map((f, j) => (
                  <div
                    className={
                      /uso|efeito|regra|custo|limite|ações|requisito|ativação|manifestação|essência/i.test(
                        f.label,
                      )
                        ? "noble-trait-mechanics"
                        : "noble-trait-description"
                    }
                    key={j}
                  >
                    {j > 0 && f.label && <b>{f.label}</b>}
                    <div dangerouslySetInnerHTML={{ __html: f.html }} />
                  </div>
                ))}
              </div>
            </section>
          );
        })}
    </div>
  );
}
