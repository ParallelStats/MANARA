import { describe, expect, it } from "vitest";

import { learnerProfileStorageKey } from "@/state/learner-profile-repository";
import { travelMemoryStorageKey } from "@/state/travel-memory-repository";
import {
  createUiPreferencesRepository,
  uiPreferencesStorageKey,
  type UiPreferencesStorage,
} from "@/state/ui-preferences-repository";

class MemoryStorage implements UiPreferencesStorage {
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

class ThrowingStorage implements UiPreferencesStorage {
  getItem(): string | null {
    throw new Error("storage unavailable");
  }

  removeItem(): void {
    throw new Error("storage unavailable");
  }

  setItem(): void {
    throw new Error("storage unavailable");
  }
}

describe("UI preferences repository", () => {
  it("uses browser locale and system appearance only as first defaults", async () => {
    const repository = createUiPreferencesRepository(new MemoryStorage());

    await expect(repository.load({
      languages: ["fr", "ar-AE"],
      prefersDark: false,
    })).resolves.toEqual({
      locale: "ar",
      appearance: "system",
      resolvedAppearance: "light",
      localeSource: "browser_default",
      appearanceSource: "default",
    });
  });

  it("persists and reloads an explicit language and appearance", async () => {
    const storage = new MemoryStorage();
    const repository = createUiPreferencesRepository(storage);

    await expect(repository.update(
      { locale: "ar", appearance: "dark" },
      { languages: ["en-US"], prefersDark: false },
    )).resolves.toEqual({
      persisted: true,
      preferences: {
        locale: "ar",
        appearance: "dark",
        resolvedAppearance: "dark",
        localeSource: "stored",
        appearanceSource: "stored",
      },
    });

    expect(storage.getItem(uiPreferencesStorageKey)).toBe(JSON.stringify({
      schemaVersion: 1,
      locale: "ar",
      appearance: "dark",
    }));

    await expect(repository.load({
      languages: ["en-US"],
      prefersDark: false,
    })).resolves.toMatchObject({
      locale: "ar",
      appearance: "dark",
      resolvedAppearance: "dark",
    });
  });

  it("does not freeze a derived locale when only appearance is selected", async () => {
    const storage = new MemoryStorage();
    const repository = createUiPreferencesRepository(storage);

    await repository.update(
      { appearance: "light" },
      { languages: ["ar"], prefersDark: true },
    );

    expect(JSON.parse(storage.getItem(uiPreferencesStorageKey) ?? "null")).toEqual({
      schemaVersion: 1,
      locale: null,
      appearance: "light",
    });
    await expect(repository.load({ languages: ["en"], prefersDark: true }))
      .resolves.toMatchObject({
        locale: "en",
        appearance: "light",
        localeSource: "browser_default",
        appearanceSource: "stored",
      });
  });

  it.each([
    ["corrupt JSON", "{not json"],
    ["unknown schema version", JSON.stringify({ schemaVersion: 2, locale: "ar", appearance: "dark" })],
    ["unsupported locale", JSON.stringify({ schemaVersion: 1, locale: "fr", appearance: "dark" })],
    ["unsupported appearance", JSON.stringify({ schemaVersion: 1, locale: "ar", appearance: "sepia" })],
  ])("recovers from %s", async (_description, storedValue) => {
    const storage = new MemoryStorage();
    storage.setItem(uiPreferencesStorageKey, storedValue);

    await expect(createUiPreferencesRepository(storage).load({
      languages: ["en-US"],
      prefersDark: true,
    })).resolves.toEqual({
      locale: "en",
      appearance: "system",
      resolvedAppearance: "dark",
      localeSource: "browser_default",
      appearanceSource: "default",
    });
  });

  it("recovers when storage is missing or throws", async () => {
    await expect(createUiPreferencesRepository(undefined).load({
      languages: ["ar"],
      prefersDark: false,
    })).resolves.toMatchObject({
      locale: "ar",
      appearance: "system",
      resolvedAppearance: "light",
    });

    const repository = createUiPreferencesRepository(new ThrowingStorage());
    await expect(repository.load({ languages: ["ar"], prefersDark: true }))
      .resolves.toMatchObject({ locale: "ar", resolvedAppearance: "dark" });
    await expect(repository.update(
      { locale: "en", appearance: "light" },
      { languages: ["ar"], prefersDark: true },
    )).resolves.toMatchObject({
      persisted: false,
      preferences: { locale: "en", appearance: "light", resolvedAppearance: "light" },
    });
    await expect(repository.clear()).resolves.toBe(false);
  });

  it("can reset either explicit preference back to its derived default", async () => {
    const repository = createUiPreferencesRepository(new MemoryStorage());
    await repository.update({ locale: "ar", appearance: "light" });

    await expect(repository.update(
      { locale: null, appearance: null },
      { languages: ["en-GB"], prefersDark: true },
    )).resolves.toMatchObject({
      preferences: {
        locale: "en",
        appearance: "system",
        resolvedAppearance: "dark",
        localeSource: "browser_default",
        appearanceSource: "default",
      },
    });
  });

  it("never mutates learner-profile or travel-memory state", async () => {
    const storage = new MemoryStorage();
    const learnerState = '{"private":"learner-state"}';
    const travelState = '{"route":"travel-state"}';
    storage.setItem(learnerProfileStorageKey, learnerState);
    storage.setItem(travelMemoryStorageKey, travelState);

    const repository = createUiPreferencesRepository(storage);
    await repository.update({ locale: "ar", appearance: "dark" });
    await repository.clear();

    expect(storage.getItem(learnerProfileStorageKey)).toBe(learnerState);
    expect(storage.getItem(travelMemoryStorageKey)).toBe(travelState);
    expect(storage.getItem(uiPreferencesStorageKey)).toBeNull();
  });
});
