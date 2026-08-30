import type { LearnerStartingPointKind, SourceDialectConfidence } from "@/domain/learning/types";

export const fumbleMapInsightTypes = [
  "LOCAL_ADAPTATION",
  "VOCABULARY_GAP",
  "REPEATED_CONCEPT_DIFFICULTY",
  "ADAPTATION_STRENGTH",
  "COMMUNICATION_STRENGTH",
  "BEGINNER_PROGRESS",
  "REGISTER_ADAPTATION",
  "CROSS_DIALECT_PATTERN",
] as const;

export type FumbleMapInsightType = (typeof fumbleMapInsightTypes)[number];
export type EvidenceLevel = "OBSERVATION" | "PERSISTENT_PATTERN" | "STRENGTH";

export interface LearningPattern {
  readonly key: string;
  readonly conceptId: string;
  readonly targetDialectId: string | null;
  readonly likelySourceDialectId: string | null;
  readonly sourceDialectConfidence: SourceDialectConfidence;
  readonly eventIds: readonly string[];
  readonly scenarioIds: readonly string[];
  readonly categories: readonly string[];
  readonly categoryEventIds: Readonly<Record<string, readonly string[]>>;
  readonly understoodCount: number;
  readonly retrySuccessCount: number;
  readonly laterNaturalReuseCount: number;
  readonly verifiedEventCount: number;
}

export interface FumbleMapInsight {
  readonly id: string;
  readonly type: FumbleMapInsightType;
  readonly evidenceLevel: EvidenceLevel;
  readonly conceptId: string | null;
  readonly title: string;
  readonly titleAr: string;
  readonly summary: string;
  readonly summaryAr: string;
  readonly likelySourceDialectId: string | null;
  readonly sourceDialectConfidence: SourceDialectConfidence;
  readonly supportingEventIds: readonly string[];
  readonly scenarioIds: readonly string[];
  readonly momentCount: number;
  readonly successfulRetryCount: number;
  readonly laterReuseCount: number;
}

export interface FumbleMapRecommendation {
  readonly id: string;
  readonly insightId: string;
  readonly title: string;
  readonly titleAr: string;
  readonly reason: string;
  readonly reasonAr: string;
  readonly supportingEventIds: readonly string[];
  readonly practiceHref: string;
}

export interface FumbleMapJourneyMoment {
  readonly scenarioId: string;
  readonly eventIds: readonly string[];
  readonly successful: boolean;
}

export interface FumbleMapModel {
  readonly isEmpty: boolean;
  readonly learnerStartingPoint: LearnerStartingPointKind;
  readonly insights: readonly FumbleMapInsight[];
  readonly recommendations: readonly FumbleMapRecommendation[];
  readonly journey: readonly FumbleMapJourneyMoment[];
}
