import axioms from "@/data/path-axioms.json";
import { STAGES, type CharacterPayload } from "@/lib/character-model";

export function hasAwakenedPath(
  draft: Pick<CharacterPayload, "stage" | "personalPath">,
) {
  return (
    STAGES.findIndex((stage) => stage === draft.stage) >= 3 &&
    draft.personalPath.enabled
  );
}

export function hasAxiom(
  draft: Pick<CharacterPayload, "stage" | "personalPath">,
  id: number,
) {
  return hasAwakenedPath(draft) && draft.personalPath.axiom === id;
}

export function pathAxiom(
  draft: Pick<CharacterPayload, "stage" | "personalPath">,
) {
  return axioms.find((axiom) => hasAxiom(draft, axiom.id));
}

export function domainPathDiscount(value: number, awakened: boolean) {
  return awakened && value > 0 ? Math.max(1, Math.round(value * 0.8)) : value;
}
