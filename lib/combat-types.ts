import type {
  CombatVisual,
  DiceSelection,
  PhaseNotice,
} from "@/lib/combat-visuals";
export type CombatLog = {
  id: string;
  timestamp: string;
  actorName: string;
  kind:
    | "skill"
    | "attack"
    | "technique"
    | "ability"
    | "damage"
    | "heal"
    | "resource";
  title: string;
  rollFormula?: string;
  diceResults?: number[];
  total?: number;
  visual?: CombatVisual;
  karmaDelta?: number;
  shieldDelta?: number;
  karmaSpent?: number;
  lifeDelta?: number;
  details?: string;
  inventoryItemId?: string;
};
export type LiveRune = {
  id: string;
  runeId: number;
  weaponId?: string;
  spent?: boolean;
  releaseRound?: number;
  temporary?: boolean;
  personalSlotExempt?: boolean;
};
export type CursedWeaponState = {
  runeKey?: string;
  targets: Record<string, { marks: number; hasTotal: boolean }>;
  lastTargetId?: string;
  bloodFed?: boolean;
  dormant?: boolean;
  combatScene?: boolean;
};
export type LiveCombatState = {
  cursedWeapons?: Record<string, CursedWeaponState>;
  cursedTurnClosed?: boolean;
  session?: CombatSessionState;
  runes?: LiveRune[];
  runeBurstUsed?: boolean;
  gradeVApex?: {
    kind: "rune" | "technique" | "other";
    sourceId: string;
    label?: string;
  };
  impetus?: number;
  impetusBloodied?: boolean;
  impetusNaturalRound?: number;
  indomitableSurvivalRound?: number;
  inCombat: boolean;
  currentLife: number;
  currentKarma: number;
  tempShield: number;
  activeConditions: string[];
  conditionRounds?: Record<string, number>;
  conditionPotency?: Record<string, number>;
  lastActionLog: CombatLog | null;
  combatFeed: CombatLog[];
  summons?: Record<
    string,
    {
      life: number;
      active: boolean;
      fractures?: number;
      maintainedThroughRound?: number;
      explorationPaid?: boolean;
    }
  >;
  bossPhases?: Record<string, PhaseNotice>;
  reactions: number;
  round: number;
  domainRounds: Record<string, number>;
};
export type CombatSessionState = {
  id: string;
  status: "active" | "closed";
  round: number;
  lastRoundTransitionId?: string;
  appliedActionIds: string[];
  retiredSessionIds: string[];
  /** Compatibility for clients opened before explicit encounter sessions. */
  legacy?: boolean;
};
export type CombatAction = {
  id: string;
  actorName: string;
  title: string;
  combatSessionId?: string;
} & (
  | {
      type: "damage";
      amount: number;
      resistance: number;
      incomingElement?: string;
      primaryDefenses?: Record<string, number>;
      bypassShield?: boolean;
    }
  | {
      type: "summon";
      invocationId: string;
      operation:
        | "call"
        | "maintain"
        | "life"
        | "dismiss"
        | "repair"
        | "explore";
      delta?: number;
    }
  | { type: "heal"; amount: number }
  | {
      type: "resource";
      resource:
        | "karma"
        | "life"
        | "shield"
        | "saturation"
        | "charge"
        | "reactions"
        | "favor";
      delta: number;
    }
  | {
      type: "condition";
      condition: string;
      remove: boolean;
      rounds?: number;
      attackOutcome?: "Acerto total" | "Acerto parcial" | "Falha";
      potency?: number;
    }
  | {
      type: "inventoryUse";
      itemId: string;
      location?: "backpack" | "ready" | "external";
      equipped?: boolean;
      consume?: number;
    }
  | {
      type: "execute";
      invocationId?: string;
      techniqueId?: string;
      succeeded?: boolean;
      impetus?: boolean;
      cost: number;
      kind: "skill" | "attack" | "technique" | "ability";
      rollFormula?: string;
      diceResults?: number[];
      total?: number;
      selection?: DiceSelection;
      details?: string;
    }
  | { type: "phase"; phase: PhaseNotice }
  | {
      type: "spectacle";
      rollFormula: string;
      diceResults: number[];
      total: number;
      selection: DiceSelection;
      details?: string;
    }
  | { type: "domain"; name: string }
  | { type: "armRune"; runeId: number; weaponId?: string }
  | {
      type: "cursedStrike";
      weaponId: string;
      targetId: string;
      outcome: "Acerto total" | "Acerto parcial" | "Falha";
      selectedNatural?: number;
      vector: "melee" | "ranged";
      distance: number;
      isolated?: boolean;
      flanked?: boolean;
      targetDebilitated?: boolean;
      movedDistance?: number;
      higherGround?: boolean;
      targetDamagedBearer?: boolean;
      elementalOrArcane?: boolean;
      effectiveDamage?: number;
      nearbyAllies?: number;
      targetPresence?: number;
      allyDamagedTarget?: boolean;
      sheltered?: boolean;
      controlTotal?: number;
      hungerDie?: number;
    }
  | {
      type: "cursedWeapon";
      weaponId: string;
      operation: "feed" | "torpor" | "wake";
      controlTotal?: number;
      ritualDC?: number;
      ritualCompleted?: boolean;
    }
  | { type: "runeBenefit"; inscriptionId: string }
  | { type: "gradeVApex"; label: string }
  | {
      type: "interceptRune";
      runeId?: number;
      weaponId?: string;
      referenceKind: "attack" | "cd";
      reference: number;
      testTotal: number;
      mitigationDie?: number;
      damageBeforeMitigation: number;
      hostilePartial: boolean;
      skill: "Tática" | "Canalização de Karma";
    }
  | { type: "burstRune"; inscriptionId: string; disarm?: boolean }
  | { type: "form"; active: boolean }
  | { type: "indomitableSurvival" }
  | { type: "barrier"; reinforced: boolean }
  | { type: "round"; targetRound?: number; transitionId?: string }
  | {
      type: "session";
      operation: "start" | "close";
      sessionId: string;
      previousSessionId?: string;
    }
  | { type: "cursedTurnEnd" }
  | { type: "scene" }
  | { type: "rest" }
  | { type: "toggle"; active: boolean }
);
export type CombatLink = { id: string; token?: string };
