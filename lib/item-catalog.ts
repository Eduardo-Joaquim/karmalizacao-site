import catalog from "@/data/equipment-catalog.json";
import { normalizeItemSearch } from "@/lib/search-normalization";
const collator = new Intl.Collator("pt-BR", {
  sensitivity: "variant",
  numeric: true,
});
export const alphabeticCatalog = [...catalog].sort((a, b) =>
  collator.compare(a.name, b.name),
);
export { normalizeItemSearch } from "@/lib/search-normalization";
const indexedCatalog = alphabeticCatalog.map((item) => ({
  item,
  normalized: normalizeItemSearch(item.name),
}));
export function searchItemCatalog(query: string) {
  const words = normalizeItemSearch(query).split(/\s+/).filter(Boolean);
  return indexedCatalog
    .filter((i) => words.every((w) => i.normalized.includes(w)))
    .map((i) => i.item);
}

export function catalogPriceLabel(raw: string) {
  const amount = raw.split(";").at(-1)!.trim();
  return /\d/.test(amount)
    ? amount.includes("%")
      ? amount
      : `${amount} M$`
    : "Preço sob consulta";
}
