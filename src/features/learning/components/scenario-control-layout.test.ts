import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { scenarios } from "@/content/scenarios";

const voiceDock = readFileSync("src/features/learning/components/voice-dock.tsx", "utf8");
const scenario = readFileSync("src/features/learning/components/immersive-scenario.tsx", "utf8");
const styles = readFileSync("src/features/learning/scenario-scene.module.css", "utf8");

describe("scenario interaction dock", () => {
  it("owns microphone, secondary action, utilities, and status in one dock grid", () => {
    expect(styles).toContain('"prompt prompt prompt"');
    expect(styles).toContain('"utilities microphone secondary"');
    expect(styles).toContain('"status status status"');
    expect(voiceDock).toContain("{utilityControl}");
    expect(scenario).toContain("utilityControl={(");
    expect(styles).toMatch(/\.aidsRegion\s*\{\s*position:\s*relative;/);
  });

  it("keeps the microphone primary and preserves critical control states", () => {
    expect(styles).toMatch(/\.micButton\s*\{[\s\S]*grid-area:\s*microphone;/);
    expect(styles).toMatch(/\.typeButton\s*\{[\s\S]*grid-area:\s*secondary;/);
    expect(voiceDock).toContain('aria-pressed={voiceState === "listening"}');
    expect(voiceDock).toContain('disabled={busy || voiceState === "processing"}');
    expect(voiceDock).toContain("recognition.stop()");
    expect(voiceDock).toContain('role="status" aria-live="polite"');
    expect(voiceDock).toContain("aria-expanded={choicesOpen}");
    expect(voiceDock).toContain("aria-expanded={textOpen}");
  });

  it("serves all four active scenarios through the shared responsive dock", () => {
    expect(scenarios.map(({ id }) => id)).toEqual([
      "scenario-abu-dhabi-cafe",
      "scenario-abu-dhabi-campus",
      "scenario-cairo-cafe",
      "scenario-cairo-transport",
    ]);
    expect(scenario.match(/<VoiceDock/g)).toHaveLength(1);
  });
});
