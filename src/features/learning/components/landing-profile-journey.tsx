"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { LearnerProfileSetup } from "@/features/learning/components/learner-profile-setup";
import { useLearnerProfile } from "@/features/learning/state/use-learner-profile";
import { useUiPreferences } from "@/features/preferences/ui-preferences-provider";

import styles from "../learning-experience.module.css";

export function LandingProfileJourney() {
  const router = useRouter();
  const reduceMotion = useReducedMotion() ?? false;
  const learner = useLearnerProfile();
  const { direction, locale, t } = useUiPreferences();
  const [showProfileSetup, setShowProfileSetup] = useState(false);

  function beginJourney() {
    if (!learner.ready) return;
    if (learner.profile.onboardingStatus === "configured") {
      router.push("/map");
      return;
    }
    setShowProfileSetup(true);
  }

  return (
    <section className="landing-screen page-container relative grid min-h-dvh grid-rows-[auto_1fr] py-5 sm:py-8">
      <header className="flex items-center justify-between gap-4 pe-14 sm:pe-28">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
          {t("landing.spokenArabic")}<span className="hidden sm:inline"> · {t("landing.virtualTravel")}</span>
        </span>
        <Link href="/fumble-map" className="focus-ring text-xs font-semibold text-[var(--accent-strong)] underline-offset-4 hover:underline">
          {t("landing.fumbleMap")}
        </Link>
      </header>

      <AnimatePresence mode="wait" initial={false}>
        {showProfileSetup ? (
          <motion.div
            key="profile"
            className={styles.landingProfileStage}
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              className={`${styles.quietBack} focus-ring`}
              onClick={() => setShowProfileSetup(false)}
            >
              <span aria-hidden="true">{direction === "rtl" ? "→" : "←"}</span>
              {t("landing.backToIntroduction")}
            </button>
            <LearnerProfileSetup
              onComplete={async (startingPoint) => {
                await learner.configure(startingPoint);
                router.push("/map");
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="introduction"
            className="grid items-center gap-12 pb-10 pt-8 lg:grid-cols-[1.08fr_0.92fr] lg:gap-20 lg:py-16"
            initial={false}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
          >
            <div className="max-w-3xl">
              <h1 className="leading-none">
                <span className="block text-5xl font-semibold tracking-[0.16em] text-[var(--text-primary)] sm:text-7xl lg:text-[5.4rem]">
                  MANARA
                </span>
                <span lang="ar" dir="rtl" className="font-arabic mt-3 block w-fit text-5xl text-[var(--accent-strong)] sm:text-7xl lg:text-[5.4rem]">
                  منارة
                </span>
              </h1>
              <p className="mt-9 max-w-xl text-balance text-2xl font-medium leading-tight text-[var(--text-primary)] sm:text-3xl">
                {t("landing.headline")}
              </p>
              <p className="mt-5 max-w-lg text-pretty text-base leading-7 text-[var(--text-secondary)] sm:text-lg">
                {t("landing.promise")}
              </p>
              <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <button
                  type="button"
                  className="primary-action focus-ring w-full sm:w-auto"
                  disabled={!learner.ready}
                  onClick={beginJourney}
                >
                  {learner.ready ? t("landing.begin") : t("landing.preparing")}
                  <span aria-hidden="true">{direction === "rtl" ? "←" : "→"}</span>
                </button>
                <span className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  {t("landing.privacyNote")}
                </span>
              </div>
              {learner.persistenceWarning ? (
                <p className={styles.persistenceNote} role="status">
                  {t("landing.persistenceWarning")}
                </p>
              ) : null}
            </div>

            <aside className="journey-card hidden lg:block" aria-label={t("landing.showcase.ariaLabel")}>
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
                <span>{t("landing.showcase.title")}</span>
                <span dir="ltr">01 → 02</span>
              </div>
              <div className="mt-10 space-y-8">
                <div className="journey-stop">
                  <span className="journey-number">01</span>
                  <div>
                    <p lang={locale} dir={direction} className="text-lg font-semibold text-[var(--text-primary)]">
                      {locale === "ar" ? "القاهرة" : "Cairo"}
                    </p>
                    <p lang={locale === "ar" ? "en" : "ar"} dir={locale === "ar" ? "ltr" : "rtl"} className="font-arabic mt-1 w-fit text-xl text-[var(--accent)]">
                      {locale === "ar" ? "Cairo" : "القاهرة"}
                    </p>
                  </div>
                </div>
                <div className="ms-4 h-12 w-px bg-gradient-to-b from-amber-200/60 to-emerald-300/30" aria-hidden="true" />
                <div className="journey-stop">
                  <span className="journey-number">02</span>
                  <div>
                    <p lang={locale} dir={direction} className="text-lg font-semibold text-[var(--text-primary)]">
                      {locale === "ar" ? "أبوظبي" : "Abu Dhabi"}
                    </p>
                    <p lang={locale === "ar" ? "en" : "ar"} dir={locale === "ar" ? "ltr" : "rtl"} className="font-arabic mt-1 w-fit text-xl text-[var(--accent)]">
                      {locale === "ar" ? "Abu Dhabi" : "أبوظبي"}
                    </p>
                  </div>
                </div>
              </div>
              <p className="mt-10 border-t border-[var(--border)] pt-5 text-sm leading-6 text-[var(--text-secondary)]">
                {t("landing.showcase.routeSummary")}
              </p>
            </aside>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
