"use client";

import type { JourneyLevel } from "@/domain/travel/types";
import { useUiPreferences } from "@/features/preferences/ui-preferences-provider";

const levels = [
  { id: "world", messageKey: "journey.world" },
  { id: "city", messageKey: "journey.city" },
  { id: "scenario", messageKey: "journey.scenario" },
] as const;

interface JourneyIndicatorProps {
  readonly current: JourneyLevel;
}

export function JourneyIndicator({ current }: JourneyIndicatorProps) {
  const { t } = useUiPreferences();
  const activeIndex = levels.findIndex(({ id }) => id === current);

  return (
    <nav className="journey-indicator" aria-label={t("journey.ariaLabel")}>
      <ol>
        {levels.map((level, index) => {
          const state = index === activeIndex ? "current" : index < activeIndex ? "complete" : "upcoming";

          return (
            <li key={level.id} data-state={state}>
              <span className="journey-indicator-dot" aria-hidden="true" />
              <span aria-current={state === "current" ? "step" : undefined}>
                {t(level.messageKey)}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
