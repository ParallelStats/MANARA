"use client";

import Image from "next/image";
import { useCallback } from "react";

import { getLocalGuidePersona } from "@/content/local-guides";
import type { LocalizedText } from "@/domain/content/types";
import type { EvaluationResult } from "@/domain/learning/types";
import { useUiPreferences } from "@/features/preferences/ui-preferences-provider";
import type { MessageKey } from "@/i18n/messages";
import { selectLocalizedText } from "@/i18n/select-localized-text";

import styles from "../scenario-scene.module.css";

interface ManaraGuideProps {
  readonly evaluation: EvaluationResult;
  readonly cityName: LocalizedText;
  readonly destinationId: string;
  readonly retryText?: string;
  readonly continueLabel?: string;
  readonly onContinue: () => void;
  readonly onRetry?: () => void;
}

function guideTitleKey(evaluation: EvaluationResult): MessageKey {
  switch (evaluation.category) {
    case "cross_dialect_transfer":
      return "guide.title.crossDialect";
    case "msa_or_excessive_formality":
      return "guide.title.formalToConversational";
    case "natural_target_usage":
      return "guide.title.natural";
    case "unclear_meaning":
      return "guide.title.unclear";
    default:
      return "guide.title.default";
  }
}

export function ManaraGuide({
  evaluation,
  cityName,
  destinationId,
  retryText,
  continueLabel,
  onContinue,
  onRetry,
}: ManaraGuideProps) {
  const { locale, t } = useUiPreferences();
  const uncertain = evaluation.validationStatus !== "verified";
  const persona = getLocalGuidePersona(destinationId);
  const resolvedContinueLabel = continueLabel ?? t("guide.continueConversation");
  const focusTitle = useCallback((heading: HTMLHeadingElement | null) => {
    heading?.focus({ preventScroll: true });
  }, []);

  return (
    <aside className={styles.guidePanel} aria-labelledby="manara-guide-title">
      <div className={styles.guideHeader}>
        <div className={styles.guidePortrait} data-guide-id={persona?.visualId} aria-hidden="true">
          {persona ? (
            <Image src={persona.portraitAssetPath} alt="" fill sizes="112px" />
          ) : (
            <span>م</span>
          )}
        </div>
        <div>
          <p>{persona ? selectLocalizedText(persona.name, locale) : "MANARA"}</p>
          <span>{t("guide.identity.localGuide", { city: selectLocalizedText(cityName, locale) })}</span>
        </div>
      </div>

      <div className={styles.guideAnnouncement} role="status" aria-live="polite">
        <h2 id="manara-guide-title" ref={focusTitle} tabIndex={-1}>
          {uncertain ? t("guide.title.unverified") : t(guideTitleKey(evaluation))}
        </h2>
        <p>
          {uncertain
            ? t(evaluation.category === "unclear_meaning"
                ? "guide.body.clarification"
                : "guide.body.unverified")
            : locale === "en" ? evaluation.explanation : t("guide.body.reviewed")}
        </p>

        {!uncertain && evaluation.naturalAlternative ? (
          <div className={styles.guideAlternative}>
            <span>{t("guide.tryInContext")}</span>
            <strong lang="ar" dir="rtl" className="font-arabic">{evaluation.naturalAlternative}</strong>
            {locale === "en" && evaluation.comparison ? <small dir="auto">{evaluation.comparison}</small> : null}
          </div>
        ) : retryText ? (
          <div className={styles.guideAlternative}>
            <span>{t("guide.usePracticeReply")}</span>
            <strong lang="ar" dir="rtl" className="font-arabic">{retryText}</strong>
          </div>
        ) : null}
      </div>

      <div className={styles.guideActions}>
        {onRetry && retryText ? (
          <button type="button" className={`${styles.guidePrimary} focus-ring`} onClick={onRetry}>
            {t("guide.tryAgain")}
          </button>
        ) : null}
        <button type="button" className={`${styles.guideSecondary} focus-ring`} onClick={onContinue}>
          {resolvedContinueLabel}
        </button>
      </div>
    </aside>
  );
}
