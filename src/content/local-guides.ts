import type { LocalizedText } from "@/domain/content/types";

export interface LocalGuidePersona {
  readonly destinationId: "destination-abu-dhabi" | "destination-cairo";
  readonly name: LocalizedText;
  readonly portraitAssetPath: string;
  readonly visualId: string;
}

export const localGuidePersonas = [
  {
    destinationId: "destination-abu-dhabi",
    name: { en: "Reem", ar: "ريم" },
    portraitAssetPath: "/guides/abu-dhabi-reem-v1.webp",
    visualId: "guide-reem-editorial-v1",
  },
  {
    destinationId: "destination-cairo",
    name: { en: "Karim", ar: "كريم" },
    portraitAssetPath: "/guides/cairo-karim-v1.webp",
    visualId: "guide-karim-editorial-v1",
  },
] as const satisfies readonly LocalGuidePersona[];

export function getLocalGuidePersona(destinationId: string) {
  return localGuidePersonas.find((guide) => guide.destinationId === destinationId);
}
