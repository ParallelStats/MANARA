"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useId, useRef, useState } from "react";

import { useUiPreferences } from "@/features/preferences/ui-preferences-provider";
import type { AppearancePreference, UiLocale } from "@/i18n/ui-preferences";

import styles from "./preferences.module.css";

const languages = [
  { id: "ar", nativeLabel: "العربية" },
  { id: "en", nativeLabel: "English" },
] as const satisfies readonly Readonly<{ id: UiLocale; nativeLabel: string }>[];

const appearances = ["system", "light", "dark"] as const satisfies readonly AppearancePreference[];

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9M13 4v6M7 14v6" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

export function SettingsSheet() {
  const { appearance, locale, persistenceWarning, setAppearance, setLocale, t } = useUiPreferences();
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion() ?? false;
  const dialogId = useId();
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus({ preventScroll: true });
    const launcher = launcherRef.current;
    const main = document.getElementById("main-content");
    main?.setAttribute("inert", "");
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key !== "Tab") return;
      const focusable = sheetRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      main?.removeAttribute("inert");
      launcher?.focus({ preventScroll: true });
    };
  }, [open]);

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        className={`${styles.launcher} focus-ring`}
        aria-label={t("a11y.settings")}
        aria-expanded={open}
        aria-controls={dialogId}
        onClick={() => setOpen(true)}
      >
        <SettingsIcon />
        <span>{t("settings.open")}</span>
      </button>

      <AnimatePresence>
        {open ? (
          <>
            <motion.button
              key="settings-backdrop"
              type="button"
              className={styles.backdrop}
              aria-label={t("settings.close")}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.18 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              ref={sheetRef}
              id={dialogId}
              key="settings-sheet"
              className={styles.sheet}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              initial={reduceMotion ? false : { opacity: 0, x: locale === "ar" ? -24 : 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: locale === "ar" ? -16 : 16 }}
              transition={{ duration: reduceMotion ? 0 : 0.26, ease: [0.22, 1, 0.36, 1] }}
            >
              <header className={styles.header}>
                <div>
                  <p className={styles.eyebrow}>MANARA · منارة</p>
                  <h2 id={titleId}>{t("settings.title")}</h2>
                </div>
                <button
                  ref={closeRef}
                  type="button"
                  className={`${styles.close} focus-ring`}
                  aria-label={t("settings.close")}
                  onClick={() => setOpen(false)}
                >
                  <CloseIcon />
                </button>
              </header>

              <section className={styles.group} aria-labelledby={`${titleId}-language`}>
                <div>
                  <h3 id={`${titleId}-language`}>{t("settings.language.title")}</h3>
                  <p>{t("settings.language.description")}</p>
                </div>
                <div className={styles.segmented}>
                  {languages.map((language) => (
                    <button
                      key={language.id}
                      type="button"
                      lang={language.id}
                      dir={language.id === "ar" ? "rtl" : "ltr"}
                      className="focus-ring"
                      aria-pressed={locale === language.id}
                      onClick={() => setLocale(language.id)}
                    >
                      {language.nativeLabel}
                    </button>
                  ))}
                </div>
              </section>

              <section className={styles.group} aria-labelledby={`${titleId}-appearance`}>
                <div>
                  <h3 id={`${titleId}-appearance`}>{t("settings.appearance.title")}</h3>
                  <p>{t("settings.appearance.description")}</p>
                </div>
                <div className={styles.appearanceGrid}>
                  {appearances.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className="focus-ring"
                      aria-pressed={appearance === option}
                      onClick={() => setAppearance(option)}
                    >
                      <span data-swatch={option} aria-hidden="true" />
                      {t(`settings.appearance.${option}`)}
                    </button>
                  ))}
                </div>
              </section>

              {persistenceWarning ? (
                <p className={styles.warning} role="status">
                  {t("landing.persistenceWarning")}
                </p>
              ) : null}

              <p className={styles.note}>
                {t("settings.language.conversationNote")}
              </p>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
