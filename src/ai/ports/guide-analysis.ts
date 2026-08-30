import type {
  EvaluationCandidate,
  KnownConcept,
} from "@/domain/learning/types";

export interface GuideAnalysisInput {
  readonly sessionId: string;
  readonly turnId: string;
  readonly scenarioId: string;
  readonly targetDialectId: string;
  readonly learnerInput: string;
  readonly knownConcepts: readonly KnownConcept[];
  readonly eligibleVerifiedReferenceIds: readonly string[];
}

/**
 * A Guide adapter may propose structured candidates only. The application
 * remains responsible for resolving references, publication gating,
 * prioritization, learner-facing copy, intervention, and retry ownership.
 */
export interface GuideAnalysisOutput {
  readonly sessionId: string;
  readonly turnId: string;
  readonly scenarioId: string;
  readonly candidates: readonly EvaluationCandidate[];
  readonly source: "mock_fixture" | "provider";
}

export interface GuideAnalysisPort {
  analyze(input: GuideAnalysisInput): Promise<GuideAnalysisOutput>;
}
