"use client";
import type { CharacterPayload } from "@/lib/character-model";
import { combatId } from "@/lib/combat-id";
import type { CombatAction, LiveCombatState } from "@/lib/combat-types";
import {
  availableKarma,
  karmicRunes,
  personalRuneCount,
  personalRuneLimit,
  retainedKarma,
  runeInscriptionAction,
  runeInscriptionError,
  runeSupport,
} from "@/lib/karmic-runes";
import { useState } from "react";

export function RuneCombat({
  draft,
  state,
  send,
  pending = false,
  itemId,
}: {
  draft: CharacterPayload;
  state: LiveCombatState;
  send: (action: CombatAction) => Promise<void>;
  pending?: boolean;
  itemId?: string;
}) {
  const [runeId, setRuneId] = useState(0);
  const [selectedItem, setSelectedItem] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const items = draft.inventory.flatMap((item) => {
    const support = runeSupport(item);
    return support?.accessible ? [{ item, support }] : [];
  });
  const targetId =
    itemId ??
    (items.some(({ item }) => item.id === selectedItem) ? selectedItem : "");
  const target = draft.inventory.find((item) => item.id === targetId);
  const support = target && runeSupport(target);
  const active = (state.runes ?? []).filter((rune) => !rune.spent);
  const attached = itemId
    ? active.filter((rune) => rune.weaponId === itemId)
    : active;
  const compatible = karmicRunes.filter((rune) =>
    support ? rune.category === support.category : rune.category !== "Arma",
  );
  const picked = compatible.find((rune) => rune.id === runeId) ?? compatible[0];
  const issue = runeInscriptionError(
    draft,
    state,
    picked,
    targetId || undefined,
  );
  const occupied = support?.slots
    ? active.filter((entry) => entry.weaponId === targetId).length
    : personalRuneCount(draft, state);
  const capacity = support?.slots || personalRuneLimit(draft);

  async function record(
    data:
      | Pick<
          Extract<CombatAction, { type: "armRune" }>,
          "type" | "runeId" | "weaponId"
        >
      | Pick<
          Extract<CombatAction, { type: "burstRune" }>,
          "type" | "inscriptionId" | "disarm"
        >,
    title: string,
  ) {
    setBusy(true);
    setMessage("");
    try {
      await send({
        ...data,
        id: combatId(),
        actorName: draft.name || "Personagem",
        title,
      });
      setMessage("Registro atualizado.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível registrar a runa.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <details className="live-rune-controls inventory-rune-controls">
      <summary>
        {itemId
          ? `Runas do item · ${attached.length} armadas`
          : `Runas Kármicas · ${retainedKarma(state)} Karma retidos`}
      </summary>
      <p>
        {availableKarma(state)} Karma disponíveis · {occupied}/{capacity}{" "}
        espaços {support?.slots ? "do item" : "pessoais"} ocupados.
      </p>
      {support?.category === "Arma" && !support.slots && (
        <p>Esta arma aceita uma runa. A inscrição ocupa uma vaga pessoal.</p>
      )}
      {itemId && !support ? (
        <p>
          Este item não aceita novas inscrições. Você ainda pode desarmar as
          runas registradas.
        </p>
      ) : (
        <>
          <div className="live-controls">
            {!itemId && (
              <label>
                Suporte
                <select
                  value={targetId}
                  onChange={(event) => setSelectedItem(event.target.value)}
                >
                  <option value="">Espaço pessoal · suporte em mesa</option>
                  {items.map(({ item }) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label>
              Runa
              <select
                value={picked.id}
                onChange={(event) => setRuneId(Number(event.target.value))}
              >
                {compatible.map((rune) => (
                  <option key={rune.id} value={rune.id}>
                    {rune.name} · {rune.retained} Karma
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={pending || busy || Boolean(issue)}
              onClick={() =>
                void record(
                  {
                    type: "armRune",
                    runeId: picked.id,
                    weaponId: targetId || undefined,
                  },
                  `Inscrever ${picked.name}`,
                )
              }
            >
              Registrar inscrição
            </button>
          </div>
          {issue && <p>{issue}</p>}
          <p>
            <strong>
              {picked.category} · Grau {picked.grade} ·{" "}
              {runeInscriptionAction(draft, picked)}
            </strong>{" "}
            {picked.passive}
          </p>
          <p>
            <strong>Estouro</strong> {picked.burst}
          </p>
        </>
      )}
      {attached.map((inscription) => {
        const rune = karmicRunes.find(
          (entry) => entry.id === inscription.runeId,
        );
        const item = draft.inventory.find(
          (entry) => entry.id === inscription.weaponId,
        );
        return (
          rune && (
            <article key={inscription.id}>
              <h3>{rune.name}</h3>
              {!itemId && (
                <small>
                  {item?.name ??
                    (inscription.weaponId
                      ? "Suporte removido"
                      : "Espaço pessoal")}
                </small>
              )}
              <p>{rune.passive}</p>
              <p>{rune.burst}</p>
              <div className="live-controls">
                <button
                  type="button"
                  disabled={pending || busy}
                  onClick={() =>
                    void record(
                      { type: "burstRune", inscriptionId: inscription.id },
                      `Estourar ${rune.name}`,
                    )
                  }
                >
                  Registrar Estouro
                </button>
                <button
                  type="button"
                  disabled={pending || busy}
                  onClick={() =>
                    void record(
                      {
                        type: "burstRune",
                        inscriptionId: inscription.id,
                        disarm: true,
                      },
                      `Desarmar ${rune.name}`,
                    )
                  }
                >
                  Desarmar
                </button>
              </div>
            </article>
          )
        );
      })}
      <p role="status">{message}</p>
      <small>
        Registre depois de resolver a inscrição ou o gatilho em mesa. O site
        controla vagas e Karma Retido.
      </small>
    </details>
  );
}
