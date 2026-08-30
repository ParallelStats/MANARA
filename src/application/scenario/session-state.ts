import type { EvaluationResult } from "@/domain/learning/types";

export type ScenarioSessionPhase =
  | "cancelled"
  | "character_responding"
  | "completed"
  | "completing"
  | "feedback_offered"
  | "idle"
  | "learner_input"
  | "preparing"
  | "processing"
  | "ready"
  | "recoverable_error"
  | "retrying";

export interface ScenarioSessionState {
  readonly sessionId: string;
  readonly scenarioId: string;
  readonly phase: ScenarioSessionPhase;
  readonly currentBeatId: string;
  readonly completedBeatIds: readonly string[];
  readonly activeTurnId?: string | undefined;
  readonly pendingEvaluation?: EvaluationResult | undefined;
  readonly pendingNextBeatId?: string | undefined;
  readonly pendingCompletion?: boolean | undefined;
  readonly retryCount: 0 | 1;
  readonly recoverableErrorCode?: string | undefined;
}

export type ScenarioSessionAction =
  | Readonly<{ type: "prepare"; sessionId: string }>
  | Readonly<{ type: "ready"; sessionId: string }>
  | Readonly<{ type: "begin_input"; sessionId: string; turnId: string }>
  | Readonly<{ type: "submit_input"; sessionId: string; turnId: string }>
  | Readonly<{
      type: "character_response";
      sessionId: string;
      turnId: string;
      evaluation?: EvaluationResult;
      nextBeatId?: string;
      completesScenario?: boolean;
    }>
  | Readonly<{ type: "offer_feedback"; sessionId: string; turnId: string }>
  | Readonly<{ type: "begin_retry"; sessionId: string; turnId: string }>
  | Readonly<{ type: "retry_resolved"; sessionId: string; turnId: string }>
  | Readonly<{ type: "continue"; sessionId: string; turnId: string }>
  | Readonly<{ type: "complete"; sessionId: string }>
  | Readonly<{ type: "fail"; sessionId: string; errorCode: string }>
  | Readonly<{ type: "recover"; sessionId: string }>
  | Readonly<{ type: "cancel"; sessionId: string }>;

export function createScenarioSessionState(
  sessionId: string,
  scenarioId: string,
  startingBeatId: string,
): ScenarioSessionState {
  return {
    sessionId,
    scenarioId,
    phase: "idle",
    currentBeatId: startingBeatId,
    completedBeatIds: [],
    retryCount: 0,
  };
}

function isCurrentTurn(state: ScenarioSessionState, sessionId: string, turnId: string) {
  return state.sessionId === sessionId && state.activeTurnId === turnId;
}

export function reduceScenarioSession(
  state: ScenarioSessionState,
  action: ScenarioSessionAction,
): ScenarioSessionState {
  if (action.sessionId !== state.sessionId || state.phase === "cancelled" || state.phase === "completed") {
    return state;
  }

  switch (action.type) {
    case "prepare":
      return state.phase === "idle" ? { ...state, phase: "preparing" } : state;
    case "ready":
      return state.phase === "preparing" ? { ...state, phase: "ready" } : state;
    case "begin_input":
      return state.phase === "ready"
        ? { ...state, phase: "learner_input", activeTurnId: action.turnId }
        : state;
    case "submit_input":
      return state.phase === "learner_input" && isCurrentTurn(state, action.sessionId, action.turnId)
        ? { ...state, phase: "processing" }
        : state;
    case "character_response":
      if (state.phase !== "processing" || !isCurrentTurn(state, action.sessionId, action.turnId)) return state;
      return {
        ...state,
        phase: "character_responding",
        ...(action.evaluation ? { pendingEvaluation: action.evaluation } : {}),
        ...(action.nextBeatId ? { pendingNextBeatId: action.nextBeatId } : {}),
        pendingCompletion: action.completesScenario === true,
      };
    case "offer_feedback":
      return state.phase === "character_responding" && isCurrentTurn(state, action.sessionId, action.turnId)
        ? { ...state, phase: "feedback_offered" }
        : state;
    case "begin_retry":
      return state.phase === "feedback_offered" && state.retryCount === 0 && isCurrentTurn(state, action.sessionId, action.turnId)
        ? { ...state, phase: "retrying", retryCount: 1 }
        : state;
    case "retry_resolved":
      return state.phase === "retrying" && isCurrentTurn(state, action.sessionId, action.turnId)
        ? { ...state, phase: "character_responding" }
        : state;
    case "continue": {
      if (state.phase !== "character_responding" || !isCurrentTurn(state, action.sessionId, action.turnId)) return state;
      const completedBeatIds = state.completedBeatIds.includes(state.currentBeatId)
        ? state.completedBeatIds
        : [...state.completedBeatIds, state.currentBeatId];
      if (state.pendingCompletion) {
        return { ...state, completedBeatIds, phase: "completing" };
      }
      if (!state.pendingNextBeatId) return state;
      return {
        ...state,
        phase: "ready",
        currentBeatId: state.pendingNextBeatId,
        completedBeatIds,
        retryCount: 0,
        activeTurnId: undefined,
        pendingEvaluation: undefined,
        pendingNextBeatId: undefined,
        pendingCompletion: false,
      };
    }
    case "complete":
      return state.phase === "completing" ? { ...state, phase: "completed" } : state;
    case "fail":
      return { ...state, phase: "recoverable_error", recoverableErrorCode: action.errorCode };
    case "recover":
      return state.phase === "recoverable_error"
        ? { ...state, phase: "ready", recoverableErrorCode: undefined }
        : state;
    case "cancel":
      return { ...state, phase: "cancelled" };
  }
}
