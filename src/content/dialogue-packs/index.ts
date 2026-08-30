import { abuDhabiCafeDialoguePack } from "@/content/dialogue-packs/abu-dhabi-cafe";
import { abuDhabiCampusDialoguePack } from "@/content/dialogue-packs/abu-dhabi-campus";
import { cairoCafeDialoguePack } from "@/content/dialogue-packs/cairo-cafe";
import { cairoTaxiDialoguePack } from "@/content/dialogue-packs/cairo-taxi";
import type { ReviewMetadata } from "@/domain/content/types";
import type { DialoguePack } from "@/domain/scenario/types";

export const dialoguePacks = [
  abuDhabiCafeDialoguePack,
  abuDhabiCampusDialoguePack,
  cairoCafeDialoguePack,
  cairoTaxiDialoguePack,
] as const satisfies readonly DialoguePack[];

/** Review-mode content for the deterministic prototype. Never treat this as a published teaching bundle. */
export function getDialoguePackByScenarioId(scenarioId: string): DialoguePack | undefined {
  return dialoguePacks.find((pack) => pack.scenarioId === scenarioId);
}

function isVerified(record: ReviewMetadata) {
  return (
    record.validationStatus === "verified" &&
    Number.isInteger(record.version) &&
    record.version > 0 &&
    record.evidenceIds.length > 0 &&
    record.reviewerIds.length > 0 &&
    Boolean(record.reviewedAt)
  );
}

export function getPublishedDialoguePack(scenarioId: string): DialoguePack | undefined {
  const pack = getDialoguePackByScenarioId(scenarioId);
  if (!pack || pack.publicationStatus !== "enabled" || !isVerified(pack)) return undefined;

  const everyRecordVerified = pack.beats.every(
    (beat) =>
      isVerified(beat) &&
      isVerified(beat.characterLine) &&
      beat.responseOptions.every(isVerified) &&
      beat.vocabulary.every(isVerified),
  );

  return everyRecordVerified ? pack : undefined;
}

function reviewIssue(record: ReviewMetadata, id: string) {
  if (record.validationStatus === "needs_review") return undefined;
  if (record.evidenceIds.length === 0 || record.reviewerIds.length === 0 || !record.reviewedAt) {
    return `${id} is verified without complete evidence and reviewer metadata.`;
  }
  return undefined;
}

function arabicIssue(value: string, id: string) {
  if (!value.trim()) return `${id} has empty Arabic text.`;
  if (value !== value.normalize("NFC")) return `${id} Arabic text is not NFC-normalized.`;
  return undefined;
}

export function validateDialoguePacks(): readonly string[] {
  const issues: string[] = [];
  const packIds = new Set<string>();
  const scenarioIds = new Set<string>();
  const allRecordIds = new Set<string>();
  const packs: readonly DialoguePack[] = dialoguePacks;

  for (const pack of packs) {
    if (packIds.has(pack.id)) issues.push(`${pack.id} is duplicated.`);
    if (scenarioIds.has(pack.scenarioId)) issues.push(`${pack.scenarioId} has multiple dialogue packs.`);
    packIds.add(pack.id);
    scenarioIds.add(pack.scenarioId);

    if (pack.beats.length < 5 || pack.beats.length > 8) {
      issues.push(`${pack.id} must contain 5–8 meaningful main-path beats.`);
    }
    if (pack.validationStatus === "needs_review" && pack.publicationStatus === "enabled") {
      issues.push(`${pack.id} enables review-pending dialogue.`);
    }

    const beatIds = new Set(pack.beats.map(({ id }) => id));
    if (!beatIds.has(pack.startingBeatId)) issues.push(`${pack.id} has a missing starting beat.`);

    const reachable = new Set<string>();
    const queue = [pack.startingBeatId];
    while (queue.length > 0) {
      const beatId = queue.shift();
      if (!beatId || reachable.has(beatId)) continue;
      reachable.add(beatId);
      const beat = pack.beats.find(({ id }) => id === beatId);
      if (!beat) continue;
      for (const option of beat.responseOptions) {
        if (option.nextBeatId) queue.push(option.nextBeatId);
      }
    }

    for (const beat of pack.beats) {
      if (allRecordIds.has(beat.id)) issues.push(`${beat.id} is duplicated.`);
      allRecordIds.add(beat.id);
      if (!reachable.has(beat.id)) issues.push(`${beat.id} is unreachable from ${pack.startingBeatId}.`);
      if (beat.scenarioId !== pack.scenarioId) issues.push(`${beat.id} belongs to another scenario.`);
      if (beat.responseOptions.length === 0) issues.push(`${beat.id} has no learner response path.`);

      const beatReviewIssue = reviewIssue(beat, beat.id);
      if (beatReviewIssue) issues.push(beatReviewIssue);
      const lineReviewIssue = reviewIssue(beat.characterLine, beat.characterLine.id);
      if (lineReviewIssue) issues.push(lineReviewIssue);
      const lineArabicIssue = arabicIssue(beat.characterLine.arabicText, beat.characterLine.id);
      if (lineArabicIssue) issues.push(lineArabicIssue);
      const promptArabicIssue = arabicIssue(beat.prompt.ar, `${beat.id} prompt`);
      if (promptArabicIssue) issues.push(promptArabicIssue);
      const hintArabicIssue = arabicIssue(beat.hint.ar, `${beat.id} hint`);
      if (hintArabicIssue) issues.push(hintArabicIssue);

      for (const item of beat.vocabulary) {
        if (allRecordIds.has(item.id)) issues.push(`${item.id} is duplicated.`);
        allRecordIds.add(item.id);
        const itemReviewIssue = reviewIssue(item, item.id);
        if (itemReviewIssue) issues.push(itemReviewIssue);
        const itemArabicIssue = arabicIssue(item.arabic, item.id);
        if (itemArabicIssue) issues.push(itemArabicIssue);
      }

      for (const option of beat.responseOptions) {
        if (allRecordIds.has(option.id)) issues.push(`${option.id} is duplicated.`);
        allRecordIds.add(option.id);
        if (option.scenarioId !== pack.scenarioId || option.beatId !== beat.id) {
          issues.push(`${option.id} has mismatched scenario or beat references.`);
        }
        if (option.nextBeatId && !beatIds.has(option.nextBeatId)) {
          issues.push(`${option.id} references missing beat ${option.nextBeatId}.`);
        }
        if (!option.nextBeatId && !option.completesScenario) {
          issues.push(`${option.id} neither continues nor completes its scenario.`);
        }
        const optionReviewIssue = reviewIssue(option, option.id);
        if (optionReviewIssue) issues.push(optionReviewIssue);
        const optionArabicIssue = arabicIssue(option.arabicText, option.id);
        if (optionArabicIssue) issues.push(optionArabicIssue);
      }
    }

    if (!pack.beats.some(({ isCompletionBeat }) => isCompletionBeat)) {
      issues.push(`${pack.id} has no completion beat.`);
    }
    const packReviewIssue = reviewIssue(pack, pack.id);
    if (packReviewIssue) issues.push(packReviewIssue);
  }

  return issues;
}
