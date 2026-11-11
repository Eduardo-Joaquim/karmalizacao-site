import { lerExtensaoBencao } from "@/lib/patch-v204-types";

export function CatalogBlessingDetails({
  blessing,
}: {
  blessing: {
    phenomenon: string;
    extensions: readonly string[];
    harvest: string;
  };
}) {
  return (
    <div className="catalog-blessing-details">
      <section>
        <h5>Fenômeno base</h5>
        <p>{blessing.phenomenon}</p>
      </section>
      <section>
        <h5>Extensões de combate</h5>
        <ol>
          {blessing.extensions.map((text) => {
            const { nome, acaoECusto, efeito } = lerExtensaoBencao(text);
            return (
              <li key={text}>
                <strong>{nome}</strong>
                {acaoECusto && <small>{acaoECusto}</small>}
                <p>{efeito}</p>
              </li>
            );
          })}
        </ol>
      </section>
      <section>
        <h5>Safra na Morte</h5>
        <p>{blessing.harvest}</p>
      </section>
    </div>
  );
}
