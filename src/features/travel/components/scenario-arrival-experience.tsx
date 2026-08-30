"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { cityRoute, worldRoute } from "@/application/travel/routes";
import type { DestinationSummary } from "@/application/travel/select-destination-summaries";
import { getDialoguePackByScenarioId } from "@/content/dialogue-packs";
import type { Character, Scenario } from "@/domain/content/types";
import type { AvailableScenarioHotspot, DestinationArrival } from "@/domain/travel/types";
import { ImmersiveScenario } from "@/features/learning/components/immersive-scenario";
import { LayeredScenarioScene } from "@/features/learning/components/layered-scenario-scene";
import { LearnerProfileSetup } from "@/features/learning/components/learner-profile-setup";
import { useLearnerProfile } from "@/features/learning/state/use-learner-profile";
import { useUiPreferences } from "@/features/preferences/ui-preferences-provider";
import { selectLocalizedText } from "@/i18n/select-localized-text";

import styles from "../../learning/learning-experience.module.css";
import sceneStyles from "../../learning/scenario-scene.module.css";

interface ScenarioArrivalExperienceProps {
  readonly arrival: DestinationArrival;
  readonly character: Character;
  readonly conversationEnhancementAvailable: boolean;
  readonly destination: DestinationSummary;
  readonly hotspot: AvailableScenarioHotspot;
  readonly scenario: Scenario;
}

type ExperienceStage = "arrival" | "profile" | "scenario";

export function ScenarioArrivalExperience({
  arrival,
  character,
  conversationEnhancementAvailable,
  destination,
  hotspot,
  scenario,
}: ScenarioArrivalExperienceProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const learner = useLearnerProfile();
  const { direction, locale, t } = useUiPreferences();
  const [stage, setStage] = useState<ExperienceStage>("arrival");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const dialoguePack = getDialoguePackByScenarioId(scenario.id);

  useEffect(() => {
    if (stage === "arrival") headingRef.current?.focus({ preventScroll: true });
  }, [stage]);

  function beginScenario() {
    if (!learner.ready) return;
    setStage(learner.profile.onboardingStatus === "configured" ? "scenario" : "profile");
  }

  if (!dialoguePack) {
    return (
      <section className={styles.arrivalError} role="alert">
        <p className={styles.kicker}>{t("scenario.unavailable.kicker")}</p>
        <h1>{t("scenario.unavailable.title")}</h1>
        <p>{t("scenario.unavailable.body")}</p>
        <div>
          <Link href={cityRoute(destination.slug)} className={`${styles.primaryButton} focus-ring`}>
            {t("scenario.unavailable.returnCity", { city: selectLocalizedText(destination.name, locale) })}
          </Link>
          <Link href={worldRoute()} className={`${styles.secondaryButton} focus-ring`}>
            {t("scenario.unavailable.travelElsewhere")}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className={`${styles.scenarioExperience} ${sceneStyles.experience}`} data-atmosphere={arrival.atmosphere}>
      <AnimatePresence mode="wait" initial={false}>
        {stage === "scenario" ? (
          <motion.div
            key="scenario"
            className={sceneStyles.stage}
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.18 }}
          >
            <ImmersiveScenario
              character={character}
              conversationEnhancementAvailable={conversationEnhancementAvailable}
              destination={destination}
              hotspot={hotspot}
              pack={dialoguePack}
              profile={learner.profile}
              scenario={scenario}
              updateProfile={learner.update}
            />
          </motion.div>
        ) : stage === "profile" ? (
          <motion.div
            key="profile"
            className={styles.deepEntryProfile}
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              className={`${styles.quietBack} focus-ring`}
              onClick={() => setStage("arrival")}
            >
              <span aria-hidden="true">{direction === "rtl" ? "→" : "←"}</span>
              {t("scenario.arrival.backScene")}
            </button>
            <LearnerProfileSetup
              compact
              onComplete={async (startingPoint) => {
                await learner.configure(startingPoint);
                setStage("scenario");
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="arrival"
            className={sceneStyles.stage}
            initial={false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 1 }}
          >
            <LayeredScenarioScene
              character={character}
              scenarioId={scenario.id}
              visualState="idle"
            >
              <motion.section
                className={sceneStyles.arrivalOverlay}
                aria-labelledby="scenario-arrival-title"
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduceMotion ? 0 : 0.34, duration: reduceMotion ? 0 : 0.42 }}
              >
                <p className={sceneStyles.arrivalLocation}>
                  <span lang={locale} dir={direction}>{selectLocalizedText(destination.name, locale)}</span>
                </p>
                <h1 id="scenario-arrival-title" ref={headingRef} tabIndex={-1}>
                  <span lang={locale} dir={direction} className={locale === "ar" ? "font-arabic" : undefined}>
                    {selectLocalizedText(hotspot.name, locale)}
                  </span>
                </h1>
                <p className={sceneStyles.arrivalMission}>
                  <span lang={locale} dir={direction} className={locale === "ar" ? "font-arabic" : undefined}>
                    {selectLocalizedText(scenario.communicativeGoal, locale)}
                  </span>
                </p>
                <div className={sceneStyles.arrivalActions}>
                  <button
                    type="button"
                    className={`${sceneStyles.beginButton} focus-ring`}
                    disabled={!learner.ready}
                    onClick={beginScenario}
                  >
                    {learner.ready ? t("scenario.arrival.begin") : t("scenario.arrival.preparing")}
                    <span aria-hidden="true">{direction === "rtl" ? "←" : "→"}</span>
                  </button>
                  <Link href={cityRoute(destination.slug)} className={`${sceneStyles.textAction} focus-ring`}>
                    {t("scenario.arrival.anotherSituation")}
                  </Link>
                </div>
                {learner.persistenceWarning ? (
                  <p className={sceneStyles.persistenceNote} role="status">
                    {t("scenario.arrival.persistenceWarning")}
                  </p>
                ) : null}
              </motion.section>
            </LayeredScenarioScene>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
