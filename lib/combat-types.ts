import type { CombatVisual, PhaseNotice, DiceSelection } from "@/lib/combat-visuals";
export type CombatLog = {
  id: string; timestamp: string; actorName: string;
  kind: 'skill' | 'attack' | 'technique' | 'ability' | 'damage' | 'heal' | 'resource';
  title: string; rollFormula?: string; diceResults?: number[]; total?: number;
  visual?: CombatVisual; karmaDelta?: number; shieldDelta?: number;
  karmaSpent?: number; lifeDelta?: number; details?: string;
};
export type LiveRune = { id:string; runeId:number; weaponId?:string; spent?:boolean; releaseRound?:number };
export type LiveCombatState = {
  runes?: LiveRune[];
  runeBurstUsed?: boolean;
  impetus?:number; impetusBloodied?:boolean;
  inCombat: boolean; currentLife: number; currentKarma: number; tempShield: number;
  activeConditions: string[]; lastActionLog: CombatLog | null; combatFeed: CombatLog[];
  summons?:Record<string,{life:number;active:boolean}>;
  bossPhases?: Record<string, PhaseNotice>;
  reactions: number; round: number; domainRounds: Record<string, number>;
};
export type CombatAction = {
  id: string; actorName: string; title: string;
} & (
  | { type: 'damage'; amount: number; resistance: number; incomingElement?:string; primaryDefenses?:Record<string,number>; bypassShield?: boolean }
  | {type:'summon';invocationId:string;operation:'call'|'maintain'|'life'|'dismiss';delta?:number}
  | { type: 'heal'; amount: number }
  | { type: 'resource'; resource: 'karma' | 'life' | 'shield' | 'saturation' | 'charge' | 'reactions' | 'favor'; delta: number }
  | { type: 'condition'; condition: string; remove: boolean }
  | { type: 'execute'; techniqueId?:string; succeeded?:boolean; impetus?:boolean; cost: number; kind: 'skill' | 'attack' | 'technique' | 'ability'; rollFormula?: string; diceResults?: number[]; total?: number; selection?: DiceSelection; details?: string }
  | { type: 'phase'; phase: PhaseNotice }
  | { type: 'spectacle'; rollFormula:string; diceResults:number[]; total:number; selection:DiceSelection; details?:string }
  | { type: 'domain'; name: string }
  | { type: 'armRune'; runeId: number; weaponId?: string }
  | { type: 'burstRune'; inscriptionId: string }
  | { type: 'form'; active: boolean }
  | { type: 'barrier'; reinforced: boolean }
  | { type: 'round' }
  | { type: 'scene' }
  | { type: 'rest' }
  | { type: 'toggle'; active: boolean }
);
export type CombatLink = { id: string; token?: string };
