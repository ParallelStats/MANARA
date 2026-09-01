export interface SpeechPlaybackRequest {
  readonly text: string;
  readonly language: string;
  readonly preferredGender?: "female" | "male";
  readonly recordedAudioUrl?: string;
  readonly signal?: AbortSignal;
}

export interface SpeechPlaybackPort {
  readonly available: boolean;
  speak(request: SpeechPlaybackRequest): Promise<void>;
  cancel(): void;
}
