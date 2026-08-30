import { describe, expect, it } from "vitest";

import {
  dialoguePacks,
  getDialoguePackByScenarioId,
  getPublishedDialoguePack,
  validateDialoguePacks,
} from "@/content/dialogue-packs";

function followDefaultPath(scenarioId: string) {
  const pack = getDialoguePackByScenarioId(scenarioId);
  if (!pack) throw new Error(`Missing pack for ${scenarioId}`);

  const visited: string[] = [];
  let beatId: string | undefined = pack.startingBeatId;
  for (let guard = 0; beatId && guard < 10; guard += 1) {
    const beat = pack.beats.find(({ id }) => id === beatId);
    if (!beat) throw new Error(`Missing beat ${beatId}`);
    visited.push(beat.id);
    const option = beat.responseOptions[0];
    if (!option) throw new Error(`Missing default response for ${beat.id}`);
    if (option.completesScenario) return visited;
    beatId = option.nextBeatId;
  }

  throw new Error(`${scenarioId} did not reach completion`);
}

describe("dialogue packs", () => {
  it("provides the four required scenario packs", () => {
    expect(dialoguePacks.map(({ scenarioId }) => scenarioId)).toEqual([
      "scenario-abu-dhabi-cafe",
      "scenario-abu-dhabi-campus",
      "scenario-cairo-cafe",
      "scenario-cairo-transport",
    ]);
  });

  it.each([
    "scenario-abu-dhabi-cafe",
    "scenario-abu-dhabi-campus",
    "scenario-cairo-cafe",
    "scenario-cairo-transport",
  ])("%s reaches completion with empty history", (scenarioId) => {
    expect(followDefaultPath(scenarioId)).toHaveLength(6);
  });

  it("uses four distinct characters and environments", () => {
    expect(new Set(dialoguePacks.map(({ characterId }) => characterId)).size).toBe(4);
    expect(new Set(dialoguePacks.map(({ environmentId }) => environmentId)).size).toBe(4);
  });

  it("keeps every authored Arabic dialogue record review-pending and unpublished", () => {
    for (const pack of dialoguePacks) {
      expect(pack.validationStatus).toBe("needs_review");
      expect(pack.publicationStatus).toBe("disabled");
      expect(getPublishedDialoguePack(pack.scenarioId)).toBeUndefined();

      for (const beat of pack.beats) {
        expect(beat.validationStatus).toBe("needs_review");
        expect(beat.characterLine.validationStatus).toBe("needs_review");
        expect(beat.characterLine.arabicText).toBe(beat.characterLine.arabicText.normalize("NFC"));
        expect(beat.characterLine.reviewerNote).not.toBe("");
        for (const option of beat.responseOptions) {
          expect(option.validationStatus).toBe("needs_review");
          expect(option.arabicText).toBe(option.arabicText.normalize("NFC"));
          expect(option.reviewerNote).not.toBe("");
        }
        for (const item of beat.vocabulary) {
          expect(item.validationStatus).toBe("needs_review");
          expect(item.reviewerNote).not.toBe("");
        }
      }
    }
  });

  it("contains target, Egyptian-transfer, and MSA options in the flagship opening", () => {
    const opening = getDialoguePackByScenarioId("scenario-abu-dhabi-cafe")?.beats[0];
    expect(opening?.responseOptions.map(({ kind }) => kind)).toEqual([
      "target_dialect",
      "source_dialect",
      "msa",
    ]);
  });

  it("has no broken or unreachable dialogue records", () => {
    expect(validateDialoguePacks()).toEqual([]);
  });
});
