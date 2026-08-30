"use client";

import type { Route } from "next";
import Link from "next/link";

import type { JourneyLevel } from "@/domain/travel/types";
import { useUiPreferences } from "@/features/preferences/ui-preferences-provider";
import { JourneyIndicator } from "@/features/travel/components/journey-indicator";

interface TravelAppBarProps {
  readonly currentLevel: JourneyLevel;
  readonly returnHref: Route;
  readonly returnLabel: string;
}

export function TravelAppBar({ currentLevel, returnHref, returnLabel }: TravelAppBarProps) {
  const { direction, locale, t } = useUiPreferences();
  const localizedReturnLabel = locale === "en"
    ? returnLabel
    : currentLevel === "world"
      ? t("nav.backIntroduction")
      : currentLevel === "city"
        ? t("nav.backWorld")
        : t("nav.backCity", { city: t("journey.city") });

  return (
    <header className="travel-app-bar">
      <div className="travel-app-bar-primary">
        <Link href={returnHref} aria-label={localizedReturnLabel} className="travel-back focus-ring">
          <span aria-hidden="true">{direction === "rtl" ? "→" : "←"}</span>
        </Link>

        <Link href="/" className="travel-brand focus-ring" aria-label={t("a11y.manaraHome")}>
          <span>MANARA</span>
          <span lang="ar" dir="rtl" className="font-arabic">منارة</span>
        </Link>

        <Link href="/fumble-map" className="travel-map-link focus-ring">
          <span>{t("nav.fumbleMap")}</span>
        </Link>
      </div>

      {currentLevel === "scenario" ? null : <JourneyIndicator current={currentLevel} />}
    </header>
  );
}
