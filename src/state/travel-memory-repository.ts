import type { StorageLike } from "@/state/learner-profile-repository";

export const travelMemoryStorageKey = "manara:travel-memory:v1";

interface StoredTravelMemory {
  readonly schemaVersion: 1;
  readonly lastDestinationId: string;
}

function resolveSessionStorage(): StorageLike | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.sessionStorage;
  } catch {
    return undefined;
  }
}

export function readLastDestinationId(
  storage: StorageLike | undefined = resolveSessionStorage(),
): string | undefined {
  if (!storage) return undefined;

  try {
    const value: unknown = JSON.parse(storage.getItem(travelMemoryStorageKey) ?? "null");
    if (
      typeof value !== "object" ||
      value === null ||
      !("schemaVersion" in value) ||
      value.schemaVersion !== 1 ||
      !("lastDestinationId" in value) ||
      typeof value.lastDestinationId !== "string"
    ) {
      return undefined;
    }

    return value.lastDestinationId;
  } catch {
    return undefined;
  }
}

export function rememberDestinationVisit(
  lastDestinationId: string,
  storage: StorageLike | undefined = resolveSessionStorage(),
): boolean {
  if (!storage) return false;

  const memory: StoredTravelMemory = {
    schemaVersion: 1,
    lastDestinationId,
  };

  try {
    storage.setItem(travelMemoryStorageKey, JSON.stringify(memory));
    return true;
  } catch {
    return false;
  }
}
