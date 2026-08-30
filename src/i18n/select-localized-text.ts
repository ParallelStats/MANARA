import type { LocalizedText } from "@/domain/content/types";
import type { UiLocale } from "@/i18n/ui-preferences";

export function selectLocalizedText(text: LocalizedText, locale: UiLocale) {
  return text[locale];
}

export function selectSecondaryLocale(locale: UiLocale): UiLocale {
  return locale === "ar" ? "en" : "ar";
}
