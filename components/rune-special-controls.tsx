"use client";
import { useState } from "react";
import type { CombatAction, LiveCombatState } from "@/lib/combat-types";
import type { CharacterPayload } from "@/lib/character-model";
import {
  availableKarma,
  interceptedRuneSlotExemption,
  karmicRunes,
} from "@/lib/karmic-runes";

type RuneOperation = Extract<
  CombatAction,
  {
    type:
      | "armRune"
      | "burstRune"
      | "runeBenefit"
      | "gradeVApex"
      | "interceptRune";
  }
>;
export type RuneData = RuneOperation extends infer T
  ? T extends RuneOperation
    ? Omit<T, "id" | "actorName" | "title" | "combatSessionId">
    : never
  : never;

type ControlsProps = {
  state: LiveCombatState;
  pending: boolean;
  busy: boolean;
  record: (data: RuneData, title: string) => Promise<void>;
};

export function RuneApexControls({
  state,
  pending,
  busy,
  record,
}: ControlsProps) {
  const [apexLabel, setApexLabel] = useState("");
  return (
    <details>
      <summary>Ápice de Grau V da cena</summary>
      <p>
        {state.gradeVApex
          ? `Comprometido: ${state.gradeVApex.label ?? "fonte registrada"}.`
          : "Disponível. Inscrever uma Runa V não o consome; registre seu primeiro benefício antes de aplicá-lo."}
      </p>
      <label>
        Outra fonte de Grau V (Culminação, Voto ou item)
        <input
          value={apexLabel}
          maxLength={120}
          onChange={(event) => setApexLabel(event.target.value)}
        />
      </label>
      <button
        type="button"
        disabled={
          pending || busy || Boolean(state.gradeVApex) || !apexLabel.trim()
        }
        onClick={() =>
          void record(
            { type: "gradeVApex", label: apexLabel.trim() },
            "Registrar Ápice de Grau V",
          )
        }
      >
        Comprometer Ápice desta cena
      </button>
      <p>
        As técnicas V registradas e executadas pela ficha usam este mesmo Ápice.
        Somente uma nova cena ou descanso seguro o libera.
      </p>
    </details>
  );
}

export function RuneInterceptionControls({
  draft,
  state,
  picked,
  targetName,
  targetId,
  pending,
  busy,
  record,
}: ControlsProps & {
  draft: CharacterPayload;
  picked: (typeof karmicRunes)[number];
  targetName?: string;
  targetId: string;
}) {
  const [referenceKind, setReferenceKind] = useState<"attack" | "cd">("attack");
  const [reference, setReference] = useState("");
  const [testTotal, setTestTotal] = useState("");
  const [damageBefore, setDamageBefore] = useState("");
  const [mitigationDie, setMitigationDie] = useState("");
  const [hostilePartial, setHostilePartial] = useState(false);
  const [captureRune, setCaptureRune] = useState(false);
  const [interceptionSkill, setInterceptionSkill] = useState<
    "Tática" | "Canalização de Karma"
  >("Canalização de Karma");
  return (
    <details>
      <summary>Sobrescrita de Vetor · 4 Karma e Reação</summary>
      <p>
        Confirme em mesa a fonte percebida a até 15m e o ataque ou CD expresso.
        Dano automático sem essa referência não é elegível. Role Intelecto +
        Tática ou Canalização; igualar a referência é sucesso. Informe o dano
        depois de Parcial e Resistência, antes de Escudo Temporário e Vida. O
        registro paga a Reação e os 4 Karma juntos; o dano restante é aplicado
        separadamente.
      </p>
      <div className="live-controls">
        <label>
          Referência
          <select
            value={referenceKind}
            onChange={(event) => {
              setReferenceKind(event.target.value as "attack" | "cd");
              setHostilePartial(false);
            }}
          >
            <option value="attack">Resultado do ataque</option>
            <option value="cd">CD expressa do efeito</option>
          </select>
        </label>
        <label>
          Resultado ou CD
          <input
            type="number"
            min={0}
            max={99999}
            value={reference}
            onChange={(event) => setReference(event.target.value)}
          />
        </label>
        <label>
          Perícia
          <select
            value={interceptionSkill}
            onChange={(event) =>
              setInterceptionSkill(
                event.target.value as typeof interceptionSkill,
              )
            }
          >
            <option>Canalização de Karma</option>
            <option>Tática</option>
          </select>
        </label>
        <label>
          Total do seu teste
          <input
            type="number"
            min={-99999}
            max={99999}
            value={testTotal}
            onChange={(event) => setTestTotal(event.target.value)}
          />
        </label>
        <label>
          Dano antes da redução
          <input
            type="number"
            min={0}
            max={99999}
            value={damageBefore}
            onChange={(event) => setDamageBefore(event.target.value)}
          />
        </label>
        {testTotal !== "" &&
          reference !== "" &&
          Number(testTotal) >= Number(reference) && (
            <label>
              Resultado de 1d8
              <input
                type="number"
                min={1}
                max={8}
                value={mitigationDie}
                onChange={(event) => setMitigationDie(event.target.value)}
              />
            </label>
          )}
      </div>
      {referenceKind === "attack" && (
        <label>
          <input
            type="checkbox"
            checked={hostilePartial}
            onChange={(event) => setHostilePartial(event.target.checked)}
          />
          O ataque hostil foi Parcial contra minha CA
        </label>
      )}
      <label>
        <input
          type="checkbox"
          checked={captureRune}
          onChange={(event) => setCaptureRune(event.target.checked)}
        />
        Declarar a fórmula e o suporte escolhidos acima para a captura
      </label>
      {captureRune && (
        <p>
          Captura: {picked.name}, suporte{" "}
          {targetName ?? "pessoal compatível declarado em mesa"}. Somente Grau
          I/II; sem suporte ou vaga válidos, nenhuma Runa nasce e o pagamento
          permanece.{" "}
          {interceptedRuneSlotExemption(draft)
            ? "Energia interceptada dispensa a vaga pessoal; encaixes do item continuam limitados."
            : "A captura ocupa a vaga normal da categoria."}
        </p>
      )}
      <button
        type="button"
        disabled={
          pending ||
          busy ||
          state.reactions < 1 ||
          availableKarma(state) < 4 ||
          reference === "" ||
          testTotal === "" ||
          damageBefore === "" ||
          (Number(testTotal) >= Number(reference) &&
            (mitigationDie === "" ||
              Number(mitigationDie) < 1 ||
              Number(mitigationDie) > 8))
        }
        onClick={() =>
          void record(
            {
              type: "interceptRune",
              referenceKind,
              reference: Number(reference),
              testTotal: Number(testTotal),
              damageBeforeMitigation: Number(damageBefore),
              mitigationDie:
                mitigationDie === "" ? undefined : Number(mitigationDie),
              hostilePartial,
              skill: interceptionSkill,
              runeId: captureRune ? picked.id : undefined,
              weaponId: captureRune ? targetId || undefined : undefined,
            },
            "Sobrescrita de Vetor",
          )
        }
      >
        Registrar Sobrescrita (−4 Karma e Reação)
      </button>
    </details>
  );
}
