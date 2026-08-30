import { describe, expect, it } from "vitest";

import manifest from "@/app/manifest";

describe("web app manifest", () => {
  it("opens MANARA as a standalone application", () => {
    expect(manifest()).toMatchObject({
      id: "/",
      name: "MANARA | منارة",
      short_name: "MANARA · منارة",
      lang: "en",
      dir: "auto",
      start_url: "/",
      scope: "/",
      display: "standalone",
      background_color: "#0b100e",
      theme_color: "#0b100e",
    });
  });

  it("declares the core install icons", () => {
    expect(manifest().icons).toEqual([
      expect.objectContaining({ src: "/icons/192", sizes: "192x192", type: "image/png" }),
      expect.objectContaining({ src: "/icons/512", sizes: "512x512", type: "image/png" }),
    ]);
  });
});
