export type TravelTransitionPhase = "error" | "idle" | "previewing" | "travelling";

export interface TravelTransitionState {
  readonly phase: TravelTransitionPhase;
  readonly operationId: number;
  readonly targetId?: string;
  readonly message?: string;
}

export type TravelTransitionAction =
  | Readonly<{ type: "preview"; targetId: string }>
  | Readonly<{ type: "start"; targetId: string }>
  | Readonly<{ type: "complete" | "skip"; operationId: number }>
  | Readonly<{ type: "cancel" }>
  | Readonly<{ type: "fail"; operationId: number; message: string }>;

export const initialTravelTransitionState: TravelTransitionState = {
  phase: "idle",
  operationId: 0,
};

export function travelTransitionReducer(
  state: TravelTransitionState,
  action: TravelTransitionAction,
): TravelTransitionState {
  switch (action.type) {
    case "preview":
      if (state.phase === "travelling") return state;
      return { phase: "previewing", operationId: state.operationId, targetId: action.targetId };
    case "start":
      if (state.phase === "travelling") return state;
      return {
        phase: "travelling",
        operationId: state.operationId + 1,
        targetId: action.targetId,
      };
    case "complete":
    case "skip":
      if (state.phase !== "travelling" || action.operationId !== state.operationId) return state;
      return { phase: "idle", operationId: state.operationId };
    case "fail":
      if (state.phase !== "travelling" || action.operationId !== state.operationId) return state;
      return {
        phase: "error",
        operationId: state.operationId,
        ...(state.targetId ? { targetId: state.targetId } : {}),
        message: action.message,
      };
    case "cancel":
      return { phase: "idle", operationId: state.operationId + 1 };
  }
}
