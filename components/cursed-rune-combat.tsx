"use client";

import { useState } from "react";
import type { CharacterPayload } from "@/lib/character-model";
import type { CombatAction } from "@/lib/combat-types";
import { liveState } from "@/lib/combat-engine";
import { curseRulesVersion } from "@/lib/cursed-rune-model";
import { cursedRuneKey, getCursedRuneProfile } from "@/lib/cursed-runes";

const emptyContext = () => ({
  movedDistance: "",
  higherGround: false,
  targetDamagedBearer: false,
  elementalOrArcane: false,
  effectiveDamage: "",
  nearbyAllies: "",
  targetPresence: "",
  allyDamagedTarget: false,
  sheltered: false,
});

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
  const [context, setContext] = useState(emptyContext);
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
  const modern = curseRulesVersion(inscription) === 2;
  const has = (id: string) => inscription.conditionIds.includes(id);
  const profile = getCursedRuneProfile(draft, inscription);
  const live = liveState(draft);
  const savedState = live.cursedWeapons?.[picked.id];
  const current =
    savedState?.runeKey === cursedRuneKey(inscription) ? savedState : undefined;
  const busy = pending || !onCombatAction;
  const hasTurnCycle = weapons.some(
    (item) =>
      item.cursedRune &&
      curseRulesVersion(item.cursedRune) === 2 &&
      item.cursedRune.conditionIds.includes("C3"),
  );
  const needsMovement =
    modern &&
    (has("C11") || (has("C10") && inscription.counterTimeMode === "charge"));
  const numeric = (value: string) => (value.trim() ? Number(value) : undefined);
  const isNumber = (value: string, min = 0, max = 99999) =>
    value.trim() !== "" &&
    Number.isFinite(Number(value)) &&
    Number(value) >= min &&
    Number(value) <= max;
  const hungerDamage =
    modern || inscription.hungerPenalty !== "temporaryCharge";
  const hungerFailed =
    Number(natural) === 1 &&
    control.trim() !== "" &&
    Number(control) < profile.hungerDC;
  const missingContext =
    modern &&
    outcome !== "Falha" &&
    ((needsMovement &&
      !context.higherGround &&
      !isNumber(context.movedDistance)) ||
      (has("C10") &&
        inscription.counterTimeMode === "charge" &&
        !isNumber(context.movedDistance)) ||
      (has("C15") && !isNumber(context.effectiveDamage)) ||
      (has("C16") &&
        (!isNumber(context.nearbyAllies) ||
          !Number.isInteger(Number(context.nearbyAllies)) ||
          Number(context.nearbyAllies) > 100)) ||
      (has("C18") &&
        (!isNumber(context.targetPresence) ||
          !Number.isInteger(Number(context.targetPresence)))));
  const invalidHunger =
    Number(natural) === 1 &&
    (!control.trim() ||
      !Number.isFinite(Number(control)) ||
      (hungerFailed &&
        hungerDamage &&
        (!isNumber(hungerDie, 1, 6) || !Number.isInteger(Number(hungerDie)))));
  type Data =
    | Omit<
        Extract<CombatAction, { type: "cursedStrike" }>,
        "id" | "actorName" | "title"
      >
    | Omit<
        Extract<CombatAction, { type: "cursedWeapon" }>,
        "id" | "actorName" | "title"
      >
    | Omit<
        Extract<CombatAction, { type: "cursedTurnEnd" }>,
        "id" | "actorName" | "title"
      >;

  function resetEvidence() {
    setContext(emptyContext());
    setIsolated(false);
    setFlanked(false);
    setDebilitated(false);
    setNatural("");
    setControl("");
    setHungerDie("");
    setRitualDC("");
    setRitualCompleted(false);
    setFeedback("");
  }
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
      if (data.type === "cursedStrike") {
        setNatural("");
        setControl("");
        setHungerDie("");
        setContext(emptyContext());
        setIsolated(false);
        setFlanked(false);
        setDebilitated(false);
      }
      if (data.type === "cursedWeapon") {
        setControl("");
        setRitualCompleted(false);
      }
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

  return (
    <details className="cursed-rune-combat">
      <summary>Runas Amaldiçoadas em combate</summary>
      <p>
        Resolva o ataque da arma primeiro. Este painel registra marcas, Fome e
        custos do portador. O dano do despertar e os estados da vítima são
        resolvidos separadamente em mesa.
      </p>
      <label>
        Arma amaldiçoada
        <select
          value={picked.id}
          disabled={pending}
          onChange={(event) => {
            setWeaponId(event.target.value);
            resetEvidence();
          }}
        >
          {weapons.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <div className="cursed-combat-profile">
        <strong>{inscription.name || profile.effect?.name}</strong>
        <p>
          {profile.damage} no despertar - Escape CD {profile.escapeDC} - Fome CD{" "}
          {profile.hungerDC}
        </p>
        <p>
          {current?.dormant ? "Em torpor." : "Maldição ativa."} Sem Karma Retido
          ou vaga pessoal.
        </p>
        {!modern && (
          <p className="cursed-rune-note">
            Esta inscrição conserva suas condições e seus custos anteriores até
            ser reforjada.
          </p>
        )}
      </div>
      {Object.keys(current?.targets ?? {}).length > 0 && (
        <ul className="cursed-target-marks" aria-label="Marcas por alvo">
          {Object.entries(current?.targets ?? {}).map(([target, value]) => (
            <li key={target}>
              <strong>{target}</strong> - {value.marks} marca(s)
              {value.hasTotal
                ? "; Total registrado na sequência"
                : "; sem Total na sequência"}
            </li>
          ))}
        </ul>
      )}
      {hasTurnCycle && (
        <div className="cursed-rune-note">
          <p>
            C3 - As duas marcas precisam fechar no mesmo turno. Encerrar o turno
            apaga as marcas incompletas de todas as suas armas com esse ciclo.
          </p>
          <button
            type="button"
            disabled={busy || Boolean(live.cursedTurnClosed)}
            onClick={() =>
              void record(
                { type: "cursedTurnEnd" },
                "Encerrar ciclos de maldição deste turno",
              )
            }
          >
            Encerrar ciclos deste turno
          </button>
          {live.cursedTurnClosed && (
            <p>
              Turno encerrado para C3. Inicie o próximo turno para acumular
              novas marcas desse ciclo.
            </p>
          )}
        </div>
      )}
      {modern && has("C4") && (
        <p className="cursed-rune-note">
          C4 - Três marcas no mesmo alvo fecham o ciclo; marcas incompletas
          expiram ao mudar de cena.
        </p>
      )}
      {modern && has("C13") && (
        <p className="cursed-rune-note">
          C13 - Quatro marcas na cena fecham o ciclo. Sofrer dano efetivo de
          Vida apaga as marcas incompletas.
        </p>
      )}
      {has("C8") && (
        <p className="cursed-rune-note">
          {modern
            ? "C8 - Estar ferido e pagar 4 de Vida são requisitos conjuntos do despertar."
            : inscription.tributeMode === "wounded"
              ? "C8 - Esta gravação exige o portador abaixo de 50% da Vida."
              : "C8 - Esta gravação cobra 3 de Vida no despertar."}
        </p>
      )}
      {modern && has("C17") && (
        <p className="cursed-rune-note">
          C17 - Cada fechamento consome 2 de Karma da reserva do portador.
        </p>
      )}
      <fieldset disabled={pending}>
        <legend>Resultado do ataque</legend>
        <div className="live-controls">
          <label>
            Nome ou identificação estável do alvo
            <input
              maxLength={120}
              value={targetId}
              disabled={pending}
              onChange={(event) => {
                setTargetId(event.target.value);
                resetEvidence();
              }}
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
              step={1}
              value={natural}
              onChange={(event) => {
                setNatural(event.target.value);
                setControl("");
                setHungerDie("");
              }}
            />
          </label>
          <label>
            Vetor
            <select
              value={vector}
              onChange={(event) =>
                setVector(event.target.value as typeof vector)
              }
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
        </div>
      </fieldset>
      {(has("C7") ||
        has("C9") ||
        (modern &&
          inscription.conditionIds.some((id) =>
            ["C10", "C11", "C12", "C15", "C16", "C18", "C19", "C20"].includes(
              id,
            ),
          ))) && (
        <fieldset className="cursed-strike-context" disabled={pending}>
          <legend>Condições deste ataque</legend>
          <p className="cursed-rune-note">
            Confirme a situação em mesa. Um requisito não atendido impede a
            marca; a Fome ainda considera o dado selecionado.
          </p>
          {has("C7") &&
            (inscription.isolationMode === "flanked" ? (
              <label>
                <input
                  type="checkbox"
                  checked={flanked}
                  onChange={(event) => setFlanked(event.target.checked)}
                />
                C7 - Alvo flanqueado: engajado com um aliado do portador.
              </label>
            ) : (
              <label>
                <input
                  type="checkbox"
                  checked={isolated}
                  onChange={(event) => setIsolated(event.target.checked)}
                />
                C7 - Alvo isolado: sem aliados dele a até 3m.
              </label>
            ))}
          {has("C9") && (
            <label>
              <input
                type="checkbox"
                checked={debilitated}
                onChange={(event) => setDebilitated(event.target.checked)}
              />
              C9 - Alvo com condição negativa ou{" "}
              {modern ? "com até 50%" : "abaixo de 50%"} da Vida.
            </label>
          )}
          {modern && has("C10") && inscription.counterTimeMode !== "charge" && (
            <label>
              <input
                type="checkbox"
                checked={context.targetDamagedBearer}
                onChange={(event) =>
                  setContext((value) => ({
                    ...value,
                    targetDamagedBearer: event.target.checked,
                  }))
                }
              />
              C10 - Vingança: sofri dano deste alvo desde o último turno.
            </label>
          )}
          {needsMovement && (
            <label>
              {has("C10") && inscription.counterTimeMode === "charge"
                ? "C10 - Investida: deslocamento antes do ataque (mínimo 4m)"
                : "C11 - Deslocamento antes do ataque (mínimo 3m, ou posição superior)"}
              <input
                type="number"
                min={0}
                max={99999}
                value={context.movedDistance}
                onChange={(event) =>
                  setContext((value) => ({
                    ...value,
                    movedDistance: event.target.value,
                  }))
                }
              />
            </label>
          )}
          {modern && has("C11") && (
            <label>
              <input
                type="checkbox"
                checked={context.higherGround}
                onChange={(event) =>
                  setContext((value) => ({
                    ...value,
                    higherGround: event.target.checked,
                  }))
                }
              />
              C11 - Ataque desferido de posição vertical superior.
            </label>
          )}
          {modern && has("C12") && (
            <label>
              <input
                type="checkbox"
                checked={context.elementalOrArcane}
                onChange={(event) =>
                  setContext((value) => ({
                    ...value,
                    elementalOrArcane: event.target.checked,
                  }))
                }
              />
              C12 - Ataque básico revestido por dano elemental ou foco arcano.
            </label>
          )}
          {modern && has("C15") && (
            <label>
              C15 - Dano efetivo após armadura e barreiras (0 impede a marca)
              <input
                type="number"
                min={0}
                max={99999}
                value={context.effectiveDamage}
                onChange={(event) =>
                  setContext((value) => ({
                    ...value,
                    effectiveDamage: event.target.value,
                  }))
                }
              />
            </label>
          )}
          {modern && has("C16") && (
            <label>
              C16 - Aliados do portador a até 3m do alvo (mínimo 2)
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                value={context.nearbyAllies}
                onChange={(event) =>
                  setContext((value) => ({
                    ...value,
                    nearbyAllies: event.target.value,
                  }))
                }
              />
            </label>
          )}
          {modern && has("C18") && (
            <label>
              C18 - Presença do alvo (precisa ser igual ou maior que{" "}
              {profile.presence})
              <input
                type="number"
                min={0}
                max={99999}
                step={1}
                value={context.targetPresence}
                onChange={(event) =>
                  setContext((value) => ({
                    ...value,
                    targetPresence: event.target.value,
                  }))
                }
              />
            </label>
          )}
          {modern && has("C19") && (
            <label>
              <input
                type="checkbox"
                checked={context.allyDamagedTarget}
                onChange={(event) =>
                  setContext((value) => ({
                    ...value,
                    allyDamagedTarget: event.target.checked,
                  }))
                }
              />
              C19 - Outro aliado do portador causou dano a este alvo nesta
              rodada.
            </label>
          )}
          {modern && has("C20") && (
            <label>
              <input
                type="checkbox"
                checked={context.sheltered}
                onChange={(event) =>
                  setContext((value) => ({
                    ...value,
                    sheltered: event.target.checked,
                  }))
                }
              />
              C20 - Ambiente coberto, subterrâneo ou noturno, sem luz solar
              direta.
            </label>
          )}
        </fieldset>
      )}
      {Number(natural) === 1 && (
        <fieldset disabled={pending}>
          <legend>Fome da arma - CD {profile.hungerDC}</legend>
          <p>
            Role Presença + Controle da Corrupção. Um 1 descartado da reserva
            não aciona a Fome.
          </p>
          <label>
            Resultado do Controle
            <input
              type="number"
              step={1}
              value={control}
              onChange={(event) => setControl(event.target.value)}
            />
          </label>
          {hungerDamage ? (
            <label>
              Resultado de 1d6 Corrupto, se o Controle falhou
              <input
                type="number"
                min={1}
                max={6}
                step={1}
                disabled={!hungerFailed}
                value={hungerDie}
                onChange={(event) => setHungerDie(event.target.value)}
              />
            </label>
          ) : (
            <p>
              Esta gravação anterior aplica +1 Carga Temporária na falha do
              Controle.
            </p>
          )}
        </fieldset>
      )}
      <button
        type="button"
        disabled={
          busy ||
          Boolean(current?.dormant) ||
          !targetId.trim() ||
          !isNumber(natural, 1, 20) ||
          !Number.isInteger(Number(natural)) ||
          !isNumber(distance) ||
          missingContext ||
          invalidHunger
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
              isolated: has("C7") ? isolated : undefined,
              flanked: has("C7") ? flanked : undefined,
              targetDebilitated: has("C9") ? debilitated : undefined,
              movedDistance: needsMovement
                ? numeric(context.movedDistance)
                : undefined,
              higherGround:
                modern && has("C11") ? context.higherGround : undefined,
              targetDamagedBearer:
                modern && has("C10") ? context.targetDamagedBearer : undefined,
              elementalOrArcane:
                modern && has("C12") ? context.elementalOrArcane : undefined,
              effectiveDamage:
                modern && has("C15")
                  ? numeric(context.effectiveDamage)
                  : undefined,
              nearbyAllies:
                modern && has("C16")
                  ? numeric(context.nearbyAllies)
                  : undefined,
              targetPresence:
                modern && has("C18")
                  ? numeric(context.targetPresence)
                  : undefined,
              allyDamagedTarget:
                modern && has("C19") ? context.allyDamagedTarget : undefined,
              sheltered: modern && has("C20") ? context.sheltered : undefined,
              controlTotal:
                Number(natural) === 1 ? numeric(control) : undefined,
              hungerDie:
                Number(natural) === 1 && hungerDamage
                  ? numeric(hungerDie)
                  : undefined,
            },
            "Registrar ataque da arma amaldiçoada",
          )
        }
      >
        Registrar marcas e Fome deste ataque
      </button>
      {!modern && has("C10") && (
        <details className="cursed-rune-reference">
          <summary>Manutenção da inscrição anterior</summary>
          <fieldset disabled={pending}>
            <legend>Alimentação e torpor</legend>
            <p>
              Esta gravação conserva a alimentação com sangue de inimigo
              derrotado nesta cena. Mudar de cena avalia o torpor e encerra as
              marcas; abrir ou fechar o encontro não alimenta a arma.
            </p>
            <p>
              Informe Presença + Controle da Corrupção contra a CD anunciada
              pelo Mestre. Alimentação e supressão só são confirmadas no
              sucesso.
            </p>
            <label>
              CD anunciada pelo Mestre
              <input
                type="number"
                min={0}
                step={1}
                value={ritualDC}
                onChange={(event) => setRitualDC(event.target.value)}
              />
            </label>
            <label>
              Resultado de Presença + Controle
              <input
                type="number"
                step={1}
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
                    onChange={(event) =>
                      setRitualCompleted(event.target.checked)
                    }
                  />
                  Concluí 1 TE (2 horas) de alimentação
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
        </details>
      )}
      {feedback && <p role="status">{feedback}</p>}
      {live.lastActionLog?.inventoryItemId === picked.id && (
        <p>{live.lastActionLog.details}</p>
      )}
    </details>
  );
}
