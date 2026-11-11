import bestiaryIndex from "@/data/bestiary-blessing-index.json";
import catalog from "@/data/pantheon-blessings.json";
import type { BlessingGrant } from "@/lib/character-model";

export type CategoriaAcessoBencao =
  | "catalogo_player"
  | "hereditaria_linhagem"
  | "unica_bestiario";

export const EXCLUSIVE_BLESSING_NOTICE =
  "Esta é uma Bênção Hereditária ou Única de um personagem do Bestiário e não pode ser utilizada por jogadores.";

export function normalizarSlug(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const BENCAOS_EXCLUSIVAS_BLOQUEADAS = new Set(
  bestiaryIndex.flatMap((entry) =>
    [entry.id, entry.name, ...(entry.aliases ?? [])].map(normalizarSlug),
  ),
);

export function obterSlugsBencaosDoBestiario(): ReadonlySet<string> {
  return BENCAOS_EXCLUSIVAS_BLOQUEADAS;
}

export function isExclusiveBlessingName(value: string): boolean {
  const slug = normalizarSlug(value);
  return (
    BENCAOS_EXCLUSIVAS_BLOQUEADAS.has(slug) ||
    BENCAOS_EXCLUSIVAS_BLOQUEADAS.has(
      slug.replace(
        /^bencao-(?:(?:hereditaria|unica|divina|verdadeira)-)?(?:(?:de|do|da)-)?/,
        "",
      ),
    )
  );
}

export function filtrarBencaosPermitidasParaPlayers<
  T extends {
    id: string | number;
    title: string;
    categoriaAcesso?: string;
    disponivelParaPlayer?: boolean;
  },
>(blessings: readonly T[]): T[] {
  return blessings.filter(
    (blessing) =>
      blessing.categoriaAcesso === "catalogo_player" &&
      blessing.disponivelParaPlayer === true &&
      !isExclusiveBlessingName(String(blessing.id)) &&
      !isExclusiveBlessingName(blessing.title),
  );
}

export const playerBlessingCatalog = catalog.map((pantheon) => ({
  ...pantheon,
  deities: pantheon.deities.map((deity) => ({
    ...deity,
    blessings: filtrarBencaosPermitidasParaPlayers(deity.blessings),
  })),
}));

const allowedById = new Map(
  playerBlessingCatalog.flatMap((pantheon) =>
    pantheon.deities.flatMap((deity) =>
      deity.blessings.map(
        (blessing) =>
          [
            `catalog-blessing-${blessing.id}` as string,
            { blessing, deity, pantheon },
          ] as const,
      ),
    ),
  ),
);
const exclusiveText = bestiaryIndex
  .map((entry) => normalizarSlug(entry.description))
  .filter((text) => text.length >= 45);

export function playerCatalogEntry(id: string) {
  return allowedById.get(id);
}

export function blessingAccessError(
  grant: Pick<
    BlessingGrant,
    | "id"
    | "name"
    | "grantOrigin"
    | "core"
    | "initialGift"
    | "activeManifestation"
    | "essentialLimits"
  >,
): string | undefined {
  const origin = normalizarSlug(grant.grantOrigin);
  const text = normalizarSlug(
    [
      grant.core,
      grant.initialGift,
      grant.activeManifestation,
      grant.essentialLimits,
    ].join(" "),
  );
  if (
    isExclusiveBlessingName(grant.id) ||
    isExclusiveBlessingName(grant.name) ||
    /(?:hereditaria|heranca-de-linhagem|linhagem-real|sangue-dinastico)/.test(
      origin,
    ) ||
    exclusiveText.some((effect) => text.includes(effect))
  )
    return EXCLUSIVE_BLESSING_NOTICE;
  if (
    grant.id.startsWith("catalog-blessing-") &&
    !playerCatalogEntry(grant.id)
  ) {
    return "Esta Bênção não está disponível no Catálogo de Outorga Aberta das Nove Asas.";
  }
}
