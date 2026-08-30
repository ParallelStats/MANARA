import { describe, expect, it } from "vitest";

import { configureLearnerProfile } from "@/application/learning/learner-profile-history";
import { selectTravelTransferContext } from "@/application/learning/select-travel-transfer-context";
import type { DurableLearningEvent, LearnerProfile } from "@/domain/learning/types";
import { createMockLearnerProfile } from "@/state/mock-learner-profile";
import {
  createLearnerProfileRepository,
  learnerProfileStorageKey,
  legacyLearnerProfileStorageKey,
  parseLearnerProfile,
  serializeLearnerProfile,
  type StorageLike,
} from "@/state/learner-profile-repository";

class MemoryStorage implements StorageLike {
  readonly values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

const durableEvaluation: DurableLearningEvent = {
  id: "event-cairo-coffee",
  type: "turn_evaluated",
  destinationId: "destination-cairo",
  scenarioId: "scenario-cairo-cafe",
  learnerStartingPoint: "beginner",
  conceptId: "concept-order-coffee",
  evaluationCategory: "natural_target_usage",
  targetDialectId: "egyptian-cairo",
  matchedVariantId: "variant-egyptian-want-coffee",
  understood: true,
  retryAttempted: false,
  retrySuccess: false,
  validationStatus: "verified",
  occurredAt: "2026-08-29T10:00:00.000Z",
};

describe("learner profile repository", () => {
  it("uses an explicit unconfigured profile when storage is unavailable", async () => {
    const repository = createLearnerProfileRepository(undefined);
    const profile = await repository.load();

    expect(profile).toEqual(createMockLearnerProfile());
    expect(profile.onboardingStatus).toBe("unconfigured");
    expect(profile.startingPoint).toBeNull();
  });

  it("recovers from corrupt local state", async () => {
    const storage = new MemoryStorage();
    storage.setItem(learnerProfileStorageKey, "{not valid json");

    const repository = createLearnerProfileRepository(storage);
    await expect(repository.load()).resolves.toEqual(createMockLearnerProfile());
  });

  it("persists and reloads a configured v2 profile", async () => {
    const storage = new MemoryStorage();
    const repository = createLearnerProfileRepository(storage);
    const configured = configureLearnerProfile(createMockLearnerProfile(), {
      startingPoint: { kind: "dialect_learner", knownVarietyId: "egyptian-cairo" },
      updatedAt: "2026-08-29T09:00:00.000Z",
    });
    const profile: LearnerProfile = {
      ...configured,
      knownConcepts: [
        {
          conceptId: "concept-order-coffee",
          variantIds: ["variant-egyptian-want-coffee"],
          state: "used",
          lastEventAt: durableEvaluation.occurredAt,
        },
      ],
      learningEvents: [durableEvaluation],
      updatedAt: durableEvaluation.occurredAt,
    };

    await expect(repository.save(profile)).resolves.toBe(true);
    await expect(repository.load()).resolves.toEqual(profile);
  });

  it("carries Cairo learning history into a later Abu Dhabi transfer context", async () => {
    const storage = new MemoryStorage();
    const repository = createLearnerProfileRepository(storage);
    const profile: LearnerProfile = {
      ...configureLearnerProfile(createMockLearnerProfile(), {
        startingPoint: { kind: "beginner" },
        updatedAt: "2026-08-29T09:00:00.000Z",
      }),
      knownConcepts: [
        {
          conceptId: "concept-order-coffee",
          variantIds: ["variant-egyptian-want-coffee"],
          state: "used",
          lastEventAt: durableEvaluation.occurredAt,
        },
      ],
      learningEvents: [durableEvaluation],
      updatedAt: durableEvaluation.occurredAt,
    };

    await repository.save(profile);
    const reloaded = await repository.load();

    expect(selectTravelTransferContext(reloaded, "emirati-abu-dhabi")).toEqual({
      sourceDialectId: "egyptian-cairo",
      targetDialectId: "emirati-abu-dhabi",
      conceptIds: ["concept-order-coffee"],
    });
  });

  it("whitelists durable fields even when runtime input contains raw learner text", () => {
    const unsafeEvent = {
      ...durableEvaluation,
      learnerInput: "PRIVATE RAW INPUT",
      normalizedInput: "private raw input",
      transcript: "PRIVATE TRANSCRIPT",
      audio: "PRIVATE AUDIO",
    } as DurableLearningEvent;
    const profile: LearnerProfile = {
      ...configureLearnerProfile(createMockLearnerProfile(), {
        startingPoint: { kind: "beginner" },
        updatedAt: "2026-08-29T09:00:00.000Z",
      }),
      learningEvents: [unsafeEvent],
    };

    const stored = serializeLearnerProfile(profile);

    expect(stored).not.toMatch(/PRIVATE|learnerInput|normalizedInput|transcript|audio/i);
    expect(parseLearnerProfile(JSON.parse(stored))).toEqual({
      ...profile,
      learningEvents: [durableEvaluation],
    });
  });

  it("migrates v1 state safely and leaves onboarding unconfigured", async () => {
    const storage = new MemoryStorage();
    storage.setItem(
      legacyLearnerProfileStorageKey,
      JSON.stringify({
        schemaVersion: 1,
        id: "local-prototype",
        preferredLocale: "ar",
        knownConcepts: [
          {
            conceptId: "concept-order-coffee",
            variantIds: ["variant-egyptian-want-coffee"],
            state: "used",
            lastEventAt: "2026-08-28T10:00:00.000Z",
          },
        ],
        learningEvents: [
          {
            id: "legacy-complete",
            type: "scenario_completed",
            scenarioId: "scenario-cairo-cafe",
            occurredAt: "2026-08-28T10:00:00.000Z",
          },
          {
            id: "legacy-concept-use",
            type: "concept_used",
            scenarioId: "scenario-cairo-cafe",
            conceptId: "concept-order-coffee",
            variantId: "variant-egyptian-want-coffee",
            outcome: "communicated",
            occurredAt: "2026-08-28T10:00:00.000Z",
          },
        ],
        persistOnDevice: true,
        updatedAt: "2026-08-28T10:00:00.000Z",
      }),
    );

    const profile = await createLearnerProfileRepository(storage).load();

    expect(profile).toMatchObject({
      schemaVersion: 2,
      onboardingStatus: "unconfigured",
      startingPoint: null,
      preferredLocale: "ar",
    });
    expect(profile.knownConcepts[0]?.variantIds).toEqual([
      "variant-egyptian-want-coffee",
    ]);
    expect(profile.learningEvents.map(({ id }) => id)).toEqual(["legacy-complete"]);
    expect(storage.getItem(legacyLearnerProfileStorageKey)).toBeNull();
    expect(storage.getItem(learnerProfileStorageKey)).not.toBeNull();
  });

  it("removes prior v1 and v2 data when on-device persistence is disabled", async () => {
    const storage = new MemoryStorage();
    storage.setItem(learnerProfileStorageKey, "old-v2");
    storage.setItem(legacyLearnerProfileStorageKey, "old-v1");
    const repository = createLearnerProfileRepository(storage);
    const profile = { ...createMockLearnerProfile(), persistOnDevice: false } as const;

    await expect(repository.save(profile)).resolves.toBe(true);
    expect(storage.getItem(learnerProfileStorageKey)).toBeNull();
    expect(storage.getItem(legacyLearnerProfileStorageKey)).toBeNull();
  });

  it("clears both storage generations", async () => {
    const storage = new MemoryStorage();
    storage.setItem(learnerProfileStorageKey, "v2");
    storage.setItem(legacyLearnerProfileStorageKey, "v1");
    const repository = createLearnerProfileRepository(storage);

    await expect(repository.clear()).resolves.toBe(true);
    expect(storage.values.size).toBe(0);
  });
});
