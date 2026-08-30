"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";

import type { DialogueBeat, LearnerResponseOption } from "@/domain/scenario/types";
import { useUiPreferences } from "@/features/preferences/ui-preferences-provider";
import { selectLocalizedText } from "@/i18n/select-localized-text";

import styles from "../scenario-scene.module.css";

interface MockVoiceDockProps {
  readonly beat: DialogueBeat;
  readonly busy: boolean;
  readonly showTransliteration: boolean;
  readonly onSubmitOption: (option: LearnerResponseOption) => void;
  readonly onSubmitText: (text: string) => void;
}

export function MockVoiceDock({
  beat,
  busy,
  showTransliteration,
  onSubmitOption,
  onSubmitText,
}: MockVoiceDockProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const { locale, t } = useUiPreferences();
  const [choicesOpen, setChoicesOpen] = useState(false);
  const [textOpen, setTextOpen] = useState(false);
  const [text, setText] = useState("");
  const sheetRef = useRef<HTMLDivElement>(null);
  const sheetOpenerRef = useRef<HTMLButtonElement>(null);
  const sheetOpen = choicesOpen || textOpen;

  const closeSheets = useCallback(() => {
    setChoicesOpen(false);
    setTextOpen(false);
  }, []);

  useEffect(() => {
    if (!sheetOpen) return;
    const sheet = sheetRef.current;
    if (!sheet) return;
    const opener = sheetOpenerRef.current;

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
        closeSheets();
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
  }, [closeSheets, sheetOpen]);

  function submitText(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = text.trim();
    if (!value || busy) return;
    onSubmitText(value);
    setText("");
    closeSheets();
  }

  return (
    <section className={styles.voiceDock} aria-labelledby="learner-turn-prompt">
      <div className={styles.turnPrompt}>
        <p id="learner-turn-prompt" lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className={locale === "ar" ? "font-arabic" : undefined}>
          {selectLocalizedText(beat.prompt, locale)}
        </p>
      </div>

      <button
        type="button"
        className={`${styles.micButton} focus-ring`}
        aria-label={choicesOpen ? t("voice.panel.closeAria") : t("voice.action.respond")}
        aria-expanded={choicesOpen}
        disabled={busy}
        onClick={(event) => {
          sheetOpenerRef.current = event.currentTarget;
          setTextOpen(false);
          setChoicesOpen((open) => !open);
        }}
      >
        <span className={styles.srStatus}>{t("voice.action.respond")}</span>
      </button>

      <button
        type="button"
        className={`${styles.typeButton} focus-ring`}
        aria-expanded={textOpen}
        onClick={(event) => {
          sheetOpenerRef.current = event.currentTarget;
          setChoicesOpen(false);
          setTextOpen((open) => !open);
        }}
      >
        {textOpen ? t("voice.action.close") : t("voice.action.type")}
      </button>

      <AnimatePresence>
        {choicesOpen || textOpen ? (
          <>
            <motion.button
              key="response-backdrop"
              type="button"
              className={styles.sheetBackdrop}
              data-modal-backdrop=""
              aria-label={t("voice.panel.closeAria")}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.18 }}
              onClick={closeSheets}
            />
            <motion.div
              ref={sheetRef}
              key={choicesOpen ? "response-choices" : "text-response"}
              className={styles.responseSheet}
              role="dialog"
              aria-modal="true"
              aria-labelledby="response-sheet-title"
              tabIndex={-1}
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
            >
              <div className={styles.sheetHeader}>
                <div>
                  <p id="response-sheet-title">
                    {choicesOpen ? t("voice.panel.practiceTitle") : t("voice.panel.typeTitle")}
                  </p>
                  <span>{choicesOpen ? t("voice.panel.mockPracticeSubtitle") : t("voice.panel.typeSubtitle")}</span>
                </div>
                <button
                  type="button"
                  className={`${styles.sheetClose} focus-ring`}
                  aria-label={t("voice.panel.closeAria")}
                  onClick={closeSheets}
                >
                  ×
                </button>
              </div>

              {choicesOpen ? (
                <div className={styles.responseChoices} aria-label={t("voice.panel.choicesAria")}>
                  {beat.responseOptions.map((option, index) => (
                    <button
                      key={option.id}
                      type="button"
                      className="focus-ring"
                      data-modal-initial-focus={index === 0 ? "" : undefined}
                      disabled={busy}
                      onClick={() => {
                        closeSheets();
                        onSubmitOption(option);
                      }}
                    >
                      <strong lang="ar" dir="rtl" className="font-arabic">{option.arabicText}</strong>
                      {showTransliteration && option.transliteration ? <span>{option.transliteration}</span> : null}
                      <small>{option.englishMeaning}</small>
                    </button>
                  ))}
                </div>
              ) : (
                <form className={styles.textComposer} onSubmit={submitText}>
                  <label htmlFor="mock-learner-text">{t("voice.form.label")}</label>
                  <div>
                    <input
                      id="mock-learner-text"
                      value={text}
                      lang="ar"
                      dir="auto"
                      autoComplete="off"
                      enterKeyHint="send"
                      data-modal-initial-focus=""
                      placeholder={t("voice.form.placeholder")}
                      onChange={(event) => setText(event.target.value)}
                    />
                    <button type="submit" className="focus-ring" disabled={!text.trim() || busy}>{t("voice.action.send")}</button>
                  </div>
                </form>
              )}
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
