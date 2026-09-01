import type {
  SpeechPlaybackPort,
  SpeechPlaybackRequest,
} from "@/media/ports/speech-playback";

interface SpeechSynthesisLike {
  cancel(): void;
  getVoices?(): readonly SpeechSynthesisVoice[];
  resume?(): void;
  speak(utterance: SpeechSynthesisUtterance): void;
}

type SpeechVoiceSummary = Pick<SpeechSynthesisVoice, "lang" | "localService" | "name">;

const genderHints = {
  female: /\b(female|woman|hoda|salma|laila|layla|fatima|maryam|mariam|zeina)\b/i,
  male: /\b(male|man|hamed|maged|naayf|omar|tariq|tarik|saad)\b/i,
} as const;

const gulfArabicLocales = new Set(["ar-ae", "ar-bh", "ar-kw", "ar-om", "ar-qa", "ar-sa"]);

function normalizeLocale(locale: string) {
  return locale.trim().replace("_", "-").toLowerCase();
}

export function selectSpeechSynthesisVoice<T extends SpeechVoiceSummary>(
  voices: readonly T[],
  language: string,
  preferredGender?: "female" | "male",
): T | undefined {
  const requestedLocale = normalizeLocale(language);
  const requestedLanguage = requestedLocale.split("-")[0];

  return voices
    .map((voice, index) => {
      const voiceLocale = normalizeLocale(voice.lang);
      const languageScore = voiceLocale === requestedLocale
        ? 1_000
        : voiceLocale.split("-")[0] === requestedLanguage ? 300 : 0;
      const regionalScore = gulfArabicLocales.has(requestedLocale) && gulfArabicLocales.has(voiceLocale)
        ? 60
        : 0;
      const genderScore = preferredGender && genderHints[preferredGender].test(voice.name) ? 80 : 0;
      const localScore = voice.localService ? 20 : 0;
      return { index, score: languageScore + regionalScore + genderScore + localScore, voice };
    })
    .filter(({ score }) => score > 0)
    .sort((first, second) => second.score - first.score || first.index - second.index)[0]
    ?.voice;
}

export function createBrowserSpeechPlayback(
  synthesis: SpeechSynthesisLike | undefined = typeof window === "undefined" ? undefined : window.speechSynthesis,
): SpeechPlaybackPort {
  let activeAudio: HTMLAudioElement | null = null;
  let activeUtterance: SpeechSynthesisUtterance | null = null;
  let activeFinish: (() => void) | null = null;

  function cancel() {
    const finish = activeFinish;
    activeFinish = null;
    synthesis?.cancel();
    activeUtterance = null;
    if (activeAudio) {
      activeAudio.pause();
      activeAudio.removeAttribute("src");
      activeAudio = null;
    }
    finish?.();
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
          let settled = false;
          const finish = () => {
            if (settled) return;
            settled = true;
            request.signal?.removeEventListener("abort", stop);
            if (activeAudio === audio) activeAudio = null;
            if (activeFinish === finish) activeFinish = null;
            resolve();
          };
          const stop = () => { audio.pause(); finish(); };
          activeFinish = finish;
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
        const selectedVoice = selectSpeechSynthesisVoice(
          synthesis.getVoices?.() ?? [],
          request.language,
          request.preferredGender,
        );
        if (selectedVoice) utterance.voice = selectedVoice;
        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          request.signal?.removeEventListener("abort", stop);
          if (activeUtterance === utterance) activeUtterance = null;
          if (activeFinish === finish) activeFinish = null;
          resolve();
        };
        const stop = () => { synthesis.cancel(); finish(); };
        activeFinish = finish;
        utterance.onend = finish;
        utterance.onerror = finish;
        request.signal?.addEventListener("abort", stop, { once: true });
        synthesis.resume?.();
        synthesis.speak(utterance);
      });
    },
  };
}
