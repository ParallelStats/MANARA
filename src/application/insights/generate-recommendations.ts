import type { FumbleMapInsight, FumbleMapRecommendation } from "@/domain/insights/types";
import type { LearnerStartingPointKind } from "@/domain/learning/types";

const priorities: Readonly<Record<LearnerStartingPointKind, readonly FumbleMapInsight["type"][]>> = {
  beginner: ["BEGINNER_PROGRESS", "COMMUNICATION_STRENGTH", "VOCABULARY_GAP", "REPEATED_CONCEPT_DIFFICULTY"],
  msa_learner: ["REGISTER_ADAPTATION", "COMMUNICATION_STRENGTH", "LOCAL_ADAPTATION", "VOCABULARY_GAP"],
  dialect_learner: ["LOCAL_ADAPTATION", "ADAPTATION_STRENGTH", "COMMUNICATION_STRENGTH", "CROSS_DIALECT_PATTERN"],
  heritage_or_partial: ["COMMUNICATION_STRENGTH", "LOCAL_ADAPTATION", "VOCABULARY_GAP", "ADAPTATION_STRENGTH"],
};

const recommendationCopy: Readonly<Record<FumbleMapInsight["type"], {
  title: string; titleAr: string; reason: string; reasonAr: string;
}>> = {
  LOCAL_ADAPTATION: {
    title: "Try another local exchange", titleAr: "جرّب تفاعلاً محلياً آخر",
    reason: "A locally natural form is emerging here; another conversation can make it feel familiar.",
    reasonAr: "بدأت صيغة محلية طبيعية بالظهور هنا، وستجعلها محادثة أخرى أكثر ألفة.",
  },
  VOCABULARY_GAP: {
    title: "Revisit this vocabulary", titleAr: "راجع هذه المفردات",
    reason: "More than one relevant moment needed vocabulary support.",
    reasonAr: "احتاجت أكثر من لحظة مرتبطة إلى دعم في المفردات.",
  },
  REPEATED_CONCEPT_DIFFICULTY: {
    title: "Practice this situation again", titleAr: "تدرّب على هذا الموقف مجدداً",
    reason: "This communicative goal has needed clarification across repeated moments.",
    reasonAr: "احتاج هذا الهدف التواصلي إلى توضيح عبر لحظات متكررة.",
  },
  ADAPTATION_STRENGTH: {
    title: "Build on this adaptation", titleAr: "ابنِ على هذا التكيّف",
    reason: "Successful retries show that the local form is becoming usable.",
    reasonAr: "تُظهر المحاولات الناجحة أن الصيغة المحلية أصبحت قابلة للاستخدام.",
  },
  COMMUNICATION_STRENGTH: {
    title: "Stretch this strength", titleAr: "وسّع هذه القوة",
    reason: "Repeated natural communication makes this a good place for a slightly richer exchange.",
    reasonAr: "يجعل التواصل الطبيعي المتكرر هذا موقفاً مناسباً لتفاعل أكثر غنى قليلاً.",
  },
  BEGINNER_PROGRESS: {
    title: "Continue your journey", titleAr: "واصل رحلتك",
    reason: "Your completed interactions are building a foundation for the next conversation.",
    reasonAr: "تبني تفاعلاتك المكتملة أساساً للمحادثة التالية.",
  },
  REGISTER_ADAPTATION: {
    title: "Practice an everyday spoken option", titleAr: "تدرّب على خيار يومي منطوق",
    reason: "Your formal Arabic communicates; this practice adds flexibility for everyday settings.",
    reasonAr: "تؤدي عربيتك الفصيحة المعنى، ويضيف هذا التدريب مرونة للسياقات اليومية.",
  },
  CROSS_DIALECT_PATTERN: {
    title: "Keep adapting across places", titleAr: "واصل التكيّف بين الأماكن",
    reason: "Repeated verified moments support a useful cross-dialect comparison here.",
    reasonAr: "تدعم لحظات موثقة ومتكررة مقارنة مفيدة بين اللهجات هنا.",
  },
};

export function generateFumbleMapRecommendations(
  insights: readonly FumbleMapInsight[],
  startingPoint: LearnerStartingPointKind,
  practiceHrefForScenario: (scenarioId: string | undefined) => string,
): readonly FumbleMapRecommendation[] {
  const rank = priorities[startingPoint];
  return [...insights]
    .sort((a, b) => {
      const aRank = rank.indexOf(a.type);
      const bRank = rank.indexOf(b.type);
      return (aRank < 0 ? rank.length : aRank) - (bRank < 0 ? rank.length : bRank) || a.id.localeCompare(b.id);
    })
    .slice(0, 3)
    .map((insight) => {
      const copy = recommendationCopy[insight.type];
      return {
        id: `recommendation::${insight.id}`,
        insightId: insight.id,
        ...copy,
        supportingEventIds: insight.supportingEventIds,
        practiceHref: practiceHrefForScenario(insight.scenarioIds[0]),
      };
    });
}
