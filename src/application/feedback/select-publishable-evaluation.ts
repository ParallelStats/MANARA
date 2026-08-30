import type {
  EvaluationCandidate,
  EvaluationResult,
  VersionedContentReference,
} from "@/domain/learning/types";

export function selectPublishableEvaluation(
  result: EvaluationResult,
  authoritativeReferences: readonly VersionedContentReference[] = [],
): EvaluationCandidate | undefined {
  const candidate = result.primaryCandidate;

  if (!candidate || result.intervention === "none") return undefined;
  if (candidate.category === "pronunciation_issue") return undefined;
  if (candidate.references.length === 0) return undefined;
  const authoritativeById = new Map(
    authoritativeReferences.map((reference) => [reference.id, reference]),
  );
  if (
    candidate.references.some((reference) => {
      const authoritative = authoritativeById.get(reference.id);
      return (
        reference.validationStatus !== "verified" ||
        authoritative?.validationStatus !== "verified" ||
        authoritative.version !== reference.version
      );
    })
  ) {
    return undefined;
  }

  return candidate;
}
