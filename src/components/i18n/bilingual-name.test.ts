import { describe, expect, it } from "vitest";

import { orderLocalizedName } from "@/components/i18n/bilingual-name";

const cairo = { en: "Cairo", ar: "القاهرة" } as const;

describe("bilingual name ordering", () => {
  it("puts English first with explicit LTR direction in English UI", () => {
    expect(orderLocalizedName(cairo, "en")).toEqual([
      { locale: "en", direction: "ltr", value: "Cairo" },
      { locale: "ar", direction: "rtl", value: "القاهرة" },
    ]);
  });

  it("puts Arabic first with explicit RTL direction in Arabic UI", () => {
    expect(orderLocalizedName(cairo, "ar")).toEqual([
      { locale: "ar", direction: "rtl", value: "القاهرة" },
      { locale: "en", direction: "ltr", value: "Cairo" },
    ]);
  });
});
