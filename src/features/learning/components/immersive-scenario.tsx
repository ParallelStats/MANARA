"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { requestConversationEnhancement } from "@/ai/providers/gemini/request-conversation-enhancement";
import { createConversationOperationGate } from "@/application/conversation/conversation-operation";
import { selectSafeGeneratedAdvance } from "@/application/conversation/conversation-safety";
import { evaluateLearnerTurn } from "@/application/evaluation/deterministic-evaluator";
import { normalizeLearnerInput } from "@/application/evaluation/normalize-learner-input";
import {
  recordDurableLearningEvent,
  recordLearningEvent,
  recordRetryOutcome,
} from "@/application/learning/learner-profile";
import { cityRoute, worldRoute } from "@/application/travel/routes";
import type { DestinationSummary } from "@/application/travel/select-destination-summaries";
import {
  crossDialectTransferRules,
  dialectVariants,
} from "@/content/linguistic-concepts";
import type { Character, Scenario } from "@/domain/content/types";
import type {
  EvaluationResult,
  LearnerProfile,
  LearningEvent,
} from "@/domain/learning/types";
import type {
  CharacterVisualState,
  DialoguePack,
  DialogueLine,
  LearnerResponseOption,
} from "@/domain/scenario/types";
import type { AvailableScenarioHotspot } from "@/domain/travel/types";
import { LearnerAids } from "@/features/learning/components/learner-aids";
import { LocalCharacter } from "@/features/learning/components/local-character";
import { ManaraGuide } from "@/features/learning/components/manara-guide";
import { VoiceDock } from "@/features/learning/components/voice-dock";
import { useUiPreferences } from "@/features/preferences/ui-preferences-provider";
import {
  getDialogueBeat,
  resolveDeterministicResponseOption,
  resolveDialogueAdvance,
  shouldShowGuideForTurn,
} from "@/features/learning/lib/scenario-progression";
import { createBrowserSpeechPlayback } from "@/media/browser/browser-speech-playback";
import type { MessageKey } from "@/i18n/messages";
import { selectLocalizedText } from "@/i18n/select-localized-text";

import styles from "../scenario-scene.module.css";

type Aid = "hint" | "translation" | "transliteration" | "vocabulary";
type ScenePhase =
  | "character_speaking"
  | "completed"
  | "feedback"
  | "processing"
  | "ready"
  | "recoverable_error";

type ScenarioErrorMessageKey =
  | "scenario.error.openingMissing"
  | "scenario.error.responseStale"
  | "scenario.error.nextMissing"
  | "scenario.error.nextUnavailable"
  | "scenario.error.paused";

const progressionErrorKeys: Readonly<Record<string, ScenarioErrorMessageKey>> = {
  "That response no longer belongs to this moment in the conversation.": "scenario.error.responseStale",
  "The conversation cannot find its next moment.": "scenario.error.nextMissing",
  "The next moment in the conversation is unavailable.": "scenario.error.nextUnavailable",
};

function progressionErrorKey(message: string): ScenarioErrorMessageKey {
  return progressionErrorKeys[message] ?? "scenario.error.paused";
}

interface ImmersiveScenarioProps {
  readonly character: Character;
  readonly conversationEnhancementAvailable: boolean;
  readonly destination: DestinationSummary;
  readonly hotspot: AvailableScenarioHotspot;
  readonly pack: DialoguePack;
  readonly profile: LearnerProfile;
  readonly scenario: Scenario;
  readonly updateProfile: (updater: (profile: LearnerProfile) => LearnerProfile) => void;
}

function createEventId(prefix: string) {
  const randomId = globalThis.crypto?.randomUUID?.();
  return `${prefix}-${randomId ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
}

function referencedVariantId(evaluation: EvaluationResult) {
  const variantIds = new Set<string>(dialectVariants.map(({ id }) => id));
  return evaluation.primaryCandidate?.references.find(({ id }) => variantIds.has(id))?.id;
}

function suggestedVariantId(evaluation: EvaluationResult) {
  if (!evaluation.naturalAlternative) return undefined;
  const normalizedAlternative = normalizeLearnerInput(evaluation.naturalAlternative);
  return dialectVariants.find(
    (variant) => normalizeLearnerInput(variant.surfaceAr) === normalizedAlternative,
  )?.id;
}

function toLearningEvent(
  evaluation: EvaluationResult,
  profile: LearnerProfile,
  destinationId: string,
  fallbackConceptId: string,
  occurredAt: string,
): LearningEvent {
  const matchedVariantId = referencedVariantId(evaluation);
  const alternativeId = suggestedVariantId(evaluation);

  return {
    id: evaluation.id,
    type: "turn_evaluated",
    destinationId,
    scenarioId: evaluation.scenarioId,
    learnerStartingPoint: profile.startingPoint?.kind ?? "beginner",
    conceptId: evaluation.learningConceptId ?? fallbackConceptId,
    evaluationCategory: evaluation.category,
    targetDialectId: evaluation.targetDialectId,
    ...(evaluation.likelySourceDialectId
      ? { likelySourceDialectId: evaluation.likelySourceDialectId }
      : {}),
    ...(evaluation.likelySourceDialectId
      ? {
          sourceDialectConfidence:
            evaluation.validationStatus === "verified" ? "HIGH" as const : "UNKNOWN" as const,
        }
      : {}),
    ...(matchedVariantId ? { matchedVariantId } : {}),
    ...(alternativeId ? { suggestedAlternativeId: alternativeId } : {}),
    understood: evaluation.understood,
    retryAttempted: false,
    retrySuccess: false,
    validationStatus: evaluation.validationStatus,
    occurredAt,
    learnerInput: evaluation.learnerInput,
    normalizedInput: evaluation.normalizedInput,
  };
}

function responseForRetry(
  evaluation: EvaluationResult,
  options: readonly LearnerResponseOption[],
) {
  if (evaluation.validationStatus === "verified" && evaluation.naturalAlternative) {
    const naturalAlternative = normalizeLearnerInput(evaluation.naturalAlternative);
    const matchingOption = options.find(
      ({ arabicText }) => normalizeLearnerInput(arabicText) === naturalAlternative,
    );
    if (matchingOption) return matchingOption;
  }

  return options.find(({ kind }) => kind === "target_dialect" || kind === "beginner_model");
}

function generatedDialogueLine(
  operationId: string,
  scenarioId: string,
  characterId: string,
  arabicText: string,
  englishMeaning: string,
  probableIntent: string | null,
): DialogueLine {
  return {
    id: `generated-${operationId}`,
    scenarioId,
    characterId,
    speaker: "local_character",
    arabicText,
    englishMeaning,
    dialectOrRegister: "generated conversational draft",
    communicativeIntent: probableIntent ?? "clarification",
    linguisticNotes: "Generated for this turn and not a reviewed dialect claim.",
    reviewerNote: "Transient Gemini output; never eligible for automatic verification.",
    validationStatus: "needs_review",
    version: 1,
    evidenceIds: [],
    reviewerIds: [],
  };
}

function deterministicClarificationLine(
  operationId: string,
  scenarioId: string,
  characterId: string,
  promptArabic: string,
  promptEnglish: string,
): DialogueLine {
  return {
    id: `clarification-${operationId}`,
    scenarioId,
    characterId,
    speaker: "local_character",
    arabicText: `ممكن تعيدها بطريقة ثانية؟ ${promptArabic}`,
    englishMeaning: `Could you try that another way? ${promptEnglish}`,
    dialectOrRegister: "neutral conversational clarification draft",
    communicativeIntent: "clarification",
    linguisticNotes: "Deterministic scene redirection when the learner's intent is not recoverable.",
    reviewerNote: "Review the neutral clarification wording before linguistic publication.",
    validationStatus: "needs_review",
    version: 1,
    evidenceIds: [],
    reviewerIds: [],
  };
}

export function ImmersiveScenario({
  character,
  conversationEnhancementAvailable,
  destination,
  hotspot,
  pack,
  profile,
  scenario,
  updateProfile,
}: ImmersiveScenarioProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const { locale, t } = useUiPreferences();
  const startingBeat = getDialogueBeat(pack, pack.startingBeatId);
  const [currentBeatId, setCurrentBeatId] = useState(pack.startingBeatId);
  const [phase, setPhase] = useState<ScenePhase>(
    startingBeat ? "character_speaking" : "recoverable_error",
  );
  const [visualState, setVisualState] = useState<CharacterVisualState>(
    startingBeat ? "speaking" : "clarification_reaction",
  );
  const [enabledAids, setEnabledAids] = useState<ReadonlySet<Aid>>(() => {
    const initialAids = new Set<Aid>();
    if (profile.support.translation === "always") initialAids.add("translation");
    if (profile.support.phraseHints === "proactive") initialAids.add("hint");
    if (profile.support.vocabularyPreview) initialAids.add("vocabulary");
    return initialAids;
  });
  const [activeEvaluation, setActiveEvaluation] = useState<EvaluationResult | null>(null);
  const [pendingOption, setPendingOption] = useState<LearnerResponseOption | null>(null);
  const [generatedLine, setGeneratedLine] = useState<DialogueLine | null>(null);
  const [errorMessageKey, setErrorMessageKey] = useState<ScenarioErrorMessageKey | null>(
    startingBeat ? null : "scenario.error.openingMissing",
  );
  const completionHeadingRef = useRef<HTMLHeadingElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [operationGate] = useState(createConversationOperationGate);
  const [speechPlayback] = useState(createBrowserSpeechPlayback);

  const focusCompletionHeading = useCallback((heading: HTMLHeadingElement | null) => {
    completionHeadingRef.current = heading;
    heading?.focus({ preventScroll: true });
  }, []);
  const focusErrorHeading = useCallback((heading: HTMLHeadingElement | null) => {
    heading?.focus({ preventScroll: true });
  }, []);

  const currentBeat = useMemo(
    () => getDialogueBeat(pack, currentBeatId),
    [currentBeatId, pack],
  );
  const completedBeats = currentBeat
    ? Math.max(0, Math.min(pack.beats.length, currentBeat.sequence - 1))
    : 0;

  const clearPendingTimer = useCallback(() => {
    if (!timerRef.current) return;
    clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  useEffect(() => () => {
    clearPendingTimer();
    operationGate.cancel();
    speechPlayback.cancel();
  }, [clearPendingTimer, operationGate, scenario.id, speechPlayback]);

  const completeScenario = useCallback(() => {
    const occurredAt = new Date().toISOString();
    updateProfile((currentProfile) => recordDurableLearningEvent(currentProfile, {
      id: createEventId("scenario-complete"),
      type: "scenario_completed",
      scenarioId: scenario.id,
      occurredAt,
    }));
    setActiveEvaluation(null);
    setPendingOption(null);
    setPhase("completed");
    setVisualState("positive_reaction");
  }, [scenario.id, updateProfile]);

  const advanceWithOption = useCallback((option: LearnerResponseOption) => {
    if (!currentBeat) return;
    const advance = resolveDialogueAdvance(pack, currentBeat, option);
    setActiveEvaluation(null);
    setPendingOption(null);

    if (advance.kind === "complete") {
      completeScenario();
      return;
    }
    if (advance.kind === "recoverable_error") {
      setErrorMessageKey(progressionErrorKey(advance.message));
      setPhase("recoverable_error");
      setVisualState("clarification_reaction");
      return;
    }

    setPhase("character_speaking");
    setVisualState("speaking");
    setCurrentBeatId(advance.beat.id);
  }, [completeScenario, currentBeat, pack]);

  useEffect(() => {
    if (!currentBeat || phase !== "character_speaking") return;

    clearPendingTimer();
    const line = generatedLine ?? currentBeat.characterLine;
    const minimumCaptionDuration = reduceMotion
      ? 120
      : Math.min(2_600, Math.max(900, line.arabicText.length * 42));
    const playbackWatchdogDuration = Math.min(
      18_000,
      Math.max(7_000, line.arabicText.length * 260),
    );
    let active = true;
    let playbackFinished = false;
    let captionDurationElapsed = false;
    let finished = false;

    const finishSpeaking = () => {
      if (!active || finished || !playbackFinished || !captionDurationElapsed) return;
      finished = true;
      if (generatedLine && pendingOption) {
        setGeneratedLine(null);
        advanceWithOption(pendingOption);
        return;
      }
      setPhase("ready");
      setVisualState("listening");
    };

    const captionTimer = window.setTimeout(() => {
      captionDurationElapsed = true;
      finishSpeaking();
    }, minimumCaptionDuration);
    const playbackWatchdog = window.setTimeout(() => {
      speechPlayback.cancel();
      playbackFinished = true;
      finishSpeaking();
    }, playbackWatchdogDuration);

    void speechPlayback.speak({
      text: line.arabicText,
      language: character.voiceProfile.locale,
      preferredGender: character.voiceProfile.preferredGender,
    }).finally(() => {
      playbackFinished = true;
      window.clearTimeout(playbackWatchdog);
      finishSpeaking();
    });

    return () => {
      active = false;
      window.clearTimeout(captionTimer);
      window.clearTimeout(playbackWatchdog);
      speechPlayback.cancel();
    };
  }, [
    advanceWithOption,
    character.voiceProfile.locale,
    character.voiceProfile.preferredGender,
    clearPendingTimer,
    currentBeat,
    generatedLine,
    pendingOption,
    phase,
    reduceMotion,
    speechPlayback,
  ]);

  const evaluateResponse = useCallback((
    learnerInput: string,
    inputMode: EvaluationResult["inputMode"],
    option: LearnerResponseOption | null,
    retryAttemptCount = 0,
  ) => {
    if (!currentBeat) return null;

    const evaluation = evaluateLearnerTurn(
      { variants: dialectVariants, transferRules: crossDialectTransferRules },
      {
        evaluationId: createEventId("evaluation"),
        turnId: currentBeat.id,
        scenarioId: scenario.id,
        targetDialectId: scenario.targetDialectId,
        inputMode,
        learnerInput,
        learnerProfile: profile,
        retryAttemptCount,
      },
    );
    const occurredAt = new Date().toISOString();
    const conceptId = option?.learningConceptId
      ?? currentBeat.responseOptions[0]?.learningConceptId
      ?? scenario.learningConceptIds[0]
      ?? "concept-unclassified";
    const learningEvent = toLearningEvent(
      evaluation,
      profile,
      destination.id,
      conceptId,
      occurredAt,
    );
    updateProfile((currentProfile) => recordLearningEvent(currentProfile, learningEvent));
    return evaluation;
  }, [currentBeat, destination.id, profile, scenario, updateProfile]);

 const submitResponse = useCallback(async (
  learnerInput: string,
  inputMode: EvaluationResult["inputMode"],
  option: LearnerResponseOption | null,
) => {
  if (!currentBeat || phase !== "ready") return;

  const operation = operationGate.start();
  if (!operation) return;

  clearPendingTimer();
  setPhase("processing");
  setVisualState("thinking");
  setPendingOption(option);
  setGeneratedLine(null);

  const presentDeterministicClarification = () => {
    setPendingOption(null);
    setGeneratedLine(
      deterministicClarificationLine(
        operation.id,
        scenario.id,
        character.id,
        currentBeat.prompt.ar,
        currentBeat.prompt.en,
      ),
    );
    operationGate.finish(operation.id);
    setPhase("character_speaking");
    setVisualState("clarification_reaction");
  };

  try {
    const evaluation = evaluateResponse(
      learnerInput,
      inputMode,
      option,
    );

    if (!evaluation) {
      throw new Error("Evaluation could not start.");
    }

    let resolvedOption = option;

    if (
      inputMode !== "scripted" &&
      conversationEnhancementAvailable
    ) {
      const plannedAdvance = resolvedOption
        ? resolveDialogueAdvance(
            pack,
            currentBeat,
            resolvedOption,
          )
        : null;

      const plannedLine =
        plannedAdvance?.kind === "next_beat"
          ? plannedAdvance.beat.characterLine
          : null;

      const result = await requestConversationEnhancement(
        {
          operationId: operation.id,
          scenarioId: scenario.id,
          beatId: currentBeat.id,
          characterId: character.id,
          characterName: character.displayName.en,
          characterRole: `${character.relationship}; ${character.personality}`,
          destinationName: destination.name.en,
          learnerStartingPoint:
            profile.startingPoint?.kind ?? "beginner",
          learnerInput,
          allowedIntentIds: [
            ...new Set(
              currentBeat.responseOptions.map(
                ({ learningConceptId }) => learningConceptId,
              ),
            ),
          ],
          deterministicNextLineArabic:
            plannedLine?.arabicText ?? null,
          deterministicNextLineMeaning:
            plannedLine?.englishMeaning ?? null,
        },
        operation.signal,
      );

      if (!operationGate.isCurrent(operation.id)) return;

      if (result.ok) {
        resolvedOption ??= selectSafeGeneratedAdvance(
          result.value,
          currentBeat.responseOptions,
        );

        const canAdvance = Boolean(
          resolvedOption &&
            !result.value.clarificationNeeded &&
            result.value.shouldContinue,
        );

        setPendingOption(
          canAdvance ? resolvedOption : null,
        );

        setGeneratedLine(
          generatedDialogueLine(
            operation.id,
            scenario.id,
            character.id,
            result.value.characterReplyArabic,
            result.value.characterReplyMeaning,
            result.value.probableIntent,
          ),
        );

        operationGate.finish(operation.id);
        setPhase("character_speaking");
        setVisualState("speaking");
        return;
      }
    }

    if (
      inputMode !== "scripted" &&
      !resolvedOption
    ) {
      presentDeterministicClarification();
      return;
    }

    const needsGuide = shouldShowGuideForTurn(
      evaluation,
      resolvedOption,
    );

    setPendingOption(resolvedOption);

    timerRef.current = setTimeout(() => {
      if (!operationGate.isCurrent(operation.id)) return;

      operationGate.finish(operation.id);

      setVisualState(
        evaluation.understood
          ? "positive_reaction"
          : "clarification_reaction",
      );

      timerRef.current = null;

      if (needsGuide || !resolvedOption) {
        setActiveEvaluation(evaluation);
        setPhase("feedback");
        return;
      }

      advanceWithOption(resolvedOption);
    }, reduceMotion ? 40 : 240);
  } catch {
    if (!operationGate.isCurrent(operation.id)) return;

    setActiveEvaluation(null);

    if (inputMode !== "scripted") {
      presentDeterministicClarification();
    } else {
      operationGate.finish(operation.id);
      setPhase("ready");
      setVisualState("listening");
    }
  }
}, [
  advanceWithOption,
  character,
  clearPendingTimer,
  conversationEnhancementAvailable,
  currentBeat,
  destination,
  evaluateResponse,
  pack,
  phase,
  profile,
  reduceMotion,
  scenario.id,
  operationGate,
]);

  function submitOption(option: LearnerResponseOption) {
    void submitResponse(option.arabicText, "scripted", option);
  }

  function submitInput(value: string, inputMode: "text" | "audio") {
    const resolvedOption = currentBeat
      ? resolveDeterministicResponseOption(value, currentBeat.responseOptions)
      : null;
    void submitResponse(value, inputMode, resolvedOption);
  }

  function continueAfterGuide() {
    if (pendingOption) {
      advanceWithOption(pendingOption);
      return;
    }
    setActiveEvaluation(null);
    setPhase("ready");
    setVisualState("listening");
  }

  function retryWithScriptedResponse() {
    if (!activeEvaluation || !currentBeat) return;
    const retryOption = responseForRetry(activeEvaluation, currentBeat.responseOptions);
    if (!retryOption) return;

    const retryEvaluation = evaluateResponse(
      retryOption.arabicText,
      "scripted",
      retryOption,
      1,
    );
    if (!retryEvaluation) return;

    const retrySuccessful =
      retryEvaluation.validationStatus === "verified" &&
      retryEvaluation.category === "natural_target_usage";
    updateProfile((currentProfile) => recordRetryOutcome(currentProfile, {
      evaluationEventId: activeEvaluation.id,
      eventId: createEventId("retry"),
      outcome: retrySuccessful ? "successful" : "continued",
      occurredAt: new Date().toISOString(),
    }));
    setVisualState(retrySuccessful ? "positive_reaction" : "speaking");
    advanceWithOption(retryOption);
  }

  function retryCurrentTurn() {
    clearPendingTimer();
    operationGate.cancel();
    speechPlayback.cancel();
    setErrorMessageKey(null);
    setActiveEvaluation(null);
    setPendingOption(null);
    setGeneratedLine(null);
    setPhase("ready");
    setVisualState("listening");
  }

  function restartScenario() {
    clearPendingTimer();
    operationGate.cancel();
    speechPlayback.cancel();
    setCurrentBeatId(pack.startingBeatId);
    setErrorMessageKey(null);
    setActiveEvaluation(null);
    setPendingOption(null);
    setGeneratedLine(null);
    setPhase("character_speaking");
    setVisualState("speaking");
  }

  function toggleAid(aid: Aid) {
    setEnabledAids((current) => {
      const next = new Set(current);
      if (next.has(aid)) next.delete(aid);
      else next.add(aid);
      return next;
    });
  }

  if (!currentBeat) {
    return (
      <section className={styles.sceneFailure} role="alert">
        <h1>{t("scenario.loadFailure.title")}</h1>
        <p>{t("scenario.loadFailure.body")}</p>
        <Link href={cityRoute(destination.slug)} className={`${styles.primaryAction} focus-ring`}>
          {t("scenario.failure.returnCity", { city: selectLocalizedText(destination.name, locale) })}
        </Link>
      </section>
    );
  }

  const retryOption = activeEvaluation
    ? responseForRetry(activeEvaluation, currentBeat.responseOptions)
    : undefined;
  const offerRetry = Boolean(
    retryOption && (
      activeEvaluation?.retryRecommended ||
      pendingOption === null ||
      pendingOption?.kind === "msa" ||
      pendingOption?.kind === "source_dialect" ||
      pendingOption?.kind === "unknown"
    ),
  );

  return (
    <section
      className={styles.stage}
      aria-label={t("scenario.context.conversationLabel", { title: selectLocalizedText(hotspot.name, locale) })}
    >
      <LocalCharacter
        character={character}
        line={generatedLine ?? currentBeat.characterLine}
        scenarioId={scenario.id}
        showTranslation={enabledAids.has("translation")}
        showTransliteration={enabledAids.has("transliteration")}
        visualState={visualState}
        guideOverlay={(
          <AnimatePresence mode="wait" initial={false}>
            {phase === "completed" ? (
              <motion.div
                key="completed"
                className={styles.guideScrim}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <section className={styles.completionOverlay} aria-labelledby="scenario-complete-title">
                  <span className={styles.completionMark} aria-hidden="true">✓</span>
                  <h1 id="scenario-complete-title" ref={focusCompletionHeading} tabIndex={-1}>
                    {t("scenario.complete.title")}
                  </h1>
                  <p>{t("scenario.complete.body")}</p>
                  <div className={styles.completionActions}>
                    <Link href={cityRoute(destination.slug)} className={`${styles.primaryAction} focus-ring`}>
                      {t("scenario.complete.returnCity", { city: selectLocalizedText(destination.name, locale) })}
                    </Link>
                    <Link href={worldRoute()} className={`${styles.secondaryAction} focus-ring`}>
                      {t("scenario.complete.travelElsewhere")}
                    </Link>
                    <button type="button" className={`${styles.textAction} focus-ring`} onClick={restartScenario}>
                      {t("scenario.complete.replay")}
                    </button>
                  </div>
                </section>
              </motion.div>
            ) : phase === "recoverable_error" ? (
              <motion.div
                key="error"
                className={styles.guideScrim}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <section className={styles.errorOverlay} role="alert">
                  <h2 ref={focusErrorHeading} tabIndex={-1}>{t("scenario.error.paused")}</h2>
                  <p>{t((errorMessageKey ?? "scenario.error.paused") as MessageKey)}</p>
                  <button type="button" className={`${styles.primaryAction} focus-ring`} onClick={retryCurrentTurn}>
                    {t("scenario.error.retry")}
                  </button>
                </section>
              </motion.div>
            ) : phase === "feedback" && activeEvaluation ? (
              <motion.div
                key="guide"
                className={styles.guideScrim}
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <ManaraGuide
                  cityName={destination.name}
                  destinationId={destination.id}
                  evaluation={activeEvaluation}
                  continueLabel={pendingOption ? t("guide.continueConversation") : t("guide.returnMoment")}
                  onContinue={continueAfterGuide}
                  {...(offerRetry && retryOption
                    ? {
                        retryText: retryOption.arabicText,
                        onRetry: retryWithScriptedResponse,
                      }
                    : {})}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        )}
      >
        <p className={styles.sceneContext}>
          <span>{selectLocalizedText(destination.name, locale)}</span>
          <span aria-hidden="true"> · </span>
          <span>{selectLocalizedText(hotspot.name, locale)}</span>
        </p>
        <div className={styles.progressDots} aria-label={t("a11y.conversationProgress")}>
          {pack.beats.map((beat, index) => (
            <span key={beat.id} data-complete={index <= completedBeats} aria-hidden="true" />
          ))}
        </div>

        {phase !== "completed" && phase !== "feedback" && phase !== "recoverable_error" ? (
          <motion.div
            key={`turn-${currentBeat.id}`}
            className={styles.turnControls}
            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <VoiceDock
              key={`${currentBeat.id}-${phase}`}
              beat={currentBeat}
              busy={phase !== "ready"}
              language={destination.slug === "cairo" ? "ar-EG" : "ar-AE"}
              showTransliteration={enabledAids.has("transliteration")}
              utilityControl={(
                <LearnerAids
                  beat={currentBeat}
                  enabledAids={enabledAids}
                  transliterationAvailable={profile.support.transliteration === "available"}
                  onToggle={toggleAid}
                />
              )}
              onVoiceStateChange={(state) => {
                if (phase !== "ready") return;
                setVisualState(state === "processing" ? "thinking" : "listening");
              }}
              onSubmitAudio={(value) => submitInput(value, "audio")}
              onSubmitOption={submitOption}
              onSubmitText={(value) => submitInput(value, "text")}
            />
          </motion.div>
        ) : null}
      </LocalCharacter>
    </section>
  );
}
