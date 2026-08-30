import {
  isAppearancePreference,
  isUiLocale,
  readBrowserPreferenceEnvironment,
  resolveAppearance,
  resolveInitialLocale,
  type AppearancePreference,
  type ResolvedAppearance,
  type UiLocale,
  type UiPreferenceEnvironment,
} from "@/i18n/ui-preferences";

export const uiPreferencesStorageKey = "manara:ui-preferences:v1";

export interface UiPreferenceSelection {
  readonly schemaVersion: 1;
  readonly locale: UiLocale | null;
  readonly appearance: AppearancePreference | null;
}

export interface ResolvedUiPreferences {
  readonly locale: UiLocale;
  readonly appearance: AppearancePreference;
  readonly resolvedAppearance: ResolvedAppearance;
  readonly localeSource: "browser_default" | "stored";
  readonly appearanceSource: "default" | "stored";
}

export interface UiPreferencePatch {
  readonly locale?: UiLocale | null;
  readonly appearance?: AppearancePreference | null;
}

export interface UiPreferenceUpdateResult {
  readonly preferences: ResolvedUiPreferences;
  readonly persisted: boolean;
}

export interface UiPreferencesStorage {
  getItem(key: string): string | null;
  removeItem(key: string): void;
  setItem(key: string, value: string): void;
}

export interface UiPreferencesRepository {
  clear(): Promise<boolean>;
  load(environment?: UiPreferenceEnvironment): Promise<ResolvedUiPreferences>;
  update(
    patch: UiPreferencePatch,
    environment?: UiPreferenceEnvironment,
  ): Promise<UiPreferenceUpdateResult>;
}

const emptySelection: UiPreferenceSelection = {
  schemaVersion: 1,
  locale: null,
  appearance: null,
};

function parseSelection(value: unknown): UiPreferenceSelection | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined;

  const record = value as Record<string, unknown>;
  if (record.schemaVersion !== 1) return undefined;

  const locale = record.locale;
  const appearance = record.appearance;
  if (locale !== null && !isUiLocale(locale)) return undefined;
  if (appearance !== null && !isAppearancePreference(appearance)) return undefined;

  return {
    schemaVersion: 1,
    locale,
    appearance,
  };
}

function parseStoredSelection(value: string | null): UiPreferenceSelection | undefined {
  if (!value) return undefined;

  try {
    return parseSelection(JSON.parse(value) as unknown);
  } catch {
    return undefined;
  }
}

function resolvePreferences(
  selection: UiPreferenceSelection,
  environment: UiPreferenceEnvironment,
): ResolvedUiPreferences {
  const locale = selection.locale ?? resolveInitialLocale(environment.languages);
  const appearance = selection.appearance ?? "system";

  return {
    locale,
    appearance,
    resolvedAppearance: resolveAppearance(appearance, environment.prefersDark),
    localeSource: selection.locale ? "stored" : "browser_default",
    appearanceSource: selection.appearance ? "stored" : "default",
  };
}

function mergeSelection(
  selection: UiPreferenceSelection,
  patch: UiPreferencePatch,
): UiPreferenceSelection {
  return {
    schemaVersion: 1,
    locale: patch.locale === undefined ? selection.locale : patch.locale,
    appearance: patch.appearance === undefined ? selection.appearance : patch.appearance,
  };
}

function serializeSelection(selection: UiPreferenceSelection) {
  return JSON.stringify(selection);
}

function resolveBrowserStorage(): UiPreferencesStorage | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

function readSelection(storage: UiPreferencesStorage | undefined) {
  if (!storage) return emptySelection;

  try {
    return parseStoredSelection(storage.getItem(uiPreferencesStorageKey)) ?? emptySelection;
  } catch {
    return emptySelection;
  }
}

function resolveEnvironment(environment: UiPreferenceEnvironment | undefined) {
  return environment ?? readBrowserPreferenceEnvironment();
}

export function createUiPreferencesRepository(
  storage: UiPreferencesStorage | undefined = resolveBrowserStorage(),
): UiPreferencesRepository {
  return {
    async clear() {
      if (!storage) return false;

      try {
        storage.removeItem(uiPreferencesStorageKey);
        return true;
      } catch {
        return false;
      }
    },

    async load(environment) {
      return resolvePreferences(readSelection(storage), resolveEnvironment(environment));
    },

    async update(patch, environment) {
      const selection = mergeSelection(readSelection(storage), patch);
      let persisted = false;

      if (storage) {
        try {
          storage.setItem(uiPreferencesStorageKey, serializeSelection(selection));
          persisted = true;
        } catch {
          persisted = false;
        }
      }

      return {
        preferences: resolvePreferences(selection, resolveEnvironment(environment)),
        persisted,
      };
    },
  };
}
