export type CombatLog = {
  id: string; timestamp: string; actorName: string;
  kind: 'skill' | 'attack' | 'technique' | 'ability' | 'damage' | 'heal' | 'resource';
  title: string; rollFormula?: string; diceResults?: number[]; total?: number;
  karmaSpent?: number; lifeDelta?: number; details?: string;
};
export type LiveCombatState = {
  inCombat: boolean; currentLife: number; currentKarma: number; tempShield: number;
  activeConditions: string[]; lastActionLog: CombatLog | null; combatFeed: CombatLog[];
  reactions: number; round: number; domainRounds: Record<string, number>;
};
export type CombatAction = {
  id: string; actorName: string; title: string;
} & (
  | { type: 'damage'; amount: number; resistance: number; bypassShield?: boolean }
  | { type: 'heal'; amount: number }
  | { type: 'resource'; resource: 'karma' | 'life' | 'shield' | 'saturation' | 'charge' | 'reactions'; delta: number }
  | { type: 'condition'; condition: string; remove: boolean }
  | { type: 'execute'; cost: number; kind: 'skill' | 'attack' | 'technique' | 'ability'; rollFormula?: string; diceResults?: number[]; total?: number; details?: string }
  | { type: 'domain'; name: string }
  | { type: 'form'; active: boolean }
  | { type: 'round' }
  | { type: 'scene' }
  | { type: 'toggle'; active: boolean }
);
export type CombatLink = { id: string; token?: string };
