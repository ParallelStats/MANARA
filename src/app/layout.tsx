import type { Metadata, Viewport } from "next";
import Script from "next/script";
import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { UiPreferencesProvider } from "@/features/preferences/ui-preferences-provider";

import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

const siteDescription =
  "An immersive journey through spoken Arabic and the connections between its dialects.";
const preferenceInitScript = String.raw`
(() => {
  const root = document.documentElement;
  const languages = navigator.languages?.length ? navigator.languages : [navigator.language];
  let locale = languages.some((language) => /^ar(?:-|_|$)/i.test(language || "")) ? "ar" : "en";
  let appearance = "system";
  try {
    const stored = JSON.parse(localStorage.getItem("manara:ui-preferences:v1") || "null");
    if (stored && stored.schemaVersion === 1) {
      if (stored.locale === "ar" || stored.locale === "en") locale = stored.locale;
      if (["system", "light", "dark"].includes(stored.appearance)) appearance = stored.appearance;
    }
  } catch {}
  const dark = appearance === "dark" || (appearance === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  const theme = dark ? "dark" : "light";
  root.lang = locale;
  root.dir = locale === "ar" ? "rtl" : "ltr";
  root.dataset.appearance = appearance;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) themeMeta.setAttribute("content", dark ? "#0b100e" : "#f2ecdf");
})();`;

export const metadata: Metadata = {
  metadataBase: new URL(process.env.MANARA_SITE_URL ?? "http://localhost:3000"),
  applicationName: "MANARA | منارة",
  title: {
    default: "MANARA | منارة",
    template: "%s · MANARA",
  },
  description: siteDescription,
  appleWebApp: {
    capable: true,
    title: "MANARA | منارة",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [{ url: "/icons/192", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/180", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    siteName: "MANARA | منارة",
    title: "MANARA | منارة",
    description: siteDescription,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "MANARA — Your Arabic evolves." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "MANARA | منارة",
    description: siteDescription,
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: "#0b100e",
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="en"
      dir="ltr"
      data-appearance="system"
      data-theme="dark"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body id="top" suppressHydrationWarning>
        <UiPreferencesProvider>
          <AppShell>{children}</AppShell>
        </UiPreferencesProvider>
        <Script
          id="manara-ui-preferences"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: preferenceInitScript }}
        />
      </body>
    </html>
  );
}
