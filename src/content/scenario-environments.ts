import { pendingLinguisticReview } from "@/content/review-state";
import type { ScenarioEnvironment } from "@/domain/scenario/types";

export const scenarioEnvironments = [
  {
    ...pendingLinguisticReview,
    id: "environment-abu-dhabi-cafe",
    scenarioId: "scenario-abu-dhabi-cafe",
    visualId: "coastal-cafe-evening",
    label: { en: "Contemporary café", ar: "مقهى معاصر" },
    atmosphere: {
      en: "Warm counter light, quiet brass details, and an evening coastal glow.",
      ar: "إضاءة دافئة عند المنضدة وتفاصيل هادئة ولمسة مسائية ساحلية.",
    },
    ambientMotion: "cafe_glow",
  },
  {
    ...pendingLinguisticReview,
    id: "environment-abu-dhabi-campus",
    scenarioId: "scenario-abu-dhabi-campus",
    visualId: "sunlit-campus-courtyard",
    label: { en: "Campus courtyard", ar: "ساحة الجامعة" },
    atmosphere: {
      en: "Open walkways, shifting daylight, and a lively student rhythm.",
      ar: "ممرات مفتوحة وضوء متحرّك وإيقاع طلابي حيوي.",
    },
    ambientMotion: "courtyard_light",
  },
  {
    ...pendingLinguisticReview,
    id: "environment-cairo-cafe",
    scenarioId: "scenario-cairo-cafe",
    visualId: "cairo-neighbourhood-cafe",
    label: { en: "Neighbourhood café", ar: "مقهى الحي" },
    atmosphere: {
      en: "A close urban room with amber light, layered tables, and street warmth.",
      ar: "مساحة مدينية حميمة بإضاءة كهرمانية وطاولات متداخلة ودفء الشارع.",
    },
    ambientMotion: "city_flow",
  },
  {
    ...pendingLinguisticReview,
    id: "environment-cairo-taxi",
    scenarioId: "scenario-cairo-transport",
    visualId: "cairo-taxi-night",
    label: { en: "Taxi through the city", ar: "سيارة أجرة في المدينة" },
    atmosphere: {
      en: "A passenger-seat view with moving lights, road reflections, and a focused driver.",
      ar: "مشهد من مقعد الراكب مع أضواء متحركة وانعكاسات الطريق وسائق منتبه.",
    },
    ambientMotion: "street_motion",
  },
] as const satisfies readonly ScenarioEnvironment[];

export function getScenarioEnvironment(id: string) {
  return scenarioEnvironments.find((environment) => environment.id === id);
}
