import constructions from "@/data/technique-construction.json";
type Field = { label: string; html: string };
export function abilityCostFields(owner: string, name: string, fields: Field[]): Field[] {
  if (fields.some(f => f.label === "Composição de Karma" || /<strong>Composição de\s+Karma:/i.test(f.html))) return fields;
  const entry = constructions.find(e => e.owner === owner && e.name === name);
  if (!entry) return fields;
  const escape = (s: string) => s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const explanation = entry.components?.length
    ? entry.components.map(c => `${c.value < 0 ? "−" : "+"} ${Math.abs(c.value)} ${c.label}`).join(" ").replace(/^\+ /, "") + ` = ${entry.cost} Karma.`
    : `${entry.cost === 0 ? "Não consome Karma." : entry.cost !== null ? `${entry.cost} Karma.` : "Custo conforme a regra própria."} ${entry.source ?? ""}`;
  return [...fields, {label:"Composição de Karma", html:escape(explanation)}];
}
