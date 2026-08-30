export type SpeechRecognitionFailure =
  | "permission_denied"
  | "unavailable"
  | "silence"
  | "cancelled"
  | "timeout"
  | "recognition_failed";

export type SpeechRecognitionResult =
  | Readonly<{ ok: true; transcript: string }>
  | Readonly<{ ok: false; failure: SpeechRecognitionFailure }>;

export interface SpeechRecognitionRequest {
  readonly language: string;
  readonly timeoutMs: number;
  readonly signal?: AbortSignal;
  readonly onInterimTranscript?: (transcript: string) => void;
}

export interface SpeechRecognitionPort {
  readonly available: boolean;
  listen(request: SpeechRecognitionRequest): Promise<SpeechRecognitionResult>;
  stop(): void;
  cancel(): void;
}
