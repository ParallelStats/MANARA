export interface ConversationOperation {
  readonly id: string;
  readonly signal: AbortSignal;
}

export interface ConversationOperationGate {
  start(): ConversationOperation | null;
  isCurrent(id: string): boolean;
  finish(id: string): void;
  cancel(): void;
}

export function createConversationOperationGate(): ConversationOperationGate {
  let active: { id: string; controller: AbortController } | null = null;
  let sequence = 0;

  return {
    start() {
      if (active) return null;
      sequence += 1;
      active = {
        id: `conversation-operation-${sequence}`,
        controller: new AbortController(),
      };
      return { id: active.id, signal: active.controller.signal };
    },
    isCurrent(id) {
      return active?.id === id && !active.controller.signal.aborted;
    },
    finish(id) {
      if (active?.id === id) active = null;
    },
    cancel() {
      active?.controller.abort();
      active = null;
    },
  };
}
