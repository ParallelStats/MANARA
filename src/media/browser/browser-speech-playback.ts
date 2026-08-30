import type {
  SpeechPlaybackPort,
  SpeechPlaybackRequest,
} from "@/media/ports/speech-playback";

interface SpeechSynthesisLike {
  cancel(): void;
  speak(utterance: SpeechSynthesisUtterance): void;
}

export function createBrowserSpeechPlayback(
  synthesis: SpeechSynthesisLike | undefined = typeof window === "undefined" ? undefined : window.speechSynthesis,
): SpeechPlaybackPort {
  let activeAudio: HTMLAudioElement | null = null;
  let activeUtterance: SpeechSynthesisUtterance | null = null;

  function cancel() {
    synthesis?.cancel();
    activeUtterance = null;
    if (activeAudio) {
      activeAudio.pause();
      activeAudio.removeAttribute("src");
      activeAudio = null;
    }
  }

  return {
    available: Boolean(synthesis || (typeof Audio !== "undefined")),
    cancel,
    async speak(request: SpeechPlaybackRequest) {
      cancel();
      if (request.signal?.aborted) return;

      if (request.recordedAudioUrl && typeof Audio !== "undefined") {
        await new Promise<void>((resolve) => {
          const audio = new Audio(request.recordedAudioUrl);
          activeAudio = audio;
          const finish = () => {
            request.signal?.removeEventListener("abort", stop);
            if (activeAudio === audio) activeAudio = null;
            resolve();
          };
          const stop = () => { audio.pause(); finish(); };
          audio.onended = finish;
          audio.onerror = finish;
          request.signal?.addEventListener("abort", stop, { once: true });
          void audio.play().catch(finish);
        });
        return;
      }

      if (!synthesis || typeof SpeechSynthesisUtterance === "undefined") return;
      await new Promise<void>((resolve) => {
        const utterance = new SpeechSynthesisUtterance(request.text);
        activeUtterance = utterance;
        utterance.lang = request.language;
        utterance.rate = 0.92;
        const finish = () => {
          request.signal?.removeEventListener("abort", stop);
          if (activeUtterance === utterance) activeUtterance = null;
          resolve();
        };
        const stop = () => { synthesis.cancel(); finish(); };
        utterance.onend = finish;
        utterance.onerror = finish;
        request.signal?.addEventListener("abort", stop, { once: true });
        synthesis.speak(utterance);
      });
    },
  };
}
