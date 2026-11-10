import { type CharacterPayload } from "@/lib/character-data";
import { playableBlessingGrants } from "@/lib/divine-blessings";
import { playerCatalogEntry } from "@/lib/blessings-filter";
import { CatalogBlessingDetails } from "@/components/catalog-blessing-details";
import { DivineRoll } from "@/components/blessing-editor";

export function DivineAltar({ draft }: { draft: CharacterPayload }) {
  const divine = draft.divine;

  return (
    <div className="divine-editor">
      {divine.expression.includes("Bênção") && playableBlessingGrants(divine).map((blessing) => {
        const catalog = playerCatalogEntry(blessing.id);
        return (
          <article className="divine-altar catalog-grant" key={blessing.id}>
            <header>
              <small>{blessing.pantheon || "Panteão não registrado"}</small>
              <h3>{blessing.name || "Bênção"}</h3>
              <p>Outorgada por <strong>{blessing.deity || "divindade não registrada"}</strong>{blessing.deityEpithet && `, ${blessing.deityEpithet}`}</p>
              <span>{blessing.grantOrigin || "Origem não registrada"}</span>
              {blessing.grantReason && <p>{blessing.grantReason}</p>}
              {blessing.tier && <span className="divine-grant-tier">{blessing.tier}</span>}
            </header>
            <DivineRoll draft={draft} attribute={blessing.regentAttribute} skill="Manifestação de Bênção" />
            {catalog && <CatalogBlessingDetails blessing={catalog.blessing} />}
            <div className="divine-grid">
              {catalog ? (
                <section><h4>Faceta</h4><p>{catalog.blessing.facet}</p></section>
              ) : (
                <>
                  <section><h4>Núcleo e Dádiva Inicial</h4><p>{blessing.core || "Não registrado"}</p><p>{blessing.initialGift}</p></section>
                  <section><h4>Manifestação Ativa</h4><p>{blessing.activeManifestation || "Não registrada"}</p></section>
                  <section><h4>Limites Essenciais</h4><p>{blessing.essentialLimits || "Não registrados"}</p></section>
                </>
              )}
              <section>
                <h4>Preceito e Profanação</h4>
                <p>{blessing.precept || divine.precept || "Preceito não registrado"}</p>
                <p>{blessing.profanation || divine.profanation}</p>
              </section>
            </div>
          </article>
        );
      })}
      {divine.expression.includes("Comunhão") && (
        <article className="divine-altar divine-communion">
          <header>
            <small>{divine.pantheon}</small>
            <h3>Comunhão Divina · {divine.deity || "Vínculo divino"}</h3>
            <p>Favor {divine.favor}/3 · Nível de poder {divine.powerLevel}/5</p>
          </header>
          <DivineRoll draft={draft} attribute="Presença" skill="Comunhão Divina" />
          <p>{divine.jurisdictions}</p>
          <div className="divine-grid">
            <section><h4>Liturgias</h4><p>{divine.liturgies || "Não registradas"}</p></section>
            <section><h4>Milagres</h4><p>{divine.miracles || "Não registrados"}</p></section>
          </div>
        </article>
      )}
    </div>
  );
}
