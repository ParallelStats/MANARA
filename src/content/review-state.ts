import type { ReviewMetadata } from "@/domain/content/types";

export const pendingLinguisticReview = {
  validationStatus: "needs_review",
  version: 1,
  evidenceIds: [],
  reviewerIds: [],
  reviewNotes: "Seeded from the product brief; requires qualified human review before learner-facing use.",
} as const satisfies ReviewMetadata;

