import { describe, expect, it } from "vitest";

import type { StorageLike } from "@/state/learner-profile-repository";
import {
  readLastDestinationId,
  rememberDestinationVisit,
  travelMemoryStorageKey,
} from "@/state/travel-memory-repository";

function memoryStorage(): StorageLike {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    removeItem: (key) => void values.delete(key),
    setItem: (key, value) => void values.set(key, value),
  };
}

describe("travel memory", () => {
  it("remembers the last visited city for the next route arc", () => {
    const storage = memoryStorage();

    expect(rememberDestinationVisit("destination-cairo", storage)).toBe(true);
    expect(readLastDestinationId(storage)).toBe("destination-cairo");
  });

  it("ignores malformed or unavailable browser storage", () => {
    const storage = memoryStorage();
    storage.setItem(travelMemoryStorageKey, "not-json");

    expect(readLastDestinationId(storage)).toBeUndefined();
    expect(readLastDestinationId(undefined)).toBeUndefined();
    expect(rememberDestinationVisit("destination-cairo", undefined)).toBe(false);
  });
});
