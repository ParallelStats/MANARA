"use client";

import { useEffect } from "react";

import { useUiPreferences } from "@/features/preferences/ui-preferences-provider";

interface ErrorPageProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const { t } = useUiPreferences();
  useEffect(() => {
    // Keep learner-facing detail private; production observability will use a redacted adapter.
    void error.digest;
  }, [error]);

  return (
    <section className="page-container grid min-h-[65svh] place-items-center py-16">
      <div className="max-w-lg text-center">
        <p className="eyebrow">{t("error.view.kicker")}</p>
        <h1 className="mt-4 text-4xl font-medium tracking-tight text-[var(--text-primary)]">{t("error.view.title")}</h1>
        <p className="mt-4 leading-7 text-[var(--text-secondary)]">{t("error.view.body")}</p>
        <button type="button" onClick={reset} className="primary-action focus-ring mt-8">
          {t("error.view.retry")}
        </button>
      </div>
    </section>
  );
}
