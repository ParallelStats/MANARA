import { describe, expect, it } from "vitest";

import { selectSpeechSynthesisVoice } from "@/media/browser/browser-speech-playback";

const voices = [
  { name: "Microsoft Salma", lang: "ar-EG", localService: true },
  { name: "Microsoft Maged", lang: "ar-EG", localService: true },
  { name: "Arabic Hamed", lang: "ar-SA", localService: true },
  { name: "English Voice", lang: "en-US", localService: true },
] as const;

describe("browser Arabic speech playback", () => {
  it("selects a regional female voice for a female Cairo character", () => {
    expect(selectSpeechSynthesisVoice(voices, "ar-EG", "female")?.name).toBe("Microsoft Salma");
  });

  it("selects a regional male voice for a male Cairo character", () => {
    expect(selectSpeechSynthesisVoice(voices, "ar-EG", "male")?.name).toBe("Microsoft Maged");
  });

  it("prefers the requested region before a gender hint from another region", () => {
    expect(selectSpeechSynthesisVoice(voices, "ar-EG", "male")?.lang).toBe("ar-EG");
  });

  it("falls back to another Arabic voice when the requested region is unavailable", () => {
    expect(selectSpeechSynthesisVoice(voices, "ar-AE", "male")?.name).toBe("Arabic Hamed");
  });
});
