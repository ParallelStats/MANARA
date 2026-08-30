import type { Locale } from "@/domain/content/types";

export type TextDirection = "ltr" | "rtl";

export function getTextDirection(locale: Locale): TextDirection {
  return locale === "ar" ? "rtl" : "ltr";
}
