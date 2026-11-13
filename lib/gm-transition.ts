import type { EncounterParticipant } from "@/lib/gm-encounter";

export const GM_ENCOUNTER_STORAGE_KEY = "karmalizacao:gm-encounter:v1";

export type PendingRoundTransition = {
  id: string;
  combatSessionId: string;
  targetRound: number;
  participantIds: string[];
  participantTargets: Record<string, number>;
  done: string[];
};

export type GmEncounterRuntime = {
  combatSessionId: string;
  round: number;
  participants: EncounterParticipant[];
  pendingRoundTransition: PendingRoundTransition | null;
};

/** Freeze the recipients and each sheet's next round before the first request. */
export function beginGmRound(
  current: GmEncounterRuntime,
  transitionId: string,
): GmEncounterRuntime {
  if (current.pendingRoundTransition) return current;
  if (current.round >= 99999) throw Error("O limite de rodadas foi atingido.");
  const participantTargets = Object.fromEntries(
    current.participants.map((participant) => {
      const session = participant.payload?.combatState?.session;
      const localSession = participant.localCombatSession;
      const round = participant.link
        ? session?.id === current.combatSessionId && session.status === "active"
          ? session.round
          : 1
        : localSession?.id === current.combatSessionId
          ? localSession.round
          : 1;
      if (round >= 99999) throw Error("O limite de rodadas foi atingido.");
      return [participant.key, round + 1];
    }),
  );
  return {
    ...current,
    pendingRoundTransition: {
      id: transitionId,
      combatSessionId: current.combatSessionId,
      targetRound: current.round + 1,
      participantIds: current.participants.map(
        (participant) => participant.key,
      ),
      participantTargets,
      done: [],
    },
  };
}

export function markGmRoundParticipantDone(
  current: GmEncounterRuntime,
  key: string,
): GmEncounterRuntime {
  const pending = current.pendingRoundTransition;
  if (!pending || !pending.participantIds.includes(key)) return current;
  return {
    ...current,
    pendingRoundTransition: {
      ...pending,
      done: [...new Set([...pending.done, key])],
    },
  };
}

export function finishGmRound(current: GmEncounterRuntime): GmEncounterRuntime {
  const pending = current.pendingRoundTransition;
  if (!pending) return current;
  if (!pending.participantIds.every((key) => pending.done.includes(key)))
    throw Error("Há participantes pendentes nesta rodada.");
  return {
    ...current,
    round: pending.targetRound,
    pendingRoundTransition: null,
  };
}

/** NPC resources and the receipt are one state value, persisted in one write. */
export function applyGmLocalAction(
  current: GmEncounterRuntime,
  key: string,
  actionId: string,
  mutate: (participant: EncounterParticipant) => EncounterParticipant,
  roundTransition?: { id: string; targetRound: number },
): GmEncounterRuntime {
  const participant = current.participants.find((entry) => entry.key === key);
  if (!participant?.npc || participant.link)
    throw Error("Participante local não encontrado.");
  const oldSession = participant.localCombatSession;
  const session =
    oldSession?.id === current.combatSessionId
      ? oldSession
      : { id: current.combatSessionId, round: 1, appliedActionIds: [] };
  let next = current;
  if (!session.appliedActionIds.includes(actionId)) {
    if (roundTransition && roundTransition.targetRound !== session.round + 1)
      throw Error(
        "A rodada deste participante precisa avançar uma vez por vez.",
      );
    const updated = {
      ...mutate(participant),
      localCombatSession: {
        ...session,
        round: roundTransition?.targetRound ?? session.round,
        lastRoundTransitionId:
          roundTransition?.id ?? session.lastRoundTransitionId,
        appliedActionIds: [...session.appliedActionIds, actionId],
      },
    };
    next = {
      ...current,
      participants: current.participants.map((entry) =>
        entry.key === key ? updated : entry,
      ),
    };
  }
  return roundTransition ? markGmRoundParticipantDone(next, key) : next;
}

export function persistGmRuntime(
  storage: Pick<Storage, "setItem">,
  runtime: GmEncounterRuntime,
  details: Record<string, unknown> = {},
) {
  storage.setItem(
    GM_ENCOUNTER_STORAGE_KEY,
    JSON.stringify({ ...details, ...runtime }),
  );
}
