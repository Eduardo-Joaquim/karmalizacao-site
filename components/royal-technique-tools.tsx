"use client";
import { entropicKarma, reflectRoyalDice } from "@/lib/royal-technique-rules";
import { useState } from "react";
export function RoyalTechniqueTools({
  reflection,
  entropy,
}: {
  reflection?: number;
  entropy?: number;
}) {
  const [formula, setFormula] = useState("3d10"),
    [roll, setRoll] = useState<ReturnType<typeof reflectRoyalDice>>(null),
    [error, setError] = useState("");
  const [maximum, setMaximum] = useState(100),
    [current, setCurrent] = useState(100),
    [existing, setExisting] = useState(0);
  if (reflection)
    return (
      <div className="royal-technique-tools">
        <label>
          Dados-base do ataque recebido
          <input
            value={formula}
            onChange={(e) => setFormula(e.target.value)}
            placeholder="3d10"
            maxLength={24}
          />
        </label>
        <button
          type="button"
          className="dice-trigger"
          onClick={() => {
            try {
              setRoll(reflectRoyalDice(formula));
              setError("");
            } catch (e) {
              setError((e as Error).message);
              setRoll(null);
            }
          }}
        >
          Rolar retorno em dobro
        </button>
        {error && <p role="alert">{error}</p>}
        {roll && (
          <output aria-live="polite">
            <strong>{roll.total}</strong>
            <span>
              {roll.formula}: {roll.dice.join(", ")}
            </span>
          </output>
        )}
        <p>
          Some bônus fixos e dados adicionais uma vez. Este retorno não recebe
          outra duplicação por crítico e não pode ser refletido.
        </p>
      </div>
    );
  if (entropy) {
    const result = entropicKarma(maximum, current, existing);
    return (
      <div className="royal-technique-tools">
        <label>
          Karma máximo íntegro
          <input
            type="number"
            min={0}
            max={99999}
            value={maximum}
            onChange={(e) =>
              setMaximum(Math.max(0, Math.trunc(Number(e.target.value) || 0)))
            }
          />
        </label>
        <label>
          Karma atual
          <input
            type="number"
            min={0}
            max={99999}
            value={current}
            onChange={(e) =>
              setCurrent(Math.max(0, Math.trunc(Number(e.target.value) || 0)))
            }
          />
        </label>
        <label>
          Corrosão já registrada
          <input
            type="number"
            min={0}
            max={99999}
            value={existing}
            onChange={(e) =>
              setExisting(Math.max(0, Math.trunc(Number(e.target.value) || 0)))
            }
          />
        </label>
        <output aria-live="polite">
          <strong>
            Máximo acessível: {result.maximum} · Atual: {result.current}
          </strong>
          <span>
            Registre {result.loss} de corrosão sobre o máximo íntegro{" "}
            {result.intactMaximum}. Não acumule outra marca.
          </span>
        </output>
        <p>
          Registre na ficha do alvo. A corrosão permanece entre cenas e só
          termina após descanso longo em santuário purificado.
        </p>
      </div>
    );
  }
  return null;
}
