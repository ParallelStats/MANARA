import type {
  SpeechRecognitionFailure,
  SpeechRecognitionPort,
  SpeechRecognitionRequest,
  SpeechRecognitionResult,
} from "@/media/ports/speech-recognition";

interface RecognitionAlternativeLike { readonly transcript?: string }
interface RecognitionResultLike { readonly 0?: RecognitionAlternativeLike; readonly isFinal?: boolean }
interface RecognitionEventLike { readonly results?: ArrayLike<RecognitionResultLike> }
interface RecognitionErrorLike { readonly error?: string }

export interface BrowserRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: RecognitionEventLike) => void) | null;
  onerror: ((event: RecognitionErrorLike) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

export type BrowserRecognitionFactory = () => BrowserRecognitionLike;

function defaultFactory(): BrowserRecognitionLike | undefined {
  if (typeof window === "undefined") return undefined;
  const browser = window as typeof window & {
    SpeechRecognition?: new () => BrowserRecognitionLike;
    webkitSpeechRecognition?: new () => BrowserRecognitionLike;
  };
  const Constructor = browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
  return Constructor ? new Constructor() : undefined;
}

function mapRecognitionError(error?: string): SpeechRecognitionFailure {
  if (error === "not-allowed" || error === "service-not-allowed") return "permission_denied";
  if (error === "audio-capture") return "unavailable";
  if (error === "no-speech") return "silence";
  if (error === "aborted") return "cancelled";
  return "recognition_failed";
}

export function createBrowserSpeechRecognition(
  factory: () => BrowserRecognitionLike | undefined = defaultFactory,
): SpeechRecognitionPort {
  let activeRecognition: BrowserRecognitionLike | null = null;
  let settleActive: ((result: SpeechRecognitionResult) => void) | null = null;
  let stopActive: (() => void) | null = null;
  let preparedRecognition: BrowserRecognitionLike | undefined;
  try {
    preparedRecognition = factory();
  } catch {
    preparedRecognition = undefined;
  }
  const available = Boolean(preparedRecognition);

  return {
    available,
    async listen(request: SpeechRecognitionRequest) {
      if (activeRecognition) return { ok: false, failure: "recognition_failed" };
      let recognition = preparedRecognition;
      preparedRecognition = undefined;
      if (!recognition) {
        try {
          recognition = factory();
        } catch {
          recognition = undefined;
        }
      }
      if (!recognition) return { ok: false, failure: "unavailable" };
      const active = recognition;

      return new Promise<SpeechRecognitionResult>((resolve) => {
        let finalTranscript = "";
        let settled = false;
        let stopGraceTimer: ReturnType<typeof setTimeout> | null = null;
        const timeout = setTimeout(() => finish({ ok: false, failure: "timeout" }), request.timeoutMs);

        function cleanup() {
          clearTimeout(timeout);
          if (stopGraceTimer) clearTimeout(stopGraceTimer);
          request.signal?.removeEventListener("abort", cancel);
          active.onresult = null;
          active.onerror = null;
          active.onend = null;
          activeRecognition = null;
          settleActive = null;
          stopActive = null;
        }

        function finish(result: SpeechRecognitionResult) {
          if (settled) return;
          settled = true;
          cleanup();
          resolve(result);
        }

        function cancel() {
          try { active.abort(); } catch { /* Browser already released the device. */ }
          finish({ ok: false, failure: "cancelled" });
        }

        activeRecognition = active;
        settleActive = finish;
        stopActive = () => {
          try {
            active.stop();
          } catch {
            finish({ ok: false, failure: "recognition_failed" });
            return;
          }
          if (finalTranscript) {
            finish({ ok: true, transcript: finalTranscript });
            return;
          }
          stopGraceTimer = setTimeout(() => finish(
            { ok: false, failure: "silence" },
          ), 180);
        };
        active.lang = request.language;
        active.continuous = false;
        active.interimResults = true;
        active.maxAlternatives = 1;
        active.onresult = (event) => {
          const transcripts = Array.from(event.results ?? [])
            .map((result) => result[0]?.transcript?.trim() ?? "")
            .filter(Boolean);
          const transcript = transcripts.join(" ").trim();
          if (!transcript) return;
          request.onInterimTranscript?.(transcript);
          finalTranscript = transcript;
          const lastResult = event.results?.[event.results.length - 1];
          if (lastResult?.isFinal) finish({ ok: true, transcript });
        };
        active.onerror = (event) => finish({ ok: false, failure: mapRecognitionError(event.error) });
        active.onend = () => finish(
          finalTranscript
            ? { ok: true, transcript: finalTranscript }
            : { ok: false, failure: "silence" },
        );
        request.signal?.addEventListener("abort", cancel, { once: true });

        try {
          active.start();
        } catch {
          finish({ ok: false, failure: "recognition_failed" });
        }
      });
    },
    stop() {
      if (!activeRecognition) return;
      stopActive?.();
    },
    cancel() {
      if (!activeRecognition) return;
      try { activeRecognition.abort(); } catch { /* Browser already released the device. */ }
      settleActive?.({ ok: false, failure: "cancelled" });
    },
  };
}
