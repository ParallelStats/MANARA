"use client";

import { useEffect, useState } from "react";

import { messages } from "@/i18n/messages";
import type { ResolvedAppearance, UiLocale } from "@/i18n/ui-preferences";
import { createUiPreferencesRepository } from "@/state/ui-preferences-repository";

export default function GlobalError({ reset }: Readonly<{ error: Error; reset: () => void }>) {
  const [locale, setLocale] = useState<UiLocale>("en");
  const [theme, setTheme] = useState<ResolvedAppearance>("dark");

  useEffect(() => {
    let active = true;
    void createUiPreferencesRepository().load().then((preferences) => {
      if (!active) return;
      setLocale(preferences.locale);
      setTheme(preferences.resolvedAppearance);
    });
    return () => {
      active = false;
    };
  }, []);

  const copy = messages[locale];
  const dark = theme === "dark";

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} data-theme={theme} suppressHydrationWarning>
      <body style={{ background: dark ? "#0b100e" : "#f2ecdf", color: dark ? "#f6f3e9" : "#1f2723" }}>
        <main className="grid min-h-screen place-items-center p-6 text-center">
          <div className="max-w-md">
            <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: dark ? "#efd88f" : "#725b1e" }}>{copy["error.global.kicker"]}</p>
            <h1 className="mt-4 text-3xl font-medium">{copy["error.global.title"]}</h1>
            <p className="mt-4 leading-7" style={{ color: dark ? "#b8c0bb" : "#5f6963" }}>{copy["error.global.body"]}</p>
            <button type="button" onClick={reset} className="mt-8 min-h-12 rounded-full px-5 font-semibold" style={{ background: dark ? "#efd88f" : "#725b1e", color: dark ? "#18201c" : "#fffaf0" }}>
              {copy["error.global.reload"]}
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
