"use client";

import type { LocalizedText } from "@/domain/content/types";
import { useUiPreferences } from "@/features/preferences/ui-preferences-provider";
import { getUiTextDirection, type UiLocale } from "@/i18n/ui-preferences";

interface BilingualNameProps {
  readonly name: LocalizedText;
  readonly className?: string;
}

interface OrderedLocalizedName {
  readonly direction: "ltr" | "rtl";
  readonly locale: UiLocale;
  readonly value: string;
}

export function orderLocalizedName(
  name: LocalizedText,
  primaryLocale: UiLocale,
): readonly [OrderedLocalizedName, OrderedLocalizedName] {
  const secondaryLocale = primaryLocale === "ar" ? "en" : "ar";

  return [
    {
      direction: getUiTextDirection(primaryLocale),
      locale: primaryLocale,
      value: name[primaryLocale],
    },
    {
      direction: getUiTextDirection(secondaryLocale),
      locale: secondaryLocale,
      value: name[secondaryLocale],
    },
  ];
}

export function BilingualName({ name, className }: BilingualNameProps) {
  const { locale } = useUiPreferences();
  const [primary, secondary] = orderLocalizedName(name, locale);

  return (
    <span className={className}>
      <span lang={primary.locale} dir={primary.direction}>
        {primary.value}
      </span>
      <span aria-hidden="true" className="mx-2 text-[0.65em] text-accent opacity-60">
        •
      </span>
      <span
        lang={secondary.locale}
        dir={secondary.direction}
        className={secondary.locale === "ar" ? "font-arabic" : undefined}
      >
        {secondary.value}
      </span>
    </span>
  );
}
