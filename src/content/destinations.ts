import type { Destination } from "@/domain/content/types";

export const destinations = [
  {
    id: "destination-cairo",
    slug: "cairo",
    name: { en: "Cairo", ar: "القاهرة" },
    countryName: { en: "Egypt", ar: "مصر" },
    dialect: {
      id: "egyptian-cairo",
      label: "Egyptian Arabic",
      locality: "Cairo",
      validationStatus: "needs_review",
    },
    availability: "available",
    scenarioIds: ["scenario-cairo-cafe", "scenario-cairo-transport"],
    coordinates: [31.2357, 30.0444],
    mapPosition: { inline: 51, block: 50 },
  },
  {
    id: "destination-abu-dhabi",
    slug: "abu-dhabi",
    name: { en: "Abu Dhabi", ar: "أبوظبي" },
    countryName: { en: "United Arab Emirates", ar: "الإمارات العربية المتحدة" },
    dialect: {
      id: "emirati-abu-dhabi",
      label: "Emirati Arabic",
      locality: "Abu Dhabi",
      validationStatus: "needs_review",
    },
    availability: "available",
    scenarioIds: ["scenario-abu-dhabi-cafe", "scenario-abu-dhabi-campus"],
    coordinates: [54.3773, 24.4539],
    mapPosition: { inline: 70, block: 58 },
  },
  {
    id: "destination-casablanca",
    slug: "casablanca",
    name: { en: "Casablanca", ar: "الدار البيضاء" },
    countryName: { en: "Morocco", ar: "المغرب" },
    dialect: {
      id: "moroccan-casablanca",
      label: "Moroccan Arabic",
      locality: "Casablanca",
      validationStatus: "needs_review",
    },
    availability: "coming_soon",
    scenarioIds: [],
    coordinates: [-7.5898, 33.5731],
    mapPosition: { inline: 30, block: 47 },
  },
] as const satisfies readonly Destination[];

export type DestinationRecord = (typeof destinations)[number];
