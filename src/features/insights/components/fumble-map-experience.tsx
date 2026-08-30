"use client";

import Link from "next/link";
import type { Route } from "next";
import { useMemo, useState } from "react";

import { createFumbleMapModel } from "@/application/insights/create-fumble-map-model";
import { destinations } from "@/content/destinations";
import { scenarioHotspots } from "@/content/travel-experiences";
import type { FumbleMapInsight } from "@/domain/insights/types";
import styles from "@/features/insights/components/fumble-map.module.css";
import { useLearnerProfile } from "@/features/learning/state/use-learner-profile";
import { useUiPreferences } from "@/features/preferences/ui-preferences-provider";
import type { MessageKey } from "@/i18n/messages";

const evidenceLabels = {
  OBSERVATION: "fumble.evidence.observation",
  PERSISTENT_PATTERN: "fumble.evidence.pattern",
  STRENGTH: "fumble.evidence.strength",
} as const satisfies Readonly<Record<FumbleMapInsight["evidenceLevel"], MessageKey>>;

function scenarioLabel(scenarioId: string) {
  const hotspot = scenarioHotspots.find(
    (item) => "scenarioId" in item && item.scenarioId === scenarioId,
  );
  const destination = destinations.find(({ id }) => id === hotspot?.destinationId);
  return hotspot && destination
    ? { en: `${destination.name.en} · ${hotspot.name.en}`, ar: `${destination.name.ar} · ${hotspot.name.ar}` }
    : { en: "MANARA conversation", ar: "محادثة منارة" };
}

function InsightDetail({ insight }: { readonly insight: FumbleMapInsight }) {
  const { direction, locale, t, tp } = useUiPreferences();
  const title = locale === "ar" ? insight.titleAr : insight.title;
  const summary = locale === "ar" ? insight.summaryAr : insight.summary;

  return (
    <article className={styles.detail} aria-live="polite">
      <p className={styles.kicker}>{t(evidenceLabels[insight.evidenceLevel])}</p>
      <h2 lang={locale} dir={direction} className={locale === "ar" ? "font-arabic" : undefined}>{title}</h2>
      <p lang={locale} dir={direction} className={`${styles.summary} ${locale === "ar" ? "font-arabic" : ""}`}>{summary}</p>

      <div className={styles.evidence}>
        <h3>{t("fumble.evidence.why")}</h3>
        <ul>
          <li>{tp("fumble.count.moment", insight.momentCount)}</li>
          {insight.successfulRetryCount > 0 ? <li>{tp("fumble.count.retry", insight.successfulRetryCount)}</li> : null}
          {insight.laterReuseCount > 0 ? <li>{tp("fumble.count.reuse", insight.laterReuseCount)}</li> : null}
        </ul>
        <div className={styles.places}>
          {insight.scenarioIds.map((scenarioId) => {
            const label = scenarioLabel(scenarioId);
            return (
              <span key={scenarioId}>
                {label[locale]}
              </span>
            );
          })}
        </div>
      </div>
    </article>
  );
}

export function FumbleMapExperience() {
  const { profile, ready, persistenceWarning } = useLearnerProfile();
  const { direction, locale, t, tp } = useUiPreferences();
  const model = useMemo(() => createFumbleMapModel(profile), [profile]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = model.insights.find(({ id }) => id === selectedId) ?? model.insights[0];

  if (!ready) {
    return (
      <section className={styles.shell} aria-label={t("fumble.title")}>
        <div className={styles.loading} role="status">{t("fumble.loading")}</div>
      </section>
    );
  }

  return (
    <section className={styles.shell} aria-labelledby="fumble-map-title">
      <header className={styles.header}>
        <nav className={styles.nav} aria-label={t("fumble.navAria")}>
          <Link href="/" className="focus-ring">MANARA <span lang="ar" dir="rtl" className="font-arabic">منارة</span></Link>
          <Link href="/map" className="focus-ring">{t("fumble.returnWorld")}</Link>
        </nav>
        <p className={styles.eyebrow}>{t("fumble.kicker")}</p>
        <h1 id="fumble-map-title">{t("fumble.title")}</h1>
        <p className={`${styles.lede} ${locale === "ar" ? "font-arabic" : ""}`}>{t("fumble.lede")}</p>
        {persistenceWarning ? <p className={styles.warning}>{t("fumble.persistenceWarning")}</p> : null}
      </header>

      {model.isEmpty ? (
        <section className={styles.empty} aria-labelledby="empty-map-title">
          <div className={styles.beacon} aria-hidden="true"><span /></div>
          <p className={styles.eyebrow}>{t("fumble.empty.kicker")}</p>
          <h2 id="empty-map-title">{t("fumble.empty.title")}</h2>
          <p>{t("fumble.empty.body")}</p>
          <Link href="/map" className="primary-action">{t("fumble.empty.chooseConversation")} <span aria-hidden="true">{direction === "rtl" ? "←" : "→"}</span></Link>
        </section>
      ) : (
        <div className={styles.workspace}>
          <section className={styles.journey} aria-labelledby="journey-heading">
            <div className={styles.sectionHeading}>
              <div><p className={styles.eyebrow}>{t("fumble.journey.kicker")}</p><h2 id="journey-heading">{t("fumble.journey.title")}</h2></div>
              <span>{tp("fumble.count.place", model.journey.length)}</span>
            </div>
            <div className={styles.route} aria-hidden="true" />
            <div className={styles.insightList}>
              {model.insights.map((insight) => (
                <button
                  type="button"
                  key={insight.id}
                  aria-pressed={selected?.id === insight.id}
                  className={styles.insightCard}
                  onClick={() => setSelectedId(insight.id)}
                >
                  <span className={styles.signal} aria-hidden="true" />
                  <span><small>{t(evidenceLabels[insight.evidenceLevel])}</small><strong>{locale === "ar" ? insight.titleAr : insight.title}</strong></span>
                  <span aria-hidden="true">{direction === "rtl" ? "↖" : "↗"}</span>
                </button>
              ))}
            </div>
          </section>

          {selected ? <InsightDetail insight={selected} /> : null}

          <section className={styles.recommendations} aria-labelledby="next-heading">
            <div className={styles.sectionHeading}>
              <div><p className={styles.eyebrow}>{t("fumble.next.kicker")}</p><h2 id="next-heading">{t("fumble.next.title")}</h2></div>
            </div>
            <div className={styles.recommendationGrid}>
              {model.recommendations.map((recommendation) => (
                <article key={recommendation.id}>
                  <h3>{locale === "ar" ? recommendation.titleAr : recommendation.title}</h3>
                  <p>{locale === "ar" ? recommendation.reasonAr : recommendation.reason}</p>
                  <Link href={recommendation.practiceHref as Route} className="focus-ring">{t("fumble.next.practice")} <span aria-hidden="true">{direction === "rtl" ? "←" : "→"}</span></Link>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
