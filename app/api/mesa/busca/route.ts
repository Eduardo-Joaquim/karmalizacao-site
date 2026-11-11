import { searchRules } from "@/lib/gm-search";
import { searchItemCatalog } from "@/lib/item-catalog";
export function GET(request: Request) {
  const query =
    new URL(request.url).searchParams.get("q")?.trim().slice(0, 80) ?? "";
  return Response.json(
    query.length < 2
      ? { rules: [], items: [] }
      : {
          rules: searchRules(query).slice(0, 12),
          items: searchItemCatalog(query).slice(0, 12),
        },
  );
}
