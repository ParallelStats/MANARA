"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";

import { deriveLearnerSupport } from "@/application/learning/learner-profile";
import type {
  LearnerStartingPoint,
  LearnerStartingPointKind,
} from "@/domain/learning/types";
import { useUiPreferences } from "@/features/preferences/ui-preferences-provider";

import styles from "../learning-experience.module.css";

interface LearnerProfileSetupProps {
  readonly compact?: boolean;
  readonly onComplete: (startingPoint: LearnerStartingPoint) => void | Promise<void>;
}

const startingPointOptions = [
  {
    kind: "beginner",
    labelKey: "onboarding.option.beginner.label",
    detailKey: "onboarding.option.beginner.detail",
  },
  {
    kind: "msa_learner",
    labelKey: "onboarding.option.msa.label",
    detailKey: "onboarding.option.msa.detail",
  },
  {
    kind: "dialect_learner",
    labelKey: "onboarding.option.dialect.label",
    detailKey: "onboarding.option.dialect.detail",
  },
  {
    kind: "heritage_or_partial",
    labelKey: "onboarding.option.heritage.label",
    detailKey: "onboarding.option.heritage.detail",
  },
] as const satisfies readonly Readonly<{
  kind: LearnerStartingPointKind;
  labelKey: "onboarding.option.beginner.label" | "onboarding.option.msa.label" | "onboarding.option.dialect.label" | "onboarding.option.heritage.label";
  detailKey: "onboarding.option.beginner.detail" | "onboarding.option.msa.detail" | "onboarding.option.dialect.detail" | "onboarding.option.heritage.detail";
}>[];

const knownVarieties = [
  { id: "egyptian-cairo", labelKey: "onboarding.variety.egyptian" },
  { id: "emirati-abu-dhabi", labelKey: "onboarding.variety.emirati" },
  { id: "levantine-self-described", labelKey: "onboarding.variety.levantine" },
  { id: "gulf-self-described", labelKey: "onboarding.variety.gulf" },
  { id: "moroccan-self-described", labelKey: "onboarding.variety.moroccan" },
  { id: "spoken-arabic-unsure", labelKey: "onboarding.variety.unsure" },
] as const;

export function LearnerProfileSetup({ compact = false, onComplete }: LearnerProfileSetupProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const { direction, t } = useUiPreferences();
  const [selectedKind, setSelectedKind] = useState<LearnerStartingPointKind | null>(null);
  const [knownVarietyId, setKnownVarietyId] = useState("");
  const [saving, setSaving] = useState(false);

  const startingPoint = useMemo<LearnerStartingPoint | null>(() => {
    if (!selectedKind) return null;
    if (selectedKind !== "dialect_learner") return { kind: selectedKind };
    return knownVarietyId ? { kind: selectedKind, knownVarietyId } : null;
  }, [knownVarietyId, selectedKind]);

  const support = startingPoint ? deriveLearnerSupport(startingPoint) : null;

  async function submit() {
    if (!startingPoint || saving) return;
    setSaving(true);
    await onComplete(startingPoint);
  }

  return (
    <motion.section
      className={`${styles.profileSetup} ${compact ? styles.profileSetupCompact : ""}`}
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0.08 : 0.42, ease: [0.22, 1, 0.36, 1] }}
      aria-labelledby="learner-starting-point-title"
    >
      <div className={styles.profileIntro}>
        <p className={styles.kicker}>{t("onboarding.kicker")}</p>
        <h1 id="learner-starting-point-title" tabIndex={-1}>
          {t("onboarding.title")}
        </h1>
        <p>{t("onboarding.description")}</p>
      </div>

      <fieldset className={styles.profileOptions}>
        <legend className="sr-only">{t("onboarding.legend")}</legend>
        {startingPointOptions.map((option) => (
          <label key={option.kind} className={styles.profileOption} data-selected={selectedKind === option.kind}>
            <input
              type="radio"
              name="learner-starting-point"
              value={option.kind}
              checked={selectedKind === option.kind}
              onChange={() => setSelectedKind(option.kind)}
            />
            <span className={styles.profileOptionMark} aria-hidden="true" />
            <span>
              <strong>{t(option.labelKey)}</strong>
              <small>{t(option.detailKey)}</small>
            </span>
          </label>
        ))}
      </fieldset>

      {selectedKind === "dialect_learner" ? (
        <motion.label
          className={styles.varietyPicker}
          initial={reduceMotion ? false : { opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span>{t("onboarding.varietyQuestion")}</span>
          <select value={knownVarietyId} onChange={(event) => setKnownVarietyId(event.target.value)}>
            <option value="">{t("onboarding.chooseOne")}</option>
            {knownVarieties.map((variety) => (
              <option key={variety.id} value={variety.id}>{t(variety.labelKey)}</option>
            ))}
          </select>
        </motion.label>
      ) : null}

      <div className={styles.profileFooter}>
        <div className={styles.supportPreview} aria-live="polite">
          {support ? (
            <>
              <span>{t("onboarding.support.prepared")}</span>
              <p>
                {support.translation === "always" ? t("onboarding.support.meaningShown") : t("onboarding.support.meaningOnRequest")}
                {support.transliteration === "available"
                  ? ` · ${t("onboarding.support.transliterationAvailable")}`
                  : ` · ${t("onboarding.support.lighterScaffolding")}`}
              </p>
            </>
          ) : (
            <p>{t("onboarding.support.chooseClosest")}</p>
          )}
        </div>
        <button
          type="button"
          className={`${styles.primaryButton} focus-ring`}
          disabled={!startingPoint || saving}
          onClick={submit}
        >
          {saving
            ? t("onboarding.action.saving")
            : compact
              ? t("onboarding.action.enterScenario")
              : t("onboarding.action.continueWorld")}
          <span aria-hidden="true">{direction === "rtl" ? "←" : "→"}</span>
        </button>
      </div>
    </motion.section>
  );
}
