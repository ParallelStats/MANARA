import type { FumbleMapInsight, LearningPattern } from "@/domain/insights/types";
import type { LearnerProfile } from "@/domain/learning/types";

const labels: Readonly<Record<string, { en: string; ar: string }>> = {
  "concept-order-coffee": { en: "Café ordering", ar: "الطلب في المقهى" },
  "concept-request": { en: "Local request forms", ar: "صيغ الطلب المحلية" },
  "concept-directions": { en: "Asking for directions", ar: "السؤال عن الاتجاهات" },
  "concept-introduction": { en: "Introductions", ar: "التعارف" },
  "concept-price": { en: "Prices and numbers", ar: "الأسعار والأرقام" },
};

function conceptLabel(conceptId: string) {
  return labels[conceptId] ?? { en: "Everyday communication", ar: "التواصل اليومي" };
}

type InsightInput = Omit<FumbleMapInsight,
  "id" | "conceptId" | "likelySourceDialectId" | "sourceDialectConfidence" |
  "supportingEventIds" | "scenarioIds" | "momentCount" | "successfulRetryCount" | "laterReuseCount">;

function createInsight(pattern: LearningPattern, input: InsightInput): FumbleMapInsight {
  return {
    id: `${input.type.toLowerCase()}::${pattern.key}`,
    conceptId: pattern.conceptId,
    likelySourceDialectId: input.type === "CROSS_DIALECT_PATTERN" ? pattern.likelySourceDialectId : null,
    sourceDialectConfidence: input.type === "CROSS_DIALECT_PATTERN" ? pattern.sourceDialectConfidence : "UNKNOWN",
    supportingEventIds: pattern.eventIds,
    scenarioIds: pattern.scenarioIds,
    momentCount: pattern.verifiedEventCount,
    successfulRetryCount: pattern.retrySuccessCount,
    laterReuseCount: pattern.laterNaturalReuseCount,
    ...input,
  };
}

export function generateFumbleMapInsights(
  profile: LearnerProfile,
  patterns: readonly LearningPattern[],
): readonly FumbleMapInsight[] {
  const insights: FumbleMapInsight[] = [];

  for (const pattern of patterns) {
    const label = conceptLabel(pattern.conceptId);
    const adaptationIds = [
      ...(pattern.categoryEventIds.cross_dialect_transfer ?? []),
      ...(pattern.categoryEventIds.correct_but_locally_unnatural ?? []),
    ];
    const registerIds = pattern.categoryEventIds.msa_or_excessive_formality ?? [];
    const vocabularyIds = pattern.categoryEventIds.vocabulary_error ?? [];
    const difficultyIds = [
      ...vocabularyIds,
      ...(pattern.categoryEventIds.grammar_error ?? []),
      ...(pattern.categoryEventIds.unclear_meaning ?? []),
    ];
    const naturalIds = pattern.categoryEventIds.natural_target_usage ?? [];

    if (adaptationIds.length > 0) {
      insights.push(createInsight(pattern, {
        type: "LOCAL_ADAPTATION",
        evidenceLevel: adaptationIds.length >= 2 ? "PERSISTENT_PATTERN" : "OBSERVATION",
        title: label.en,
        titleAr: label.ar,
        summary: adaptationIds.length >= 2
          ? "You communicate successfully and are steadily tuning your requests to the local setting."
          : "You communicated successfully and met a locally natural alternative.",
        summaryAr: adaptationIds.length >= 2
          ? "تتواصل بنجاح وتكيّف طلباتك تدريجياً مع السياق المحلي."
          : "تواصلت بنجاح وتعرّفت إلى صيغة محلية طبيعية.",
      }));
    }

    if (vocabularyIds.length >= 2) {
      insights.push(createInsight(pattern, {
        type: "VOCABULARY_GAP",
        evidenceLevel: "PERSISTENT_PATTERN",
        title: `${label.en} vocabulary`,
        titleAr: `مفردات ${label.ar}`,
        summary: "This vocabulary has needed support in more than one conversation. A focused revisit should help.",
        summaryAr: "احتاجت هذه المفردات إلى دعم في أكثر من محادثة، وستفيد مراجعة مركّزة.",
      }));
    }

    if (difficultyIds.length >= 2) {
      insights.push(createInsight(pattern, {
        type: "REPEATED_CONCEPT_DIFFICULTY",
        evidenceLevel: "PERSISTENT_PATTERN",
        title: `Revisit ${label.en.toLowerCase()}`,
        titleAr: `راجع ${label.ar}`,
        summary: "This situation has prompted clarification more than once. It is a useful next practice point.",
        summaryAr: "احتاج هذا الموقف إلى توضيح أكثر من مرة، وهو خطوة تدريب مفيدة الآن.",
      }));
    }

    if (pattern.retrySuccessCount >= 2 || (pattern.retrySuccessCount >= 1 && pattern.laterNaturalReuseCount >= 1)) {
      insights.push(createInsight(pattern, {
        type: "ADAPTATION_STRENGTH",
        evidenceLevel: "STRENGTH",
        title: `Adapting quickly in ${label.en.toLowerCase()}`,
        titleAr: `تكيّف سريع في ${label.ar}`,
        summary: "You turned a local alternative into successful communication and are beginning to reuse it.",
        summaryAr: "حوّلت البديل المحلي إلى تواصل ناجح وبدأت تستخدمه من جديد.",
      }));
    }

    if (naturalIds.length >= 2 && pattern.understoodCount >= 2) {
      insights.push(createInsight(pattern, {
        type: "COMMUNICATION_STRENGTH",
        evidenceLevel: "STRENGTH",
        title: `Communicating well in ${label.en.toLowerCase()}`,
        titleAr: `تواصل قوي في ${label.ar}`,
        summary: "You have communicated naturally in this situation across repeated moments.",
        summaryAr: "تواصلت بصورة طبيعية في هذا الموقف عبر لحظات متكررة.",
      }));
    }

    if (registerIds.length > 0 && profile.startingPoint?.kind === "msa_learner") {
      insights.push(createInsight(pattern, {
        type: "REGISTER_ADAPTATION",
        evidenceLevel: registerIds.length >= 2 ? "PERSISTENT_PATTERN" : "OBSERVATION",
        title: "Formal to everyday flexibility",
        titleAr: "مرونة بين الفصيح واليومي",
        summary: "Your formal Arabic was understood; you are adding everyday spoken options for the setting.",
        summaryAr: "فُهمت عربيتك الفصيحة، وأنت تضيف خيارات يومية منطوقة تناسب الموقف.",
      }));
    }

    const crossDialectIds = pattern.categoryEventIds.cross_dialect_transfer ?? [];
    if (crossDialectIds.length >= 2 && pattern.likelySourceDialectId && pattern.sourceDialectConfidence === "HIGH") {
      insights.push(createInsight(pattern, {
        type: "CROSS_DIALECT_PATTERN",
        evidenceLevel: "PERSISTENT_PATTERN",
        title: "A cross-dialect adaptation pattern",
        titleAr: "نمط تكيّف بين اللهجات",
        summary: "Repeated, verified moments show you adapting a familiar variety to this local setting.",
        summaryAr: "تُظهر لحظات موثّقة ومتكررة أنك تكيّف لهجة مألوفة مع هذا السياق المحلي.",
      }));
    }
  }

  const generalEvents = profile.learningEvents.filter((event) =>
    event.type === "scenario_completed" || (event.type === "turn_evaluated" && event.understood));
  if (profile.startingPoint?.kind === "beginner" && generalEvents.length > 0) {
    insights.unshift({
      id: "beginner-progress",
      type: "BEGINNER_PROGRESS",
      evidenceLevel: generalEvents.length >= 2 ? "STRENGTH" : "OBSERVATION",
      conceptId: null,
      title: "Your journey has started",
      titleAr: "بدأت رحلتك",
      summary: "Each completed interaction is building your communication confidence—at your own starting point.",
      summaryAr: "كل تفاعل مكتمل يبني ثقتك في التواصل انطلاقاً من مستواك الحالي.",
      likelySourceDialectId: null,
      sourceDialectConfidence: "UNKNOWN",
      supportingEventIds: generalEvents.map(({ id }) => id),
      scenarioIds: [...new Set(generalEvents.map(({ scenarioId }) => scenarioId))],
      momentCount: generalEvents.length,
      successfulRetryCount: profile.learningEvents.filter(
        (event) => event.type === "retry_completed" && event.outcome === "successful").length,
      laterReuseCount: 0,
    });
  }

  return insights;
}
