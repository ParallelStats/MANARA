"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";

import type { DialogueBeat, LearnerResponseOption } from "@/domain/scenario/types";
import { useUiPreferences } from "@/features/preferences/ui-preferences-provider";
import type { MessageKey } from "@/i18n/messages";
import { selectLocalizedText } from "@/i18n/select-localized-text";
import { createBrowserSpeechRecognition } from "@/media/browser/browser-speech-recognition";
import type { SpeechRecognitionPort } from "@/media/ports/speech-recognition";

import styles from "../scenario-scene.module.css";

type VoiceState = "ready" | "listening" | "processing";

interface VoiceDockProps {
  readonly beat: DialogueBeat;
  readonly busy: boolean;
  readonly language: string;
  readonly recognition?: SpeechRecognitionPort;
  readonly showTransliteration: boolean;
  readonly utilityControl?: ReactNode;
  readonly onVoiceStateChange: (state: VoiceState) => void;
  readonly onSubmitAudio: (transcript: string) => void;
  readonly onSubmitOption: (option: LearnerResponseOption) => void;
  readonly onSubmitText: (text: string) => void;
}

function failureMessageKey(failure: string): MessageKey {
  switch (failure) {
    case "permission_denied":
      return "voice.failure.permissionDenied";
    case "silence":
      return "voice.failure.silence";
    case "timeout":
      return "voice.failure.timeout";
    case "cancelled":
      return "voice.failure.cancelled";
    default:
      return "voice.failure.default";
  }
}

export function VoiceDock({
  beat,
  busy,
  language,
  recognition: suppliedRecognition,
  showTransliteration,
  utilityControl,
  onVoiceStateChange,
  onSubmitAudio,
  onSubmitOption,
  onSubmitText,
}: VoiceDockProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const { locale, t } = useUiPreferences();
  const [recognition] = useState<SpeechRecognitionPort>(
    () => suppliedRecognition ?? createBrowserSpeechRecognition(),
  );
  const mountedRef = useRef(true);
  const [choicesOpen, setChoicesOpen] = useState(false);
  const [textOpen, setTextOpen] = useState(false);
  const [text, setText] = useState("");
  const [transcript, setTranscript] = useState("");
  const [voiceState, setVoiceState] = useState<VoiceState>("ready");
  const sheetRef = useRef<HTMLDivElement>(null);
  const sheetOpenerRef = useRef<HTMLButtonElement>(null);
  const [statusKey, setStatusKey] = useState<MessageKey>(
    recognition.available ? "voice.status.ready" : "voice.status.unavailable",
  );
  const sheetOpen = choicesOpen || textOpen;

  useEffect(() => () => {
    mountedRef.current = false;
    recognition.cancel();
  }, [recognition]);

  function setVoice(next: VoiceState) {
    setVoiceState(next);
    onVoiceStateChange(next);
  }

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

  async function toggleMicrophone() {
    if (voiceState === "listening") {
      setStatusKey("voice.status.processing");
      setVoice("processing");
      recognition.stop();
      return;
    }
    if (busy || voiceState !== "ready") return;
    closeSheets();
    setTranscript("");

    if (!recognition.available) {
      setStatusKey("voice.status.unavailableBrowser");
      setTextOpen(true);
      return;
    }

    setStatusKey("voice.status.listening");
    setVoice("listening");
    const result = await recognition.listen({
      language,
      timeoutMs: 12_000,
      onInterimTranscript: setTranscript,
    });
    if (!mountedRef.current) return;
    if (!result.ok) {
      setVoice("ready");
      setStatusKey(failureMessageKey(result.failure));
      if (result.failure === "permission_denied" || result.failure === "unavailable") {
        setTextOpen(true);
      }
      return;
    }

    setTranscript(result.transcript);
    setStatusKey("voice.status.processing");
    setVoice("processing");
    onSubmitAudio(result.transcript);
  }

  function submitTypedText(event: FormEvent<HTMLFormElement>) {
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
        <p
          id="learner-turn-prompt"
          lang={locale}
          dir={locale === "ar" ? "rtl" : "ltr"}
          className={locale === "ar" ? "font-arabic" : undefined}
        >
          {selectLocalizedText(beat.prompt, locale)}
        </p>
        {transcript ? <span className={styles.transcriptPreview} lang="ar" dir="auto">{transcript}</span> : null}
      </div>

      <div className={styles.utilityControls}>
        {utilityControl}
        <button
          type="button"
          className={`${styles.practiceButton} focus-ring`}
          aria-label={t("voice.action.practiceChoices")}
          aria-expanded={choicesOpen}
          disabled={busy}
          onClick={(event) => {
            sheetOpenerRef.current = event.currentTarget;
            setTextOpen(false);
            setChoicesOpen((open) => !open);
          }}
        >
          <span className={styles.practiceIcon} aria-hidden="true">•••</span>
          <span className={styles.practiceLabel}>{t("voice.action.practiceChoices")}</span>
        </button>
      </div>

      <button
        type="button"
        className={`${styles.micButton} ${voiceState === "listening" ? styles.micListening : ""} focus-ring`}
        aria-label={voiceState === "listening" ? t("voice.action.stop") : t("voice.action.speak")}
        aria-pressed={voiceState === "listening"}
        disabled={busy || voiceState === "processing"}
        onClick={(event) => {
          sheetOpenerRef.current = event.currentTarget;
          void toggleMicrophone();
        }}
      >
        <span className={styles.srStatus}>{voiceState === "listening" ? t("voice.action.stop") : t("voice.action.speak")}</span>
      </button>

      <button
        type="button"
        className={`${styles.typeButton} focus-ring`}
        aria-expanded={textOpen}
        disabled={busy}
        onClick={(event) => {
          sheetOpenerRef.current = event.currentTarget;
          setChoicesOpen(false);
          setTextOpen((open) => !open);
        }}
      >
        {textOpen ? t("voice.action.close") : t("voice.action.typeInstead")}
      </button>

      <p className={styles.voiceStatus} role="status" aria-live="polite">{t(statusKey)}</p>

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
                  <p id="response-sheet-title">{choicesOpen ? t("voice.panel.practiceTitle") : t("voice.panel.typeTitle")}</p>
                  <span>{choicesOpen ? t("voice.panel.practiceSubtitle") : t("voice.panel.typeSubtitle")}</span>
                </div>
                <button type="button" className={`${styles.sheetClose} focus-ring`} aria-label={t("voice.panel.closeAria")} onClick={closeSheets}>×</button>
              </div>

              {choicesOpen ? (
                <div className={styles.responseChoices} aria-label={t("voice.panel.choicesAria")}>
                  {beat.responseOptions.map((option, index) => (
                    <button key={option.id} type="button" className="focus-ring" data-modal-initial-focus={index === 0 ? "" : undefined} disabled={busy} onClick={() => { closeSheets(); onSubmitOption(option); }}>
                      <strong lang="ar" dir="rtl" className="font-arabic">{option.arabicText}</strong>
                      {showTransliteration && option.transliteration ? <span>{option.transliteration}</span> : null}
                      <small>{option.englishMeaning}</small>
                    </button>
                  ))}
                </div>
              ) : (
                <form className={styles.textComposer} onSubmit={submitTypedText}>
                  <label htmlFor={`learner-text-${beat.id}`}>{t("voice.form.label")}</label>
                  <div>
                    <input id={`learner-text-${beat.id}`} value={text} lang="ar" dir="auto" autoComplete="off" enterKeyHint="send" data-modal-initial-focus="" placeholder={t("voice.form.placeholder")} onChange={(event) => setText(event.target.value)} />
                    <button type="submit" className="focus-ring" disabled={!text.trim() || busy}>{t("voice.action.send")}</button>
                  </div>
                  <small>{t("voice.form.privacyNotice")}</small>
                </form>
              )}
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
