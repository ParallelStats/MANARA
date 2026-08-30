"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  formatPluralMessage,
  interpolateMessage,
  messages,
  type MessageKey,
  type PluralMessageFamily,
} from "@/i18n/messages";
import {
  getUiTextDirection,
  resolveAppearance,
  type AppearancePreference,
  type ResolvedAppearance,
  type UiLocale,
} from "@/i18n/ui-preferences";
import {
  createUiPreferencesRepository,
  type ResolvedUiPreferences,
} from "@/state/ui-preferences-repository";

type Translate = (
  key: MessageKey,
  parameters?: Readonly<Record<string, string | number>>,
) => string;

interface UiPreferencesContextValue {
  readonly appearance: AppearancePreference;
  readonly direction: "ltr" | "rtl";
  readonly locale: UiLocale;
  readonly persistenceWarning: boolean;
  readonly ready: boolean;
  readonly resolvedAppearance: ResolvedAppearance;
  readonly setAppearance: (appearance: AppearancePreference) => void;
  readonly setLocale: (locale: UiLocale) => void;
  readonly t: Translate;
  readonly tp: (family: PluralMessageFamily, count: number) => string;
}

const serverDefaults: ResolvedUiPreferences = {
  locale: "en",
  appearance: "system",
  resolvedAppearance: "dark",
  localeSource: "browser_default",
  appearanceSource: "default",
};

const UiPreferencesContext = createContext<UiPreferencesContextValue | null>(null);

function applyDocumentPreferences(preferences: ResolvedUiPreferences) {
  const root = document.documentElement;
  root.lang = preferences.locale;
  root.dir = getUiTextDirection(preferences.locale);
  root.dataset.appearance = preferences.appearance;
  root.dataset.theme = preferences.resolvedAppearance;
  root.style.colorScheme = preferences.resolvedAppearance;
  document.querySelector('meta[name="theme-color"]')?.setAttribute(
    "content",
    preferences.resolvedAppearance === "dark" ? "#0b100e" : "#f2ecdf",
  );
}

export function UiPreferencesProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [repository] = useState(createUiPreferencesRepository);
  const [preferences, setPreferences] = useState<ResolvedUiPreferences>(serverDefaults);
  const [ready, setReady] = useState(false);
  const [persistenceWarning, setPersistenceWarning] = useState(false);

  useLayoutEffect(() => {
    let active = true;
    void repository.load().then((loaded) => {
      if (!active) return;
      applyDocumentPreferences(loaded);
      setPreferences(loaded);
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, [repository]);

  useEffect(() => {
    if (preferences.appearance !== "system" || typeof window === "undefined") return;
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!media) return;

    const handleChange = (event: MediaQueryListEvent) => {
      setPreferences((current) => {
        const next = {
          ...current,
          resolvedAppearance: resolveAppearance("system", event.matches),
        };
        applyDocumentPreferences(next);
        return next;
      });
    };
    media.addEventListener?.("change", handleChange);
    return () => media.removeEventListener?.("change", handleChange);
  }, [preferences.appearance]);

  const setLocale = useCallback((locale: UiLocale) => {
    void repository.update({ locale }).then((result) => {
      applyDocumentPreferences(result.preferences);
      setPreferences(result.preferences);
      setPersistenceWarning(!result.persisted);
    });
  }, [repository]);

  const setAppearance = useCallback((appearance: AppearancePreference) => {
    void repository.update({ appearance }).then((result) => {
      applyDocumentPreferences(result.preferences);
      setPreferences(result.preferences);
      setPersistenceWarning(!result.persisted);
    });
  }, [repository]);

  const value = useMemo<UiPreferencesContextValue>(() => ({
    appearance: preferences.appearance,
    direction: getUiTextDirection(preferences.locale),
    locale: preferences.locale,
    persistenceWarning,
    ready,
    resolvedAppearance: preferences.resolvedAppearance,
    setAppearance,
    setLocale,
    t: (key, parameters) => {
      const template = messages[preferences.locale][key];
      return parameters ? interpolateMessage(template, parameters) : template;
    },
    tp: (family, count) => formatPluralMessage(preferences.locale, family, count),
  }), [persistenceWarning, preferences, ready, setAppearance, setLocale]);

  return (
    <UiPreferencesContext.Provider value={value}>
      {children}
    </UiPreferencesContext.Provider>
  );
}

export function useUiPreferences() {
  const context = useContext(UiPreferencesContext);
  if (!context) throw new Error("useUiPreferences must be used inside UiPreferencesProvider.");
  return context;
}
