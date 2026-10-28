/** Progression and encounter threat are independent (chapters 4 and 18). */
export function bestiaryClassification(identity: string, fallback: {stage:string;rank:string}) {
  const stage = identity.match(/\bEtapa\s+(VII|VI|IV|V|III|II|I)\b/i)?.[1]
    ?? identity.match(/\b(?:Tanque|Duelista|Alquimista|Elementalista|Pugilista|Ranger)\s+(VII|VI|IV|V|III|II|I)\b/i)?.[1]
    ?? fallback.stage;
  const rank = identity.match(/\b(?:chefe|ranque|elite|apoio|soberana|herdeira|antagonista|combatente)\s+(SSS|SS|S|A|B|C|D|E)\b/i)?.[1]
    ?? identity.match(/·\s*(SSS|SS|S|A|B|C|D|E)\s*(?:·|$)/)?.[1]
    ?? fallback.rank;
  return {stage,rank};
}
