"use client";
import { useState } from "react";
import type { CharacterPayload } from "@/lib/character-model";
import type { CombatAction } from "@/lib/combat-types";
import { liveState } from "@/lib/combat-engine";
import { getCursedRuneProfile } from "@/lib/cursed-runes";

export function CursedRuneCombat({
  draft,
  onCombatAction,
}: {
  draft: CharacterPayload;
  onCombatAction?: (action: CombatAction) => Promise<void>;
}) {
  const [weaponId, setWeaponId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [outcome, setOutcome] = useState<
    "Acerto total" | "Acerto parcial" | "Falha"
  >("Acerto total");
  const [natural, setNatural] = useState("");
  const [vector, setVector] = useState<"melee" | "ranged">("melee");
  const [distance, setDistance] = useState("0");
  const [isolated, setIsolated] = useState(false);
  const [flanked, setFlanked] = useState(false);
  const [debilitated, setDebilitated] = useState(false);
  const [control, setControl] = useState("");
  const [hungerDie, setHungerDie] = useState("");
  const [ritualDC, setRitualDC] = useState("");
  const [ritualCompleted, setRitualCompleted] = useState(false);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState("");
  const weapons = draft.inventory.filter(
    (item) => item.cursedRune && item.quantity > 0,
  );
  const picked = weapons.find((item) => item.id === weaponId) ?? weapons[0];
  if (!picked?.cursedRune) return null;
  const inscription = picked.cursedRune;
  const profile = getCursedRuneProfile(draft, inscription);
  const live = liveState(draft);
  const current = live.cursedWeapons?.[picked.id];
  const busy = pending || !onCombatAction;
  type Data =
    | Omit<
        Extract<CombatAction, { type: "cursedStrike" }>,
        "id" | "actorName" | "title"
      >
    | Omit<
        Extract<CombatAction, { type: "cursedWeapon" }>,
        "id" | "actorName" | "title"
      >;
  async function record(data: Data, title: string) {
    if (!onCombatAction) return;
    setPending(true);
    try {
      await onCombatAction({
        ...data,
        id: crypto.randomUUID(),
        actorName: draft.name || "Portador",
        title,
      });
      setFeedback(
        "Registro confirmado. Consulte o resultado no histórico de combate.",
      );
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Não foi possível registrar a maldição.",
      );
    } finally {
      setPending(false);
    }
  }
  const inputNumber = (value: string) =>
    value.trim() ? Number(value) : undefined;
  return (
    <details className="cursed-rune-combat">
      <summary>Runas Amaldiçoadas em combate</summary>
      <p>
        Resolva o ataque da arma primeiro. Este painel registra somente marcas,
        Fome e o tributo da maldição. O dano do despertar e seus estados são
        resolvidos separadamente em mesa.
      </p>
      <label>
        Arma amaldiçoada
        <select
          value={picked.id}
          onChange={(event) => {
            setWeaponId(event.target.value);
            setFeedback("");
          }}
        >
          {weapons.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <p>
        {profile.effect?.name} · {profile.damage} · CD {profile.escapeDC}.{" "}
        {current?.dormant ? "Em torpor." : "Desperta."} Sem Karma Retido ou vaga
        pessoal.
      </p>
      {Object.entries(current?.targets ?? {}).map(([target, value]) => (
        <p key={target}>
          {target}: {value.marks} marca(s)
          {value.hasTotal
            ? "; Total registrado na sequência"
            : "; sem Total na sequência"}
          .
        </p>
      ))}
      <div className="live-controls">
        <label>
          Nome ou identificação estável do alvo
          <input
            maxLength={120}
            value={targetId}
            onChange={(event) => setTargetId(event.target.value)}
          />
        </label>
        <label>
          Resultado do ataque
          <select
            value={outcome}
            onChange={(event) =>
              setOutcome(event.target.value as typeof outcome)
            }
          >
            <option>Acerto total</option>
            <option>Acerto parcial</option>
            <option>Falha</option>
          </select>
        </label>
        <label>
          d20 natural selecionado
          <input
            type="number"
            min={1}
            max={20}
            value={natural}
            onChange={(event) => setNatural(event.target.value)}
          />
        </label>
        <label>
          Vetor
          <select
            value={vector}
            onChange={(event) => setVector(event.target.value as typeof vector)}
          >
            <option value="melee">Contato corpo a corpo</option>
            <option value="ranged">Ataque à distância</option>
          </select>
        </label>
        <label>
          Distância até o alvo (m)
          <input
            type="number"
            min={0}
            max={99999}
            value={distance}
            onChange={(event) => setDistance(event.target.value)}
          />
        </label>
        {inscription.conditionIds.includes("C7") && (
          <>
            <label>
              <input
                type="checkbox"
                checked={isolated}
                onChange={(event) => setIsolated(event.target.checked)}
              />
              Alvo sem aliados dele a até 3 m
            </label>
            <label>
              <input
                type="checkbox"
                checked={flanked}
                onChange={(event) => setFlanked(event.target.checked)}
              />
              Alvo engajado com um aliado do portador
            </label>
          </>
        )}
        {inscription.conditionIds.includes("C9") && (
          <label>
            <input
              type="checkbox"
              checked={debilitated}
              onChange={(event) => setDebilitated(event.target.checked)}
            />
            Alvo com condição negativa ou abaixo de 50% da Vida
          </label>
        )}
      </div>
      {Number(natural) === 1 && (
        <fieldset>
          <legend>Fome da arma · CD {profile.hungerDC}</legend>
          <p>
            Role Presença + Controle da Corrupção. A Fome considera o dado
            selecionado; um 1 descartado da reserva não a aciona.
          </p>
          <label>
            Resultado do Controle
            <input
              type="number"
              value={control}
              onChange={(event) => setControl(event.target.value)}
            />
          </label>
          {inscription.hungerPenalty !== "temporaryCharge" && (
            <label>
              Resultado de 1d6 Corrupto, se o Controle falhou
              <input
                type="number"
                min={1}
                max={6}
                value={hungerDie}
                onChange={(event) => setHungerDie(event.target.value)}
              />
            </label>
          )}
        </fieldset>
      )}
      <button
        type="button"
        disabled={
          busy ||
          Boolean(current?.dormant) ||
          !targetId.trim() ||
          !natural.trim() ||
          !distance.trim()
        }
        onClick={() =>
          void record(
            {
              type: "cursedStrike",
              weaponId: picked.id,
              targetId: targetId.trim(),
              outcome,
              selectedNatural: Number(natural),
              vector,
              distance: Number(distance),
              isolated,
              flanked,
              targetDebilitated: debilitated,
              controlTotal: inputNumber(control),
              hungerDie: inputNumber(hungerDie),
            },
            "Registrar ataque da arma amaldiçoada",
          )
        }
      >
        Registrar marcas e Fome deste ataque
      </button>
      {inscription.conditionIds.includes("C10") && (
        <fieldset>
          <legend>Manutenção de sangue</legend>
          <p>
            Confirme o sangue de um inimigo derrotado nesta cena de combate. A
            nova cena avalia o torpor e encerra as marcas; abrir ou fechar o
            encontro não alimenta a arma.
          </p>
          <p>
            Para interagir com a maldição, informe Presença + Controle da
            Corrupção contra a CD anunciada pelo Mestre. A alimentação e a
            supressão só são confirmadas no sucesso.
          </p>
          <label>
            CD anunciada pelo Mestre
            <input
              type="number"
              min={0}
              value={ritualDC}
              onChange={(event) => setRitualDC(event.target.value)}
            />
          </label>
          <label>
            Resultado de Presença + Controle
            <input
              type="number"
              value={control}
              onChange={(event) => setControl(event.target.value)}
            />
          </label>
          <button
            type="button"
            disabled={busy || !control.trim() || !ritualDC.trim()}
            onClick={() =>
              void record(
                {
                  type: "cursedWeapon",
                  weaponId: picked.id,
                  operation: "feed",
                  controlTotal: Number(control),
                  ritualDC: Number(ritualDC),
                },
                "Alimentar arma amaldiçoada",
              )
            }
          >
            Confirmar alimentação com sangue de inimigo derrotado
          </button>
          <button
            type="button"
            disabled={
              busy ||
              Boolean(current?.dormant) ||
              !control.trim() ||
              !ritualDC.trim()
            }
            onClick={() =>
              void record(
                {
                  type: "cursedWeapon",
                  weaponId: picked.id,
                  operation: "torpor",
                  controlTotal: Number(control),
                  ritualDC: Number(ritualDC),
                },
                "Registrar torpor da arma",
              )
            }
          >
            Registrar torpor
          </button>
          {current?.dormant && (
            <>
              <label>
                <input
                  type="checkbox"
                  checked={ritualCompleted}
                  onChange={(event) => setRitualCompleted(event.target.checked)}
                />
                Concluí 1 TE de alimentação
              </label>
              <button
                type="button"
                disabled={
                  busy ||
                  !ritualCompleted ||
                  !control.trim() ||
                  !ritualDC.trim()
                }
                onClick={() =>
                  void record(
                    {
                      type: "cursedWeapon",
                      weaponId: picked.id,
                      operation: "wake",
                      controlTotal: Number(control),
                      ritualDC: Number(ritualDC),
                      ritualCompleted,
                    },
                    "Ritual de despertar da arma",
                  )
                }
              >
                Registrar ritual de despertar
              </button>
            </>
          )}
        </fieldset>
      )}
      {feedback && <p role="status">{feedback}</p>}
      {live.lastActionLog?.inventoryItemId === picked.id && (
        <p>{live.lastActionLog.details}</p>
      )}
    </details>
  );
}
