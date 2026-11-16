import type { CharacterPayload } from "@/lib/character-model";
import type {
  CombatAction,
  CombatLog,
  CursedWeaponState,
  LiveCombatState,
} from "@/lib/combat-types";
import { curseRulesVersion } from "@/lib/cursed-rune-model";
import {
  cursedRuneKey,
  getCursedRuneError,
  getCursedRuneProfile,
} from "@/lib/cursed-runes";
import { damageResistance } from "@/lib/damage-types";
import { availableKarma } from "@/lib/karmic-runes";

/** Only the owner's recorded resources are changed; a victim's effects remain explicit in mesa. */
export function clearCursedCycles(
  draft: CharacterPayload,
  state: LiveCombatState,
  condition: "C3" | "C13",
) {
  const weapons = { ...state.cursedWeapons };
  for (const item of draft.inventory) {
    const rune = item.cursedRune;
    if (
      rune &&
      curseRulesVersion(rune) === 2 &&
      rune.conditionIds.includes(condition) &&
      weapons[item.id]
    )
      weapons[item.id] = { ...weapons[item.id], targets: {} };
  }
  return { ...state, cursedWeapons: weapons };
}

type CursedAction = Extract<
  CombatAction,
  { type: "cursedStrike" | "cursedWeapon" }
>;
type DamageResolver = (
  life: number,
  shield: number,
  amount: number,
  resistance?: number,
  bypass?: boolean,
) => { life: number; shield: number; absorbed: number; damage: number };

export function applyCursedAction(
  draft: CharacterPayload,
  state: LiveCombatState,
  op: CursedAction,
  event: CombatLog,
  maximumLife: number,
  receiveDamage: DamageResolver,
) {
  let s = state;
  let temporaryChargeAdded = false;
  if (["__proto__", "prototype", "constructor"].includes(op.weaponId))
    throw Error("Identificador de arma inválido.");
  const item = draft.inventory.find((entry) => entry.id === op.weaponId);
  const inscription = item?.cursedRune;
  if (!item || !inscription) throw Error("Arma amaldiçoada não encontrada.");
  const error = getCursedRuneError(draft, item, inscription);
  if (error) throw Error(error);
  if (item.quantity < 1 || item.location === "external")
    throw Error("A arma amaldiçoada não está acessível.");
  const profile = getCursedRuneProfile(draft, inscription);
  const version = curseRulesVersion(inscription);
  const key = cursedRuneKey(inscription);
  const previous = s.cursedWeapons?.[item.id];
  const current: CursedWeaponState =
    previous?.runeKey === key
      ? { ...previous, targets: { ...previous.targets } }
      : { runeKey: key, targets: {}, bloodFed: false, dormant: false };
  const has = (id: string) => inscription.conditionIds.includes(id);
  event.kind = "ability";
  event.inventoryItemId = item.id;
  if (op.type === "cursedWeapon") {
    if (
      !Number.isFinite(op.controlTotal) ||
      !Number.isFinite(op.ritualDC) ||
      op.ritualDC! < 0
    )
      throw Error(
        "Informe a CD anunciada pelo Mestre e o resultado de Presença + Controle da Corrupção para interagir com a maldição.",
      );
    if (op.operation === "wake" && !op.ritualCompleted)
      throw Error("Confirme 1 TE de alimentação antes de despertar a arma.");
    if (op.operation === "feed" && version === 2)
      throw Error(
        "A nova matriz não usa o antigo ritual de manutenção de C10.",
      );
    if (op.controlTotal! < op.ritualDC!) {
      event.details = `Controle ${op.controlTotal} contra CD ${op.ritualDC}: falha; a alimentação ou supressão não foi confirmada e o estado da maldição permanece.`;
    } else if (op.operation === "feed") {
      current.bloodFed = true;
      event.details =
        "Sangue de um inimigo derrotado confirmado nesta cena. A alimentação não resolve o ritual de despertar de uma arma já em torpor.";
    } else if (op.operation === "torpor") {
      current.dormant = true;
      current.targets = {};
      event.details =
        "Torpor registrado; marcas encerradas. Complete 1 TE de alimentação e o Controle anunciado para despertar a arma.";
    } else {
      if (!current.dormant) throw Error("Esta arma não está em torpor.");
      current.dormant = false;
      current.bloodFed = true;
      event.details = `Ritual de 1 TE concluído: Controle ${op.controlTotal} contra CD ${op.ritualDC}; arma desperta.`;
    }
  } else {
    if (!item.equipped && item.location !== "ready")
      throw Error("Equipe a arma ou coloque-a em Prontidão antes do ataque.");
    if (current.dormant)
      throw Error(
        "A maldição está em torpor; desperte-a antes de registrar marcas.",
      );
    if (
      !op.targetId.trim() ||
      op.targetId.length > 120 ||
      ["__proto__", "constructor", "prototype"].includes(op.targetId) ||
      !Number.isFinite(op.distance) ||
      op.distance < 0
    )
      throw Error("Informe o alvo e uma distância válida.");
    if (
      !Number.isInteger(op.selectedNatural) ||
      op.selectedNatural! < 1 ||
      op.selectedNatural! > 20
    )
      throw Error("Informe o d20 natural selecionado do ataque, de 1 a 20.");
    current.combatScene = true;
    let hunger = "";
    if (op.selectedNatural === 1) {
      if (!Number.isFinite(op.controlTotal))
        throw Error(
          "Falha Crítica: informe Presença + Controle da Corrupção contra a Fome.",
        );
      if (op.controlTotal! < profile.hungerDC) {
        if (version === 1 && inscription.hungerPenalty === "temporaryCharge") {
          temporaryChargeAdded = true;
          hunger = `Fome CD ${profile.hungerDC}: falha; +1 Carga Temporária de Corrupção. `;
        } else {
          if (
            !Number.isInteger(op.hungerDie) ||
            op.hungerDie! < 1 ||
            op.hungerDie! > 6
          )
            throw Error("Informe o resultado de 1d6 da mordida da arma.");
          const resistance = damageResistance(draft, "Corrupto");
          const damage = receiveDamage(
            s.currentLife,
            s.tempShield,
            op.hungerDie!,
            resistance,
          );
          s = { ...s, currentLife: damage.life, tempShield: damage.shield };
          if (damage.damage > 0) {
            s = clearCursedCycles(draft, s, "C13");
            if (version === 2 && has("C13")) current.targets = {};
          }
          hunger = `Fome CD ${profile.hungerDC}: falha; ${op.hungerDie} Corrupto − ${resistance} Resistência; ${damage.absorbed} no escudo e ${damage.damage} na Vida. `;
        }
      } else hunger = `Fome CD ${profile.hungerDC}: Controle bem-sucedido. `;
    }
    if (
      version === 2 &&
      has("C6") &&
      current.lastTargetId &&
      current.lastTargetId !== op.targetId
    )
      current.targets = {};
    current.lastTargetId = op.targetId;
    if (op.outcome === "Falha") {
      if (has("C6")) current.targets = {};
      event.details =
        hunger +
        (has("C6")
          ? "Fome Intacta: a Falha apagou todas as marcas desta arma, em todos os alvos."
          : "Ataque falhou; nenhuma marca acrescentada.");
    } else {
      const unmet: string[] = [];
      if (
        has("C1") &&
        (op.vector !== "melee" || (version === 2 && op.distance > 3))
      )
        unmet.push("C1: contato a até 3m");
      if (has("C2") && (op.vector !== "ranged" || op.distance < 9))
        unmet.push("C2: disparo a 9m ou mais");
      if (
        has("C7") &&
        !(inscription.isolationMode === "flanked"
          ? op.flanked === true
          : op.isolated === true)
      )
        unmet.push("C7: posição da presa");
      if (version === 2) {
        if (has("C3") && s.cursedTurnClosed) unmet.push("C3: turno encerrado");
        if (
          has("C10") &&
          !(inscription.counterTimeMode === "charge"
            ? Number.isFinite(op.movedDistance) && op.movedDistance! >= 4
            : op.targetDamagedBearer === true)
        )
          unmet.push("C10: Vingança ou Investida");
        if (
          has("C11") &&
          !(
            (Number.isFinite(op.movedDistance) && op.movedDistance! >= 3) ||
            op.higherGround === true
          )
        )
          unmet.push("C11: investida ou altura superior");
        if (has("C12") && op.elementalOrArcane !== true)
          unmet.push("C12: revestimento elemental ou foco arcano");
        if (has("C14") && op.outcome !== "Acerto parcial")
          unmet.push("C14: apenas Acerto Parcial");
        if (
          has("C15") &&
          !(Number.isFinite(op.effectiveDamage) && op.effectiveDamage! > 0)
        )
          unmet.push("C15: dano líquido positivo");
        if (
          has("C16") &&
          !(Number.isInteger(op.nearbyAllies) && op.nearbyAllies! >= 2)
        )
          unmet.push("C16: dois aliados a até 3m");
        if (
          has("C18") &&
          !(
            Number.isFinite(op.targetPresence) &&
            op.targetPresence! >= profile.presence
          )
        )
          unmet.push("C18: Presença do alvo");
        if (has("C19") && op.allyDamagedTarget !== true)
          unmet.push("C19: dano de outro aliado nesta rodada");
        if (has("C20") && op.sheltered !== true)
          unmet.push("C20: sem luz solar direta");
      }
      if (unmet.length)
        event.details =
          hunger +
          `Requisitos não cumpridos (${unmet.join("; ")}); nenhuma marca acrescentada.`;
      else {
        const oldTarget = Object.hasOwn(current.targets, op.targetId)
          ? current.targets[op.targetId]
          : { marks: 0, hasTotal: false };
        const needed =
          version === 2 && has("C13") ? 4 : has("C4") ? 3 : has("C3") ? 2 : 1;
        const target = {
          marks: Math.min(needed, oldTarget.marks + 1),
          hasTotal: oldTarget.hasTotal || op.outcome === "Acerto total",
        };
        const victimValid = !has("C9") || op.targetDebilitated === true;
        const tribute = has("C8")
          ? version === 2
            ? 4
            : inscription.tributeMode === "wounded"
              ? 0
              : 3
          : 0;
        const tributeValid =
          !has("C8") ||
          (version === 2
            ? s.currentLife < maximumLife && s.currentLife >= tribute
            : inscription.tributeMode === "wounded"
              ? s.currentLife < maximumLife / 2
              : s.currentLife >= tribute);
        const toll = version === 2 && has("C17") ? 2 : 0;
        const karmaValid = availableKarma(s) >= toll;
        if (
          target.marks >= needed &&
          victimValid &&
          tributeValid &&
          karmaValid
        ) {
          // The cycle has already been validated. Its own tribute cannot undo its closure.
          delete current.targets[op.targetId];
          s = {
            ...s,
            currentLife: s.currentLife - tribute,
            currentKarma: s.currentKarma - toll,
          };
          if (tribute > 0) {
            s = clearCursedCycles(draft, s, "C13");
            if (version === 2 && has("C13")) current.targets = {};
          }
          const stateAllowed = has("C5")
            ? target.hasTotal
            : op.outcome === "Acerto total";
          event.details =
            hunger +
            `${profile.effect!.name}: ${needed} marca(s), despertar com ${profile.damage} Corrupto; CD de resistência/escape ${profile.escapeDC}. ${stateAllowed ? "Requisito de Acerto Total para o estado cumprido." : "Sem requisito de Acerto Total: o estado não se aplica."} ${tribute ? `Tributo: ${tribute} Vida irreduzíveis pagos. ` : ""}${toll ? "Pedágio: 2 Karma pagos. " : ""}Resolva o dano, alvos adicionais e efeitos da fórmula em mesa; este registro não reaplica o dano da arma nem os estados.`;
        } else {
          if (
            !Object.hasOwn(current.targets, op.targetId) &&
            Object.keys(current.targets).length >= 100
          )
            throw Error(
              "Limite de cem alvos com marcas atingido nesta arma; encerre marcas antes de registrar outro alvo.",
            );
          current.targets[op.targetId] = target;
          event.details =
            hunger +
            `${profile.effect!.name}: ${target.marks}/${needed} marcas em ${op.targetId}; ${target.hasTotal ? "há Acerto Total na sequência" : "sequência sem Acerto Total"}.${!victimValid ? " Aguarda alvo debilitado (condição negativa ou Vida até 50%)." : ""}${!tributeValid ? " Aguarda tributo válido do portador." : ""}${!karmaValid ? " Aguarda 2 Karma livres para o Pedágio." : ""}`;
        }
      }
    }
  }
  return {
    state: { ...s, cursedWeapons: { ...s.cursedWeapons, [item.id]: current } },
    temporaryChargeAdded,
  };
}
