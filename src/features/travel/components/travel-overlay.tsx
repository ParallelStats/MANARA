"use client";

import { useEffect, useRef } from "react";

import { useUiPreferences } from "@/features/preferences/ui-preferences-provider";

interface TravelOverlayProps {
  readonly destinationName: string;
  readonly level: "city" | "scenario";
  readonly onSkip: () => void;
}

export function TravelOverlay({ destinationName, level, onSkip }: TravelOverlayProps) {
  const { t } = useUiPreferences();
  const skipButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    skipButtonRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div className="travel-overlay">
      <div className="travel-orbit" aria-hidden="true" />
      <div className="travel-overlay-copy" role="status" aria-live="polite">
        <p className="eyebrow">
          {t(level === "city" ? "travel.city.kicker" : "travel.scenario.kicker")}
        </p>
        <p className="mt-3 text-3xl font-medium tracking-[-0.04em] text-stone-50">{destinationName}</p>
        <p className="mt-3 max-w-xs text-sm leading-6 text-stone-300">
          {t(level === "city" ? "travel.city.body" : "travel.scenario.body")}
        </p>
      </div>
      <button ref={skipButtonRef} type="button" className="travel-skip focus-ring" onClick={onSkip}>
        {t("travel.skip")}
      </button>
    </div>
  );
}
