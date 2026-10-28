"use client";
import { useState } from "react";
import { resolveRoll } from "@/lib/table-play";

export function DiceRoller({ dice, bonus, label }: { dice: number; bonus: number; label: string }) {
  const [open, setOpen] = useState(false), [extra, setExtra] = useState(0), [target, setTarget] = useState(""), [mode, setMode] = useState<"CD" | "CA">("CD");
  const [advantage, setAdvantage] = useState(0);
  const [result, setResult] = useState<ReturnType<typeof resolveRoll> & { dice: number[] }>();
  const base = Math.max(1, dice + extra);
  const worst = advantage === -1 && base === 1;
  const count = worst ? 2 : Math.max(1, Math.min(30, base + advantage));
  function roll() {
    const values = Array.from({ length: count }, () => {
      const a = new Uint32Array(1);
      do { crypto.getRandomValues(a); } while (a[0] >= 4294967280);
      return a[0] % 20 + 1;
    });
    setResult({ ...resolveRoll(values, bonus, target === "" ? undefined : Number(target), mode, worst ? "menor" : "maior"), dice: values });
  }
  return <div className="dice-roller"><button type="button" className="dice-trigger" aria-expanded={open} onClick={() => setOpen(!open)} aria-label={`Rolar ${label}: maior de ${dice}d20 ${bonus >= 0 ? "+" : ""}${bonus}`}>{dice}d20 {bonus >= 0 ? "+" : ""}{bonus} · Rolar</button>{open && <div className="dice-panel"><strong>{label}</strong><label>Dados adicionais <input type="number" min={-29} max={10} value={extra} onChange={e => setExtra(Number(e.target.value))}/></label><label>Comparar com <select value={mode} onChange={e => setMode(e.target.value as "CD" | "CA")}><option>CD</option><option>CA</option></select><input aria-label={`Valor de ${mode}`} type="number" min={0} max={999} value={target} placeholder="Opcional" onChange={e => setTarget(e.target.value)}/></label><label>Circunstância <select value={advantage} onChange={e => setAdvantage(Number(e.target.value))}><option value={0}>Normal</option><option value={1}>Vantagem</option><option value={-1}>Desvantagem</option></select></label><small>Vantagem: +1 dado. Desvantagem: −1 dado. Com 1d20 e Desvantagem, role 2d20 e escolha o menor. Use CA para ataques e CD para dificuldades fixas; testes opostos exigem o resultado do defensor.</small><button type="button" onClick={roll}>Rolar {count}d20</button>{result && <output aria-live="polite"><b>{result.total} · {result.outcome}</b><span>Dados: {result.dice.join(", ")} · escolhido {result.selected}{result.naturalTwenty ? " · 20 natural: confira o crítico da técnica" : ""}</span></output>}</div>}</div>;
}
