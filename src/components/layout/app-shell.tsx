"use client";

import type { ReactNode } from "react";

import { SettingsSheet } from "@/features/preferences/settings-sheet";
import { useUiPreferences } from "@/features/preferences/ui-preferences-provider";

interface AppShellProps {
  readonly children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { t } = useUiPreferences();

  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-full bg-accent px-4 py-2 font-semibold text-[var(--accent-contrast)] focus:not-sr-only focus:fixed focus:start-4 focus:top-4"
      >
        {t("a11y.skipToContent")}
      </a>

      <SettingsSheet />

      <main id="main-content" className="relative z-10 min-h-dvh" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
