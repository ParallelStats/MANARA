"use client";

import Link from "next/link";

import { useUiPreferences } from "@/features/preferences/ui-preferences-provider";

export default function NotFoundPage() {
  const { t } = useUiPreferences();

  return (
    <section className="page-container grid min-h-[65svh] place-items-center py-16">
      <div className="max-w-lg text-center">
        <p className="eyebrow">{t("error.route.kicker")}</p>
        <h1 className="mt-4 text-4xl font-medium tracking-tight text-[var(--text-primary)]">{t("error.route.title")}</h1>
        <p className="mt-4 leading-7 text-[var(--text-secondary)]">{t("error.route.body")}</p>
        <Link href="/" className="primary-action focus-ring mt-8">
          {t("error.route.return")}
        </Link>
      </div>
    </section>
  );
}
