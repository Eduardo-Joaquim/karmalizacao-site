import type {
  CombatAction,
  CombatSessionState,
  LiveCombatState,
} from "@/lib/combat-types";

export class CombatProtocolError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 409,
  ) {
    super(message);
  }
}

/** A receipt is retained for the complete encounter, independently of the visual feed. */
export function prepareCombatSession(
  state: LiveCombatState,
  action: CombatAction,
): { session: CombatSessionState; duplicate: boolean } {
  const current = state.session;
  if (action.type === "session" && action.operation === "start") {
    if (current?.id === action.sessionId) {
      if (current.status === "closed")
        throw new CombatProtocolError(
          "SESSION_CLOSED",
          "Este encontro já foi encerrado.",
          410,
        );
      return {
        session: current.legacy ? { ...current, legacy: false } : current,
        duplicate: current.appliedActionIds.includes(action.id),
      };
    }
    if (current?.retiredSessionIds.includes(action.sessionId))
      throw new CombatProtocolError(
        "SESSION_CLOSED",
        "Este encontro já foi encerrado.",
        410,
      );
    if (action.previousSessionId !== current?.id)
      throw new CombatProtocolError(
        "SESSION_MISMATCH",
        "O encontro mudou antes da conexão. Sincronize a ficha antes de iniciar outro encontro.",
      );
    return {
      duplicate: false,
      session: {
        id: action.sessionId,
        status: "active",
        round: 1,
        appliedActionIds: [],
        retiredSessionIds: current
          ? [...new Set([...current.retiredSessionIds, current.id])]
          : [],
      },
    };
  }

  if (action.type === "session" && action.operation === "close") {
    if (!current || current.id !== action.sessionId)
      throw new CombatProtocolError(
        "SESSION_MISMATCH",
        "O encontro mudou. Sincronize a ficha antes de continuar.",
      );
    if (current.appliedActionIds.includes(action.id))
      return { session: current, duplicate: true };
    if (current.status === "closed")
      throw new CombatProtocolError(
        "SESSION_CLOSED",
        "Este encontro já foi encerrado.",
        410,
      );
    return { session: current, duplicate: false };
  }

  let session = current;
  if (!session) {
    if (action.combatSessionId)
      throw new CombatProtocolError(
        "SESSION_REQUIRED",
        "Inicie o encontro antes de executar esta ação.",
      );
    session = {
      id: "legacy-combat-session",
      status: "active",
      round: 1,
      appliedActionIds: state.combatFeed.map((event) => event.id),
      retiredSessionIds: [],
      legacy: true,
    };
  }
  if (session.status === "closed")
    throw new CombatProtocolError(
      "SESSION_CLOSED",
      "Este encontro já foi encerrado.",
      410,
    );
  if (
    (!session.legacy || action.combatSessionId) &&
    action.combatSessionId !== session.id
  )
    throw new CombatProtocolError(
      "SESSION_MISMATCH",
      "O encontro mudou. Sincronize a ficha antes de continuar.",
    );
  if (session.appliedActionIds.includes(action.id))
    return { session, duplicate: true };

  if (action.type === "round") {
    if (
      action.transitionId &&
      action.transitionId === session.lastRoundTransitionId
    )
      return { session, duplicate: true };
    const target =
      action.targetRound ?? (session.legacy ? session.round + 1 : undefined);
    if (
      (!session.legacy && !action.transitionId) ||
      target !== session.round + 1 ||
      target > 99999 ||
      state.round >= 99999
    )
      throw new CombatProtocolError(
        "INVALID_ROUND_TRANSITION",
        `Avance o encontro da rodada ${session.round} para ${session.round + 1}.`,
      );
  }
  return { session, duplicate: false };
}

export function completeCombatSession(
  session: CombatSessionState,
  action: CombatAction,
): CombatSessionState {
  return {
    ...session,
    status:
      action.type === "session" && action.operation === "close"
        ? "closed"
        : session.status,
    round: action.type === "round" ? session.round + 1 : session.round,
    lastRoundTransitionId:
      action.type === "round"
        ? (action.transitionId ?? action.id)
        : session.lastRoundTransitionId,
    // Closing invalidates every other command from the session, so only the
    // acknowledgement receipt for the close itself needs to remain.
    appliedActionIds:
      action.type === "session" && action.operation === "close"
        ? [action.id]
        : [...session.appliedActionIds, action.id],
  };
}
