"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

import type { DialogueBeat } from "@/domain/scenario/types";
import { useUiPreferences } from "@/features/preferences/ui-preferences-provider";
import type { MessageKey } from "@/i18n/messages";
import { selectLocalizedText } from "@/i18n/select-localized-text";

import styles from "../scenario-scene.module.css";

type Aid = "hint" | "translation" | "transliteration" | "vocabulary";

interface LearnerAidsProps {
  readonly beat: DialogueBeat;
  readonly enabledAids: ReadonlySet<Aid>;
  readonly transliterationAvailable: boolean;
  readonly onToggle: (aid: Aid) => void;
}

export function LearnerAids({
  beat,
  enabledAids,
  transliterationAvailable,
  onToggle,
}: LearnerAidsProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const { locale, t } = useUiPreferences();
  const [open, setOpen] = useState(false);
  const sheetRef = useRef<HTMLElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);
  const controls: readonly Readonly<{ id: Aid; labelKey: MessageKey; available: boolean }>[] = [
    { id: "translation", labelKey: "aids.control.translation", available: true },
    { id: "transliteration", labelKey: "aids.control.transliteration", available: transliterationAvailable },
    { id: "hint", labelKey: "aids.control.hint", available: true },
    { id: "vocabulary", labelKey: "aids.control.vocabulary", available: beat.vocabulary.length > 0 },
  ];
  const closeSheet = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const sheet = sheetRef.current;
    if (!sheet) return;
    const opener = openerRef.current;

    const inerted: HTMLElement[] = [];
    let branch: HTMLElement | null = sheet;
    while (branch && branch.id !== "main-content") {
      const parent: HTMLElement | null = branch.parentElement;
      if (!parent) break;
      for (const sibling of parent.children) {
        if (
          sibling instanceof HTMLElement &&
          sibling !== branch &&
          sibling.dataset.modalBackdrop === undefined &&
          !sibling.inert
        ) {
          sibling.inert = true;
          inerted.push(sibling);
        }
      }
      branch = parent;
    }

    const focusableSelector = [
      "button:not([disabled])",
      "[href]",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      '[tabindex]:not([tabindex="-1"])',
    ].join(", ");
    const focusableElements = () => (
      Array.from(sheet.querySelectorAll<HTMLElement>(focusableSelector))
        .filter((element) => !element.inert && element.getAttribute("aria-hidden") !== "true")
    );
    const initialFocus = sheet.querySelector<HTMLElement>("[data-modal-initial-focus]")
      ?? focusableElements()[0]
      ?? sheet;
    initialFocus.focus({ preventScroll: true });

    const handleKey = (event: KeyboardEvent) => {
      if (document.getElementById("main-content")?.hasAttribute("inert")) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closeSheet();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = focusableElements();
      const first = focusable[0] ?? sheet;
      const last = focusable.at(-1) ?? sheet;
      const activeElement = document.activeElement;
      if (!sheet.contains(activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      for (const element of inerted) element.inert = false;
      const main = document.getElementById("main-content");
      if (!main?.hasAttribute("inert") && opener?.isConnected) {
        opener.focus({ preventScroll: true });
      }
    };
  }, [closeSheet, open]);

  return (
    <div className={styles.aidsRegion}>
      <button
        ref={openerRef}
        type="button"
        className={`${styles.helpButton} focus-ring`}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span aria-hidden="true">?</span>
        <span>{t("aids.help")}</span>
      </button>

      <AnimatePresence>
        {open ? (
          <>
            <motion.button
              key="aid-backdrop"
              type="button"
              className={styles.sheetBackdrop}
              data-modal-backdrop=""
              aria-label={t("aids.closeAria")}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.18 }}
              onClick={closeSheet}
            />
            <motion.section
              ref={sheetRef}
              key="aid-sheet"
              className={styles.aidSheet}
              role="dialog"
              aria-modal="true"
              aria-labelledby="aid-sheet-title"
              tabIndex={-1}
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
            >
              <div className={styles.sheetHeader}>
                <div>
                  <p id="aid-sheet-title">{t("aids.title")}</p>
                  <span>{t("aids.subtitle")}</span>
                </div>
                <button
                  type="button"
                  className={`${styles.sheetClose} focus-ring`}
                  aria-label={t("aids.closeAria")}
                  onClick={closeSheet}
                >
                  ×
                </button>
              </div>

              <div className={styles.aidToggles} aria-label={t("aids.optionalAria")}>
                {controls.filter(({ available }) => available).map((control, index) => (
                  <button
                    key={control.id}
                    type="button"
                    className="focus-ring"
                    data-modal-initial-focus={index === 0 ? "" : undefined}
                    aria-pressed={enabledAids.has(control.id)}
                    onClick={() => onToggle(control.id)}
                  >
                    {t(control.labelKey)}
                  </button>
                ))}
              </div>

              {enabledAids.has("hint") ? (
                <div className={styles.aidContent} role="note">
                  <p lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className={locale === "ar" ? "font-arabic" : undefined}>
                    {selectLocalizedText(beat.hint, locale)}
                  </p>
                </div>
              ) : null}

              {enabledAids.has("vocabulary") && beat.vocabulary.length > 0 ? (
                <div className={styles.vocabularyList} role="note">
                  {beat.vocabulary.map((item) => (
                    <span key={`${item.arabic}-${item.english}`}>
                      <strong lang="ar" dir="rtl" className="font-arabic">{item.arabic}</strong>
                      <small>{item.english}{item.transliteration ? ` · ${item.transliteration}` : ""}</small>
                    </span>
                  ))}
                </div>
              ) : null}
            </motion.section>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
