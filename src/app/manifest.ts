import type { MetadataRoute } from "next";

const description =
  "An immersive journey through spoken Arabic and its dialect connections · رحلة غامرة في العربية المحكية وروابط لهجاتها.";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "MANARA | منارة",
    short_name: "MANARA · منارة",
    description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0b100e",
    theme_color: "#0b100e",
    lang: "en",
    dir: "auto",
    icons: [
      {
        src: "/icons/192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
