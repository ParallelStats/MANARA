import type {
  ConversationTurnRequest,
  GeneratedCharacterTurn,
} from "@/ai/ports/conversation-provider";
import type { LearnerResponseOption } from "@/domain/scenario/types";

const arabicLetter = /[\u0621-\u064A]/u;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readBoundedString(
  record: Record<string, unknown>,
  key: string,
  maximumLength: number,
) {
  const value = record[key];
  return typeof value === "string" && value.trim().length > 0 && value.length <= maximumLength
    ? value.trim()
    : undefined;
}

export function parseConversationTurnRequest(value: unknown): ConversationTurnRequest | undefined {
  if (!isRecord(value) || !Array.isArray(value.allowedIntentIds)) return undefined;

  const operationId = readBoundedString(value, "operationId", 100);
  const scenarioId = readBoundedString(value, "scenarioId", 100);
  const beatId = readBoundedString(value, "beatId", 100);
  const characterId = readBoundedString(value, "characterId", 100);
  const characterName = readBoundedString(value, "characterName", 80);
  const characterRole = readBoundedString(value, "characterRole", 240);
  const destinationName = readBoundedString(value, "destinationName", 80);
  const learnerStartingPoint = readBoundedString(value, "learnerStartingPoint", 40);
  const learnerInput = readBoundedString(value, "learnerInput", 500);
  const allowedIntentIds = [...new Set(value.allowedIntentIds)].filter(
    (intent): intent is string => typeof intent === "string" && intent.length > 0 && intent.length <= 100,
  );

  if (
    !operationId || !scenarioId || !beatId || !characterId || !characterName ||
    !characterRole || !destinationName || !learnerStartingPoint || !learnerInput ||
    allowedIntentIds.length === 0 || allowedIntentIds.length !== value.allowedIntentIds.length
  ) {
    return undefined;
  }

  const nextArabic = value.deterministicNextLineArabic;
  const nextMeaning = value.deterministicNextLineMeaning;
  if (
    (nextArabic !== null && (typeof nextArabic !== "string" || nextArabic.length > 300)) ||
    (nextMeaning !== null && (typeof nextMeaning !== "string" || nextMeaning.length > 300))
  ) {
    return undefined;
  }

  return {
    operationId,
    scenarioId,
    beatId,
    characterId,
    characterName,
    characterRole,
    destinationName,
    learnerStartingPoint,
    learnerInput,
    allowedIntentIds,
    deterministicNextLineArabic: nextArabic,
    deterministicNextLineMeaning: nextMeaning,
  };
}

export function parseGeneratedCharacterTurn(
  value: unknown,
  request: ConversationTurnRequest,
): GeneratedCharacterTurn | undefined {
  if (!isRecord(value)) return undefined;

  const probableIntent = value.probableIntent;
  const characterReplyArabic = readBoundedString(value, "characterReplyArabic", 180);
  const characterReplyMeaning = readBoundedString(value, "characterReplyMeaning", 220);
  if (
    (probableIntent !== null &&
      (typeof probableIntent !== "string" || !request.allowedIntentIds.includes(probableIntent))) ||
    !characterReplyArabic || !arabicLetter.test(characterReplyArabic) ||
    !characterReplyMeaning ||
    typeof value.clarificationNeeded !== "boolean" ||
    typeof value.confidence !== "number" || !Number.isFinite(value.confidence) ||
    value.confidence < 0 || value.confidence > 1 ||
    typeof value.shouldContinue !== "boolean"
  ) {
    return undefined;
  }

  return {
    operationId: request.operationId,
    probableIntent,
    characterReplyArabic,
    characterReplyMeaning,
    clarificationNeeded: value.clarificationNeeded,
    confidence: value.confidence,
    shouldContinue: value.shouldContinue,
    validationStatus: "needs_review",
    source: "gemini",
  };
}

export function selectSafeGeneratedAdvance(
  turn: GeneratedCharacterTurn,
  options: readonly LearnerResponseOption[],
): LearnerResponseOption | null {
  if (
    turn.validationStatus !== "needs_review" ||
    !turn.probableIntent ||
    turn.confidence < 0.78 ||
    turn.clarificationNeeded ||
    !turn.shouldContinue
  ) {
    return null;
  }

  const matches = options.filter(
    ({ learningConceptId, validationStatus }) =>
      validationStatus === "verified" && learningConceptId === turn.probableIntent,
  );
  return matches.length === 1 ? matches[0] ?? null : null;
}
