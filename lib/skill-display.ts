/** Preserve authored training and rolls without inferring missing levels. */
export type SkillDisplay = { name: string; level: number; roll: string; context: string };
export function plainSkillText(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
}
export function skillDisplay(html: string): { skills: SkillDisplay[]; notes: string[] } {
  const text = plainSkillText(html).replace(/^Perícias\s*:?\s*/i, "");
  const skills: SkillDisplay[] = [], notes: string[] = [];
  for (const part of text.split(/[.;](?:\s|$)/).map(s => s.trim()).filter(Boolean)) {
    if (/^(Ataque básico|Demais|Perícias não indicadas|Perícia|Sem |Não |A CA|As quatro|Sua |Testes |Em testes )/i.test(part)) { notes.push(part); continue; }
    const matches = [...part.matchAll(/([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ ,—–-]*?)\s+([0-3])\b/g)]
      .filter(m => !/^(?:Demais|Perícias não indicadas|Perícia|nível|no nível)/i.test(m[1]));
    if (!matches.length) { notes.push(part); continue; }
    const roll = part.match(/(?:maior\s+(?:de\s+)?)?\d+d20\s*[+−-]\s*\d+/i)?.[0] ?? "";
    const context = part.match(/com (Força|Agilidade|Constituição|Intelecto|Presença|Espírito)(?:, incluindo Analítico)?/i)?.[0] ?? "";
    for (const match of matches) {
      const names = match[1].replace(/^(?:e|Perícias:)\s+/i, "").split(/,\s*|\s+e\s+/);
      for (const name of names.map(n => n.trim()).filter(Boolean)) {
        if (!skills.some(s => s.name === name)) skills.push({ name, level: Number(match[2]), roll, context });
      }
    }
  }
  return { skills, notes };
}
