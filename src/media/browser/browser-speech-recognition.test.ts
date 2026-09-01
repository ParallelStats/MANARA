import { describe, expect, it, vi } from "vitest";

import {
  createBrowserSpeechRecognition,
  type BrowserRecognitionLike,
} from "@/media/browser/browser-speech-recognition";

function recognition(
  start: (instance: BrowserRecognitionLike) => void,
): BrowserRecognitionLike {
  const instance: BrowserRecognitionLike = {
    lang: "",
    continuous: true,
    interimResults: false,
    maxAlternatives: 0,
    onresult: null,
    onerror: null,
    onend: null,
    start: () => start(instance),
    stop: vi.fn(() => instance.onend?.()),
    abort: vi.fn(),
  };
  return instance;
}

describe("browser Arabic speech recognition", () => {
  it("reuses the recognition instance created during capability detection", async () => {
    const fake = recognition((instance) => instance.onresult?.({
      results: Object.assign([{ 0: { transcript: "أبغي قهوة" }, isFinal: true }], { length: 1 }),
    }));
    const factory = vi.fn(() => fake);
    const port = createBrowserSpeechRecognition(factory);

    await expect(port.listen({ language: "ar-AE", timeoutMs: 50 })).resolves.toMatchObject({
      ok: true,
    });
    expect(factory).toHaveBeenCalledOnce();
  });

  it("reports unsupported browsers and preserves the typed fallback", async () => {
    const port = createBrowserSpeechRecognition(() => undefined);
    expect(port.available).toBe(false);
    await expect(port.listen({ language: "ar-AE", timeoutMs: 50 })).resolves.toEqual({
      ok: false,
      failure: "unavailable",
    });
  });

  it("maps microphone permission denial without throwing", async () => {
    const fake = recognition((instance) => instance.onerror?.({ error: "not-allowed" }));
    const port = createBrowserSpeechRecognition(() => fake);
    await expect(port.listen({ language: "ar-EG", timeoutMs: 50 })).resolves.toEqual({
      ok: false,
      failure: "permission_denied",
    });
  });

  it("returns final Arabic speech and configures the requested locale", async () => {
    const fake = recognition((instance) => instance.onresult?.({
      results: Object.assign([{ 0: { transcript: "عايز قهوة" }, isFinal: true }], { length: 1 }),
    }));
    const port = createBrowserSpeechRecognition(() => fake);
    await expect(port.listen({ language: "ar-EG", timeoutMs: 50 })).resolves.toEqual({
      ok: true,
      transcript: "عايز قهوة",
    });
    expect(fake.lang).toBe("ar-EG");
    expect(fake.continuous).toBe(false);
  });

  it("maps silence and capture failures to recoverable states", async () => {
    const silent = recognition((instance) => instance.onend?.());
    const missingMic = recognition((instance) => instance.onerror?.({ error: "audio-capture" }));
    await expect(createBrowserSpeechRecognition(() => silent).listen({ language: "ar-AE", timeoutMs: 50 }))
      .resolves.toMatchObject({ failure: "silence" });
    await expect(createBrowserSpeechRecognition(() => missingMic).listen({ language: "ar-AE", timeoutMs: 50 }))
      .resolves.toMatchObject({ failure: "unavailable" });
  });

  it("prevents two simultaneous recognition sessions", async () => {
    const fake = recognition(() => undefined);
    const port = createBrowserSpeechRecognition(() => fake);
    const first = port.listen({ language: "ar-AE", timeoutMs: 1_000 });
    await expect(port.listen({ language: "ar-AE", timeoutMs: 50 })).resolves.toMatchObject({
      failure: "recognition_failed",
    });
    port.cancel();
    await expect(first).resolves.toMatchObject({ failure: "cancelled" });
  });

  it("submits the captured transcript when the learner taps to stop", async () => {
    const fake = recognition(() => undefined);
    const port = createBrowserSpeechRecognition(() => fake);
    const listening = port.listen({ language: "ar-AE", timeoutMs: 1_000 });

    fake.onresult?.({
      results: Object.assign([{ 0: { transcript: "أبغي قهوة" }, isFinal: false }], { length: 1 }),
    });
    port.stop();

    await expect(listening).resolves.toEqual({ ok: true, transcript: "أبغي قهوة" });
    expect(fake.stop).toHaveBeenCalledOnce();
    expect(fake.abort).not.toHaveBeenCalled();
  });

  it("does not remain stuck when a browser omits the end event after stop", async () => {
    const fake = recognition(() => undefined);
    fake.stop = vi.fn();
    const port = createBrowserSpeechRecognition(() => fake);
    const listening = port.listen({ language: "ar-AE", timeoutMs: 1_000 });

    fake.onresult?.({
      results: Object.assign([{ 0: { transcript: "أبغي قهوة" }, isFinal: false }], { length: 1 }),
    });
    port.stop();

    await expect(listening).resolves.toEqual({ ok: true, transcript: "أبغي قهوة" });
    expect(fake.stop).toHaveBeenCalledOnce();
  });

  it("releases the active microphone when the learner cancels or exits", async () => {
    const fake = recognition(() => undefined);
    const port = createBrowserSpeechRecognition(() => fake);
    const listening = port.listen({ language: "ar-AE", timeoutMs: 1_000 });
    port.cancel();
    await expect(listening).resolves.toMatchObject({ failure: "cancelled" });
    expect(fake.abort).toHaveBeenCalledOnce();
  });
});
