import {
  ALL_SKILLS,
  type AttributeName,
  type CharacterPayload,
} from "@/lib/character-data";
import {
  calculateAutomaticBonuses,
  calculateDerivedStats,
  defaultApproach,
  getFinalAttribute,
  getStageIndex as getFinalRacialStage,
  getFinalSkill,
  getSkillTest,
  initiativeTest,
} from "@/lib/character-rules";
import type {
  CombatAction,
  CombatLog,
  LiveCombatState,
} from "@/lib/combat-types";
import { visualFromRoll } from "@/lib/combat-visuals";
import { corruptedFormState, corruptionControlDC } from "@/lib/corrupted-form";
import { rollDiceExpression } from "@/lib/dice-expression";
import { blessingGrants } from "@/lib/divine-blessings";
import { calculateInvocationStats } from "@/lib/invocation-rules";
import {
  availableKarma,
  karmicRunes,
  runeInscriptionAction,
  runeInscriptionError,
} from "@/lib/karmic-runes";
import { hasAwakenedPath, hasAxiom } from "@/lib/personal-path";
import {
  conditionForAttack,
  domainActivation,
  resolveRoll,
} from "@/lib/table-play";
import {
  calculateElementalDefense,
  CORRUPT_CONTROL_BASE,
  corruptionMatrixRisk,
  techniqueGradeIndex,
} from "@/lib/technique-matrices";
export const clamp = (n: number, max = 99999) =>
  Math.max(0, Math.min(max, Math.floor(n)));
export function characterMax(draft: CharacterPayload) {
  return calculateDerivedStats(draft, calculateAutomaticBonuses(draft));
}
export function impetusLimit(draft: CharacterPayload) {
  const stage = getFinalRacialStage(draft.stage);
  return draft.race !== "Humano" ? 0 : stage >= 6 ? 4 : stage >= 4 ? 3 : 2;
}
export function liveState(draft: CharacterPayload): LiveCombatState {
  const max = characterMax(draft),
    old = draft.combat,
    s = draft.combatState;
  return {
    runes: s?.runes ?? [],
    runeBurstUsed: s?.runeBurstUsed ?? false,
    impetus: clamp(
      s?.impetus ?? Math.min(2, impetusLimit(draft)),
      impetusLimit(draft),
    ),
    impetusBloodied: s?.impetusBloodied ?? false,
    impetusNaturalRound: s?.impetusNaturalRound,
    summons: s?.summons ?? {},
    bossPhases: s?.bossPhases ?? {},
    inCombat: s?.inCombat ?? false,
    currentLife: clamp(s?.currentLife ?? old?.life ?? max.life, max.life),
    currentKarma: clamp(s?.currentKarma ?? old?.karma ?? max.karma, max.karma),
    tempShield: clamp(s?.tempShield ?? old?.shield ?? 0, 9999),
    activeConditions: s?.activeConditions ?? [],
    conditionRounds: s?.conditionRounds ?? {},
    conditionPotency: s?.conditionPotency ?? {},
    lastActionLog: s?.lastActionLog ?? null,
    combatFeed: (s?.combatFeed ?? []).slice(-25),
    reactions: clamp(s?.reactions ?? 1, 10),
    round: Math.max(1, clamp(s?.round ?? old?.round ?? 1)),
    domainRounds: s?.domainRounds ?? old?.domainRounds ?? {},
  };
}
export function withLiveState(
  draft: CharacterPayload,
  s: LiveCombatState,
): CharacterPayload {
  return {
    ...draft,
    combatState: s,
    combat: {
      life: s.currentLife,
      karma: s.currentKarma,
      shield: s.tempShield,
      round: s.round,
      domainRounds: s.domainRounds,
      temporaryCharges: draft.combat?.temporaryCharges ?? 0,
    },
  };
}
export function mergeCombat(
  remote: CharacterPayload,
  local: CharacterPayload,
  previousInventory?: CharacterPayload["inventory"],
): CharacterPayload {
  const remoteItems = new Map(remote.inventory.map((item) => [item.id, item]));
  const baseline = new Map(previousInventory?.map((item) => [item.id, item]));
  const inventory = local.inventory.map((item) => {
    const synced = remoteItems.get(item.id);
    const previous = baseline.get(item.id);
    return synced &&
      previous &&
      item.quantity === previous.quantity &&
      item.location === previous.location &&
      item.equipped === previous.equipped
      ? {
          ...item,
          quantity: synced.quantity,
          location: synced.location,
          equipped: synced.equipped,
        }
      : item;
  });
  return withLiveState(
    {
      ...local,
      inventory,
      combat: {
        ...local.combat!,
        temporaryCharges: remote.combat?.temporaryCharges ?? 0,
      },
      divine: { ...local.divine, favor: remote.divine.favor },
      alchemicalSaturation: remote.alchemicalSaturation,
      corruption: {
        ...local.corruption,
        charge: remote.corruption.charge,
        formActive: remote.corruption.formActive,
        formTurns: remote.corruption.formTurns,
        formBlocked: remote.corruption.formBlocked,
      },
    },
    liveState(remote),
  );
}
export function parseCombatLink(raw: string) {
  let path = raw.trim();
  if (/^https?:\/\//i.test(path)) {
    const u = new URL(path);
    path = u.pathname;
  }
  const match = path.match(
    /^(?:\/ficha\/)?([a-zA-Z0-9-]{12,80})\/([a-zA-Z0-9-]{12,80})\/?$/,
  );
  if (!match)
    throw new Error("Use o link /ficha/id/token ou o código id/token.");
  return { id: match[1], token: match[2] };
}
export function receiveDamage(
  life: number,
  shield: number,
  amount: number,
  resistance = 0,
  bypass = false,
) {
  const protectedDamage = Math.max(0, clamp(amount) - clamp(resistance));
  const absorbed = bypass ? 0 : Math.min(shield, protectedDamage);
  return {
    life: Math.max(0, life - protectedDamage + absorbed),
    shield: shield - absorbed,
    absorbed,
    damage: protectedDamage - absorbed,
  };
}
export { defaultApproach };
export function randomDice(count: number, sides = 20) {
  count = Math.max(1, Math.min(60, Math.floor(count)));
  const limit = Math.floor(4294967296 / sides) * sides;
  return Array.from({ length: count }, () => {
    const a = new Uint32Array(1);
    do {
      crypto.getRandomValues(a);
    } while (a[0] >= limit);
    return (a[0] % sides) + 1;
  });
}
export function rollInitiative(
  agility: number,
  specificBonus = 0,
  diceSource = randomDice,
  specificDice = 0,
) {
  const test = initiativeTest(agility, specificBonus, specificDice);
  const dice = diceSource(test.dice, 20);
  return { ...test, ...resolveRoll(dice, test.bonus), dice };
}

export function rollPathAwakening(
  draft: CharacterPayload,
  attribute: AttributeName,
  diceSource = randomDice,
) {
  if (getFinalRacialStage(draft.stage) < 3)
    throw Error("O despertar exige Etapa III ou superior.");
  const automatic = calculateAutomaticBonuses(draft);
  const value = getFinalAttribute(draft, automatic, attribute);
  const blessed =
    draft.divine.enabled &&
    blessingGrants(draft.divine).some((grant) => grant.name.trim());
  const pool = Math.max(1, Math.ceil(value / 2)) - Number(blessed);
  const level = getFinalSkill(draft, automatic, "Canalização de Karma");
  const bonus =
    (value === 0 && level === 0 ? -4 : ([0, 2, 5, 10][level] ?? 0)) +
    (draft.personalPath.failedAttempts ?? 0);
  const dice = diceSource(pool < 1 ? 2 : pool, 20);
  const dc = blessed ? 24 : 20;
  return {
    ...resolveRoll(dice, bonus, dc, "CD", pool < 1 ? "menor" : "maior"),
    dice,
    bonus,
    dc,
  };
}

export function skillRoll(
  draft: CharacterPayload,
  skill: string,
  approach?: AttributeName,
  circumstance: -1 | 0 | 1 = 0,
  purpose?: "technique",
  diceSource = randomDice,
  extraBonus = 0,
  extraDice = 0,
  impetus = false,
) {
  if (!ALL_SKILLS.some((s) => s === skill))
    throw new Error("Perícia desconhecida.");
  if (impetus && (!impetusLimit(draft) || !(liveState(draft).impetus ?? 0)))
    throw Error("Ímpeto indisponível para este teste.");
  extraDice += Number(impetus);
  extraBonus += impetus ? 2 : 0;
  const test = getSkillTest(
    draft,
    calculateAutomaticBonuses(draft),
    skill,
    approach ?? defaultApproach(skill),
    undefined,
    purpose,
  );
  const penalties = test.inventoryPenalty.dicePenalty,
    raw = test.baseDice + circumstance - penalties + extraDice;
  const worst = raw <= 0,
    count = worst ? 2 : Math.min(30, raw),
    dice = diceSource(count, 20);
  const result = resolveRoll(
    dice,
    test.bonus + extraBonus,
    undefined,
    "CD",
    worst ? "menor" : "maior",
  );
  return {
    ...result,
    dice,
    selection: worst ? ("menor" as const) : ("maior" as const),
    formula: `${worst ? "menor" : "maior"} de ${count}d20 ${test.bonus + extraBonus >= 0 ? "+" : ""}${test.bonus + extraBonus}`,
    test,
  };
}
export function damageDice(
  text: string,
  critical = false,
  diceSource = randomDice,
) {
  return rollDiceExpression(text, critical, diceSource);
}
export function fixedCost(text: string): number | null {
  if (/^\s*(?:0|gratuit[ao]|passiv[ao])(?:\s*Karma)?\s*$/i.test(text)) return 0;
  const m =
    text.match(/^\s*(\d+)\s*(?:de\s+)?Karma(?:\s*(?:de Geppeto|[.;,]|$))/i) ??
    text.match(/^\s*(\d+)\s*$/);
  return m ? Number(m[1]) : null;
}
export function registeredTechniqueCost(
  technique: CharacterPayload["techniques"][number],
) {
  const base = fixedCost(technique.cost ?? "");
  if (base === null) return null;
  const fixedReduction = (technique.limits ?? "")
    .split(/\r?\n/)
    .map((line) =>
      line.match(
        /^\s*(?:Redução fixa:?\s*)?[−-]\s*(\d+)\s*(?:de\s+)?Karma[.!]?\s*$/i,
      ),
    )
    .find(Boolean);
  const reduction = Math.min(
    Math.max(0, base - 1),
    Number(fixedReduction?.[1] ?? 0),
  );
  return { base, reduction, total: base - reduction };
}

function invocationMaintenance(
  draft: CharacterPayload,
  invocation: CharacterPayload["invocations"][number],
  firstId?: string,
) {
  const base =
    calculateInvocationStats(invocation).maintenance +
    Number(invocation.id !== firstId);
  return hasAxiom(draft, 7) && base > 0 ? Math.max(1, base - 1) : base;
}

export function applyCombatAction(
  draft: CharacterPayload,
  op: CombatAction,
  timestamp = new Date().toISOString(),
): CharacterPayload {
  let s = liveState(draft);
  const next = { ...draft };
  const max = characterMax(draft);
  if (s.combatFeed.some((e) => e.id === op.id)) return draft;
  const before = s.currentLife,
    karmaBefore = s.currentKarma,
    shieldBefore = s.tempShield;
  const event: CombatLog = {
    id: op.id,
    timestamp,
    actorName: op.actorName,
    title: op.title,
    kind: "resource",
  };
  if (op.type === "damage") {
    const resistance =
      op.incomingElement && op.primaryDefenses
        ? calculateElementalDefense(op.primaryDefenses, op.incomingElement)
        : op.resistance;
    const r = receiveDamage(
      s.currentLife,
      s.tempShield,
      op.amount,
      resistance,
      op.bypassShield,
    );
    s = { ...s, currentLife: r.life, tempShield: r.shield };
    event.kind = "damage";
    event.details = `${op.amount} bruto − ${resistance} Resistência; ${r.absorbed} no escudo; ${r.damage} na Vida.`;
  }
  if (op.type === "summon") {
    const invocation = draft.invocations.find((i) => i.id === op.invocationId);
    if (!invocation) throw Error("Invocação não registrada.");
    const stats = calculateInvocationStats(invocation),
      current = s.summons?.[invocation.id] ?? {
        life: stats.life,
        active: false,
      };
    const active = draft.invocations.filter(
      (entry) => s.summons?.[entry.id]?.active,
    );
    const nextRound = Math.min(99999, s.round + 1);
    if (op.operation === "explore" && (s.inCombat || !current.active))
      throw Error(
        "A taxa de exploração exige uma invocação ativa fora de combate.",
      );
    if (op.operation === "explore" && current.explorationPaid) return draft;
    if (op.operation === "repair" && (s.inCombat || current.active))
      throw Error("Repare a invocação recolhida fora de combate.");
    const fractures = current.fractures ?? invocation.fractures;
    if (op.operation === "repair" && fractures === 0)
      throw Error("A invocação não tem Fraturas registradas.");
    if (op.operation === "call" && fractures >= 3)
      throw Error(
        "Colapso Estrutural: conclua o reparo em oficina antes de chamar.",
      );
    const cost =
      op.operation === "call"
        ? stats.callCost + Number(active.length > 0)
        : op.operation === "maintain"
          ? invocationMaintenance(draft, invocation, active[0]?.id)
          : op.operation === "explore"
            ? invocationMaintenance(draft, invocation, invocation.id)
            : 0;
    if (
      op.operation === "maintain" &&
      (current.maintainedThroughRound ?? 0) >= nextRound
    )
      throw Error("Manutenção da próxima rodada já paga.");
    if (op.operation === "maintain" && (!s.inCombat || !current.active))
      throw Error(
        "A manutenção por rodada exige combate e uma invocação ativa.",
      );
    if (op.operation === "call" && current.active)
      throw Error("Invocação já ativa.");
    if (op.operation === "call") {
      const level = getFinalSkill(
          draft,
          calculateAutomaticBonuses(draft),
          "Conjuração",
        ),
        grade = ["I", "II", "III", "IV", "V"].indexOf(invocation.grade) + 1,
        stage = getFinalRacialStage(draft.stage),
        maxGrade = stage >= 7 ? 5 : stage >= 5 ? 4 : stage >= 3 ? 3 : 2;
      if (level < 1 || grade > maxGrade)
        throw Error(
          "Treinamento ou Etapa insuficientes para chamar esta criatura.",
        );
      const sum = active.reduce(
        (v, i) => v + ["I", "II", "III", "IV", "V"].indexOf(i.grade) + 1,
        0,
      );
      if (active.length >= level * 2 || sum + grade > level * 4)
        throw Error("Capacidade de presenças ou soma de Graus excedida.");
    }
    if (availableKarma(s) < cost) throw Error("Karma insuficiente.");
    s.currentKarma -= cost;
    const unit = { ...current };
    if (op.operation === "call") {
      unit.active = true;
      unit.maintainedThroughRound = s.round;
      if (unit.life <= 0)
        throw Error(
          "Restaure a criatura pelos procedimentos de reparação antes de chamar.",
        );
    }
    if (op.operation === "dismiss") unit.active = false;
    if (op.operation === "maintain") unit.maintainedThroughRound = nextRound;
    if (op.operation === "explore") unit.explorationPaid = true;
    if (op.operation === "repair") {
      unit.fractures = 0;
      unit.life = stats.life;
    }
    if (op.operation === "life") {
      unit.life = clamp(unit.life + (op.delta ?? 0), stats.life);
      if (current.active && current.life > 0 && unit.life === 0) {
        unit.active = false;
        unit.fractures = clamp(fractures + 1, 3);
      }
    }
    s.summons = { ...s.summons, [invocation.id]: unit };
    event.kind = "ability";
    event.details = `${invocation.name}: ${unit.life}/${stats.life} Vida · ${cost} Karma · ${unit.active ? "ativa" : "recolhida"} · ${unit.fractures ?? fractures}/3 Fraturas${op.operation === "repair" ? " · Reparo registrado após 1 TE, Criação CD 14 e 2 M$ em peças." : ""}`;
  }
  if (op.type === "inventoryUse") {
    const item = draft.inventory.find((entry) => entry.id === op.itemId);
    if (!item) throw Error("Item não registrado.");
    const consumed = op.consume ?? 0;
    if (!Number.isInteger(consumed) || consumed < 0)
      throw Error("Consumo inválido.");
    const quantity = item.quantity - consumed;
    if (quantity < 0) throw Error("Quantidade insuficiente.");
    const location = op.location ?? item.location;
    const equipped =
      quantity > 0 && location !== "external" && (op.equipped ?? item.equipped);
    next.inventory = draft.inventory.map((entry) =>
      entry.id === item.id ? { ...entry, quantity, location, equipped } : entry,
    );
    event.inventoryItemId = item.id;
    event.details = `${item.name}: ${quantity} unidade(s)${equipped ? " · equipado" : ""}.`;
  }
  if (op.type === "heal") {
    s.currentLife = Math.min(max.life, s.currentLife + op.amount);
    event.kind = "heal";
  }
  if (op.type === "resource") {
    if (op.resource === "life")
      s.currentLife = clamp(s.currentLife + op.delta, max.life);
    if (op.resource === "karma") {
      if (op.delta < 0 && availableKarma(s) + op.delta < 0)
        throw Error("Karma insuficiente.");
      s.currentKarma = clamp(s.currentKarma + op.delta, max.karma);
    }
    if (op.resource === "shield")
      s.tempShield = clamp(s.tempShield + op.delta, 9999);
    if (op.resource === "reactions")
      s.reactions = clamp(s.reactions + op.delta, 10);
    if (op.resource === "favor") {
      if (!draft.divine.enabled) throw Error("Poder Divino não está ativo.");
      next.divine = {
        ...draft.divine,
        favor: clamp(draft.divine.favor + op.delta, 3),
      };
    }
    if (op.resource === "saturation")
      next.alchemicalSaturation = clamp(
        (draft.alchemicalSaturation ?? 0) + op.delta,
        999,
      );
    if (op.resource === "charge")
      next.corruption = {
        ...draft.corruption,
        charge: clamp(draft.corruption.charge + op.delta, 10),
      };
    event.details = `${op.resource}: ${op.delta >= 0 ? "+" : ""}${op.delta}`;
  }
  if (op.type === "indomitableSurvival") {
    const stage = getFinalRacialStage(draft.stage);
    if (draft.race !== "Humano" || stage < 4 || !s.impetus || !s.reactions)
      throw Error(
        "Sobrevivência Indomável exige Humano na Etapa IV, 1 Ímpeto e uma Reação.",
      );
    const automatic = calculateAutomaticBonuses(draft);
    const shield =
      getFinalAttribute(draft, automatic, "Constituição") +
      Math.max(
        getFinalAttribute(draft, automatic, "Presença"),
        getFinalAttribute(draft, automatic, "Espírito"),
      ) +
      stage;
    s.impetus -= 1;
    s.reactions -= 1;
    s.tempShield = clamp(Math.max(s.tempShield, shield), 9999);
    event.kind = "ability";
    event.details = `Escudo Temporário ${shield}. Ignore as penalidades de uma condição física ou mental até o fim do próximo turno.`;
  }
  if (op.type === "condition") {
    const applied =
      !op.remove && op.attackOutcome
        ? conditionForAttack(
            op.condition,
            op.attackOutcome,
            op.rounds,
            op.potency,
          )
        : { rounds: op.rounds, potency: op.potency };
    if (!applied) return draft;
    if (applied.potency !== undefined)
      event.details = `${op.condition} · Potência ${applied.potency}`;
    s.activeConditions = op.remove
      ? s.activeConditions.filter((c) => c !== op.condition)
      : [...new Set([...s.activeConditions, op.condition])].slice(0, 20);
    s.conditionRounds = Object.fromEntries(
      Object.entries(s.conditionRounds ?? {}).filter(
        ([name]) => name !== op.condition,
      ),
    );
    s.conditionPotency = Object.fromEntries(
      Object.entries(s.conditionPotency ?? {}).filter(
        ([name]) => name !== op.condition,
      ),
    );
    if (
      applied.potency !== undefined &&
      !op.remove &&
      s.activeConditions.includes(op.condition)
    ) {
      s.conditionPotency = {
        ...s.conditionPotency,
        [op.condition]: applied.potency,
      };
    }
    if (
      applied.rounds &&
      !op.remove &&
      s.activeConditions.includes(op.condition)
    ) {
      s.conditionRounds = {
        ...s.conditionRounds,
        [op.condition]: applied.rounds,
      };
    }
  }
  if (op.type === "toggle") s.inCombat = op.active;
  if (op.type === "execute") {
    let riskText = "";
    if (op.impetus) {
      if (!impetusLimit(draft) || !(s.impetus ?? 0) || !op.diceResults?.length)
        throw Error("Ímpeto indisponível para este teste.");
      s.impetus = (s.impetus ?? 0) - 1;
      riskText = "1 Ímpeto gasto. ";
      if (
        getFinalRacialStage(draft.stage) >= 2 &&
        (op.kind === "attack" || op.kind === "technique")
      )
        riskText +=
          "Leitura de Brecha: próximo ataque aliado contra o alvo reduz em 2 ambos os limiares de acerto. ";
    }
    if (
      impetusLimit(draft) &&
      s.impetusNaturalRound !== s.round &&
      (op.kind === "attack" ||
        op.kind === "technique" ||
        op.kind === "skill") &&
      op.title !== "Iniciativa" &&
      op.diceResults?.length &&
      op.diceResults.every((die) => die <= 20) &&
      (op.selection === "menor"
        ? Math.min(...op.diceResults)
        : Math.max(...op.diceResults)) === 20
    ) {
      const gained = (s.impetus ?? 0) < impetusLimit(draft);
      if (gained) s.impetusNaturalRound = s.round;
      s.impetus = clamp((s.impetus ?? 0) + 1, impetusLimit(draft));
      riskText += gained
        ? "20 natural · Inconformismo: +1 Ímpeto. "
        : "20 natural · Ímpeto no limite. ";
    }

    if (op.techniqueId) {
      const art = draft.techniques.find((t) => t.id === op.techniqueId);
      if (!art) throw Error("Técnica não registrada.");
      const grade = techniqueGradeIndex(art.grade);
      if (art.matrix === "Divino" && grade >= 3) {
        if (draft.divine.favor < 1)
          throw Error("Esta técnica exige 1 Favor Divino.");
        next.divine = { ...draft.divine, favor: draft.divine.favor - 1 };
        riskText += "1 Favor Divino consumido. ";
      }
      if (art.matrix === "Corrupto" && grade >= 0) {
        if (!draft.corruption.enabled)
          throw Error("A matriz Corrupta exige a Marca.");
        const natural = op.diceResults?.length
          ? op.selection === "menor"
            ? Math.min(...op.diceResults)
            : Math.max(...op.diceResults)
          : 0;
        if (grade <= 1 && op.succeeded === undefined)
          throw Error(
            "Registre o resultado do ataque antes de resolver a técnica.",
          );
        const risk = corruptionMatrixRisk(grade, op.succeeded ?? true, natural);
        next.corruption = {
          ...draft.corruption,
          charge: clamp(draft.corruption.charge + risk.charge, 10),
        };
        next.combat = {
          ...draft.combat!,
          temporaryCharges: clamp(
            (draft.combat?.temporaryCharges ?? 0) + risk.temporary,
            10,
          ),
        };
        s.currentLife = clamp(s.currentLife - risk.life, max.life);
        const dc = corruptionControlDC(next, CORRUPT_CONTROL_BASE);
        riskText += `Risco da matriz: +${risk.temporary} temporárias, +${risk.charge} efetiva, ${risk.life} Vida. ${next.corruption.charge === 10 ? "Ruptura: Controle CD 24." : risk.immediateControl ? `Faça um Controle imediato CD ${dc}${risk.disadvantage ? " com Desvantagem" : ""}.` : risk.endOfTurnControl ? `Faça um Controle CD ${dc} no fim do turno.` : "O desgaste já foi aplicado."} `;
      }
    }
    let cost = op.cost;
    if (op.invocationId) {
      const invocation = draft.invocations.find(
        (entry) => entry.id === op.invocationId,
      );
      const unit = s.summons?.[op.invocationId];
      if (!invocation || !unit?.active)
        throw Error("Chame a invocação antes de comandar.");
      if (op.kind === "ability" && invocation.ability.karma !== undefined)
        cost = invocation.ability.karma;
      if (!s.inCombat && !unit.explorationPaid) {
        const fee = invocationMaintenance(draft, invocation, invocation.id);
        cost += fee;
        riskText += `Taxa de exploração da cena: ${fee} Karma. `;
        s.summons = {
          ...s.summons,
          [invocation.id]: { ...unit, explorationPaid: true },
        };
      }
    }
    if (availableKarma(s) < cost) throw Error("Karma insuficiente.");
    s.currentKarma -= cost;
    Object.assign(event, {
      kind: op.kind,
      karmaSpent: cost,
      rollFormula: op.rollFormula,
      diceResults: op.diceResults,
      total: op.total,
      details:
        `${riskText}${op.details ?? ""} Karma restante: ${s.currentKarma}/${max.karma}.`.trim(),
    });
  }
  if (op.type === "execute" || op.type === "spectacle")
    event.visual = visualFromRoll(
      op.rollFormula,
      op.diceResults,
      op.total,
      op.selection,
    );
  if (op.type === "spectacle")
    Object.assign(event, {
      kind: "attack",
      rollFormula: op.rollFormula,
      diceResults: op.diceResults,
      total: op.total,
      details: op.details,
    });
  if (op.type === "phase") {
    const known = s.bossPhases?.[op.phase.bossKey];
    if (
      known &&
      (known.order > op.phase.order ||
        (known.order === op.phase.order && !known.pending && op.phase.pending))
    )
      return draft;
    const entries = Object.entries({
      ...s.bossPhases,
      [op.phase.bossKey]: op.phase,
    }).slice(-20);
    s.bossPhases = Object.fromEntries(entries);
    event.kind = "ability";
    event.visual = op.phase;
    event.details = op.phase.defense;
  }
  if (op.type === "armRune") {
    const rune = karmicRunes.find((entry) => entry.id === op.runeId);
    if (!rune) throw Error("Runa desconhecida.");
    const inscriptions = s.runes ?? [];
    const error = runeInscriptionError(draft, s, rune, op.weaponId);
    if (error) throw Error(error);
    s.runes = [
      ...inscriptions,
      { id: op.id, runeId: rune.id, weaponId: op.weaponId },
    ];
    event.kind = "ability";
    event.details = `${runeInscriptionAction(draft, rune)} · ${rune.retained} Karma retidos. ${rune.passive}`;
  }
  if (op.type === "burstRune") {
    const inscription = s.runes?.find(
      (entry) => entry.id === op.inscriptionId && !entry.spent,
    );
    const rune = karmicRunes.find((entry) => entry.id === inscription?.runeId);
    if (!inscription || !rune) throw Error("Runa armada não encontrada.");
    const releaseRound =
      draft.className === "Escriba Kármico"
        ? Math.min(99999, s.round + 1)
        : undefined;
    s.runes = s.runes?.map((entry) =>
      entry.id === inscription.id
        ? { ...entry, spent: true, releaseRound }
        : entry,
    );
    const circuit = !op.disarm && hasAxiom(draft, 5) && !s.runeBurstUsed;
    if (circuit) s.currentKarma = Math.min(max.karma, s.currentKarma + 3);
    if (!op.disarm) s.runeBurstUsed = true;
    event.kind = "ability";
    event.details = `${op.disarm ? "Runa desarmada sem ativar o Estouro. O Karma retorna no prazo normal." : rune.burst}${circuit ? " Circuito Rúnico Autônomo: +2 na CD ou no acerto e recuperação de até 3 Karma." : ""}`;
  }
  if (op.type === "domain") {
    const d = draft.domains.find(
      (d) => d.name === op.name && d.enabled && d.awakened,
    );
    if (!d) throw Error("Domínio não despertado.");
    if (Object.hasOwn(s.domainRounds, op.name))
      throw Error("Domínio já manifestado nesta cena.");
    const activation = domainActivation(d, hasAwakenedPath(draft));
    if (availableKarma(s) < activation.cost) throw Error("Karma insuficiente.");
    s.currentKarma -= activation.cost;
    s.domainRounds = { ...s.domainRounds, [op.name]: activation.rounds };
    event.karmaSpent = activation.cost;
    event.kind = "ability";
  }
  if (op.type === "barrier") {
    if (
      getFinalSkill(
        draft,
        calculateAutomaticBonuses(draft),
        "Canalização de Karma",
      ) < 1
    )
      throw Error("Barreira exige Canalização de Karma 1.");
    const cost = op.reinforced ? 5 : 3,
      bonus = op.reinforced ? 4 : 2;
    if (availableKarma(s) < cost) throw Error("Karma insuficiente.");
    if (s.reactions < 1) throw Error("Reação indisponível.");
    s.currentKarma -= cost;
    s.reactions -= 1;
    event.kind = "ability";
    event.karmaSpent = cost;
    event.details = `Barreira Kármica: +${bonus} CA apenas nesta incidência; CA pessoal de referência ${max.armor + bonus}. Compare antes do dano. Não inclui Esquiva/Bloqueio; contra aliado use a CA dele. A CA permanente não muda.`;
  }
  if (op.type === "form") {
    if (op.active) {
      const form = corruptedFormState(
        draft,
        getFinalSkill(
          draft,
          calculateAutomaticBonuses(draft),
          "Controle da Corrupção",
        ),
      );
      if (form.issues.length || !form.selected.length)
        throw Error(
          form.issues[0] ?? "Registre as mutações da Forma na ficha.",
        );
      if (draft.corruption.formActive) throw Error("Mutações já ativas.");
      if (availableKarma(s) < 6) throw Error("Karma insuficiente.");
      s.currentKarma -= 6;
      event.karmaSpent = 6;
    }
    next.corruption = { ...draft.corruption, formActive: op.active };
    event.kind = "ability";
    event.details = op.active
      ? "Movimento e 6 Karma; resolva um Controle na ativação conjunta de rede e mutações. Manutenção de 1 Karma por turno seguinte, sem teste por esse pagamento."
      : "Mutações encerradas; contador corporal da cena preservado. Se acumulou cinco turnos, aplique Exausto.";
  }
  if (op.type === "round" && s.round < 99999) {
    s.round += 1;
    s.runes = s.runes?.filter(
      (rune) => rune.releaseRound === undefined || rune.releaseRound > s.round,
    );
    s.reactions = 1;
    s.domainRounds = Object.fromEntries(
      Object.entries(s.domainRounds).map(([name, rounds]) => [
        name,
        Math.max(0, rounds - 1),
      ]),
    );
    s.activeConditions = s.activeConditions.filter(
      (name) => s.conditionRounds?.[name] !== 1,
    );
    s.conditionPotency = Object.fromEntries(
      Object.entries(s.conditionPotency ?? {}).filter(([name]) =>
        s.activeConditions.includes(name),
      ),
    );
    s.conditionRounds = Object.fromEntries(
      Object.entries(s.conditionRounds ?? {})
        .filter(([, rounds]) => rounds > 1)
        .map(([name, rounds]) => [name, rounds - 1]),
    );
    if (next.corruption.formActive)
      next.corruption = {
        ...next.corruption,
        formTurns: Math.min(999, (next.corruption.formTurns ?? 0) + 1),
      };
    const active = draft.invocations.filter(
      (invocation) => s.summons?.[invocation.id]?.active,
    );
    const summons = { ...s.summons };
    const dismissed: string[] = [];
    for (const invocation of s.inCombat ? active : []) {
      const unit = summons[invocation.id];
      if ((unit.maintainedThroughRound ?? 0) >= s.round) continue;
      const cost = invocationMaintenance(draft, invocation, active[0]?.id);
      if (availableKarma(s) < cost) {
        summons[invocation.id] = { ...unit, active: false };
        dismissed.push(invocation.name || "Invocação");
      } else {
        s.currentKarma -= cost;
        summons[invocation.id] = { ...unit, maintainedThroughRound: s.round };
      }
    }
    s.summons = summons;
    event.karmaSpent = karmaBefore - s.currentKarma;
    event.details =
      `Manutenção: ${event.karmaSpent} Karma.${dismissed.length ? ` Recolhidas por falta de Karma: ${dismissed.join(", ")}.` : ""}`.slice(
        0,
        1600,
      );
  }
  if (op.type === "scene") {
    s.runes = s.runes?.filter((rune) => !rune.spent);
    s.runeBurstUsed = false;
    s.impetus = Math.min(2, impetusLimit(draft));
    s.impetusBloodied = false;
    s.impetusNaturalRound = undefined;
    s.summons = Object.fromEntries(
      Object.entries(s.summons ?? {}).map(([id, unit]) => [
        id,
        {
          ...unit,
          maintainedThroughRound: undefined,
          explorationPaid: undefined,
        },
      ]),
    );
    s.round = 1;
    s.reactions = 1;
    s.domainRounds = {};
    next.corruption = { ...next.corruption, formTurns: 0 };
  }
  if (op.type === "rest") {
    s = {
      ...s,
      summons: Object.fromEntries(
        Object.entries(s.summons ?? {}).map(([id, unit]) => [
          id,
          {
            ...unit,
            active: false,
            maintainedThroughRound: undefined,
            explorationPaid: undefined,
          },
        ]),
      ),
      runes: [],
      runeBurstUsed: false,
      impetusNaturalRound: undefined,
      impetusBloodied: false,
      inCombat: false,
      currentLife: max.life,
      currentKarma: max.karma,
      tempShield: 0,
      domainRounds: {},
      round: 1,
      reactions: 1,
    };
    next.alchemicalSaturation = 0;
    next.combat = {
      life: s.currentLife,
      karma: s.currentKarma,
      shield: 0,
      round: 1,
      domainRounds: {},
      temporaryCharges: 0,
    };
    next.corruption = {
      ...draft.corruption,
      formBlocked: false,
      formActive: false,
      formTurns: 0,
    };
    event.details =
      "Descanso longo seguro: recursos restaurados e Saturação limpa; Carga de Corrupção e condições exigem suas regras próprias.";
  }
  if (next.corruption.charge === 10 && next.corruption.formActive) {
    event.details =
      (event.details ?? "") +
      " Carga 10: resolva a Ruptura CD 24. Ao encerrar: Carga 7, Forma encerrada e bloqueada, Exausto.";
  }
  if (
    !s.impetusBloodied &&
    before > Math.floor(max.life / 2) &&
    s.currentLife <= Math.floor(max.life / 2)
  ) {
    s.impetusBloodied = true;
    const gained = (s.impetus ?? 0) < impetusLimit(draft);
    if (gained) s.impetus = (s.impetus ?? 0) + 1;
    const triggers = [
      gained && "+1 Ímpeto",
      s.runes?.some(
        (rune) =>
          !rune.spent &&
          karmicRunes.some(
            (entry) => entry.id === rune.runeId && /Berkano/i.test(entry.name),
          ),
      ) && "Confira a Runa Berkano",
      draft.className === "Inventor" && "Confira Pulso Autoral, se registrado",
    ].filter(Boolean);
    event.details =
      `${event.details ?? ""} Metade da Vida: primeiro limiar da cena.${triggers.length ? ` ${triggers.join(" · ")}.` : ""}`
        .trim()
        .slice(0, 2000);
  }
  event.lifeDelta = s.currentLife - before;
  event.karmaDelta = s.currentKarma - karmaBefore;
  event.shieldDelta = s.tempShield - shieldBefore;
  s.lastActionLog = event;
  s.combatFeed = [...s.combatFeed, event].slice(-25);
  return withLiveState(next, s);
}
