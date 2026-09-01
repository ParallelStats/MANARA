import type { ScenarioEnvironment } from "@/domain/scenario/types";

/**
 * Presentation-only contracts keep conversational roles and visual depth
 * separate from linguistic meaning. Scene data is exhaustive: an unknown or
 * mismatched record must fail safely instead of borrowing another city.
 */
export const learningSurfaceContracts = {
  localCharacter: {
    label: "Local Character",
    stateSource: "dialogue_and_character_visual_state",
  },
  manaraGuide: {
    label: "MANARA Guide",
    stateSource: "evaluation_and_review_state",
  },
} as const;

export const sceneLayerOrder = [
  "background",
  "midground",
  "character",
  "foreground",
  "ambient",
  "ui",
  "guide",
] as const;

export type SceneLayerName = (typeof sceneLayerOrder)[number];

export interface SceneLayerPresentation {
  readonly id: string;
  readonly depth: number;
  readonly parallax: number;
  readonly objects?: readonly string[];
}

export interface ScenarioScenePresentation {
  readonly scenarioId: string;
  readonly environmentId: string;
  readonly environmentVisualId: string;
  readonly characterId: string;
  readonly characterVisualId: string;
  readonly characterAssetPath: string;
  readonly backgroundAssetPath: string;
  readonly composition: "abu-dhabi-cafe" | "abu-dhabi-campus" | "cairo-cafe" | "cairo-taxi";
  readonly ambientPreset: ScenarioEnvironment["ambientMotion"];
  readonly layers: Readonly<Record<SceneLayerName, SceneLayerPresentation>>;
}

export const scenarioScenePresentations = {
  "scenario-abu-dhabi-cafe": {
    scenarioId: "scenario-abu-dhabi-cafe",
    environmentId: "environment-abu-dhabi-cafe",
    environmentVisualId: "coastal-cafe-evening",
    characterId: "character-abu-dhabi-cafe-mariam",
    characterVisualId: "mariam-cafe",
    characterAssetPath: "/characters/abu-dhabi-cafe-mariam-refined-v3.webp",
    backgroundAssetPath: "/scenes/scenario-abu-dhabi-cafe/background-refined-v1.webp",
    composition: "abu-dhabi-cafe",
    ambientPreset: "cafe_glow",
    layers: {
      background: { id: "abu-dhabi-cafe-room", depth: 0, parallax: 2 },
      midground: {
        id: "abu-dhabi-cafe-service-plane",
        depth: 20,
        parallax: 4,
        objects: ["espresso-bank", "pendant-pool"],
      },
      character: { id: "mariam-host", depth: 40, parallax: 6 },
      foreground: {
        id: "abu-dhabi-cafe-counter-plane",
        depth: 60,
        parallax: 10,
        objects: ["stone-counter", "coffee-cup"],
      },
      ambient: { id: "abu-dhabi-cafe-warm-glow", depth: 70, parallax: 3 },
      ui: { id: "abu-dhabi-cafe-conversation-ui", depth: 80, parallax: 0 },
      guide: { id: "abu-dhabi-cafe-guide", depth: 90, parallax: 0 },
    },
  },
  "scenario-abu-dhabi-campus": {
    scenarioId: "scenario-abu-dhabi-campus",
    environmentId: "environment-abu-dhabi-campus",
    environmentVisualId: "sunlit-campus-courtyard",
    characterId: "character-abu-dhabi-campus-zayed",
    characterVisualId: "zayed-campus",
    characterAssetPath: "/characters/abu-dhabi-campus-zayed-refined-v1.webp",
    backgroundAssetPath: "/scenes/scenario-abu-dhabi-campus/background-refined-v1.webp",
    composition: "abu-dhabi-campus",
    ambientPreset: "courtyard_light",
    layers: {
      background: { id: "abu-dhabi-campus-courtyard", depth: 0, parallax: 1 },
      midground: {
        id: "abu-dhabi-campus-walkway-plane",
        depth: 20,
        parallax: 4,
        objects: ["colonnade-shadow", "campus-planter"],
      },
      character: { id: "zayed-student", depth: 40, parallax: 6 },
      foreground: {
        id: "abu-dhabi-campus-near-plane",
        depth: 60,
        parallax: 11,
        objects: ["bench-edge", "palm-shadow"],
      },
      ambient: { id: "abu-dhabi-campus-daylight", depth: 70, parallax: 2 },
      ui: { id: "abu-dhabi-campus-conversation-ui", depth: 80, parallax: 0 },
      guide: { id: "abu-dhabi-campus-guide", depth: 90, parallax: 0 },
    },
  },
  "scenario-cairo-cafe": {
    scenarioId: "scenario-cairo-cafe",
    environmentId: "environment-cairo-cafe",
    environmentVisualId: "cairo-neighbourhood-cafe",
    characterId: "character-cairo-cafe-nour",
    characterVisualId: "nour-cafe",
    characterAssetPath: "/characters/cairo-cafe-nour-refined-v1.webp",
    backgroundAssetPath: "/scenes/scenario-cairo-cafe/background-refined-v1.webp",
    composition: "cairo-cafe",
    ambientPreset: "city_flow",
    layers: {
      background: { id: "cairo-cafe-street-room", depth: 0, parallax: 2 },
      midground: {
        id: "cairo-cafe-service-plane",
        depth: 20,
        parallax: 5,
        objects: ["table-cluster", "hanging-bulbs"],
      },
      character: { id: "nour-host", depth: 40, parallax: 7 },
      foreground: {
        id: "cairo-cafe-near-table-plane",
        depth: 60,
        parallax: 12,
        objects: ["wood-table", "tea-glass"],
      },
      ambient: { id: "cairo-cafe-street-glow", depth: 70, parallax: 4 },
      ui: { id: "cairo-cafe-conversation-ui", depth: 80, parallax: 0 },
      guide: { id: "cairo-cafe-guide", depth: 90, parallax: 0 },
    },
  },
  "scenario-cairo-transport": {
    scenarioId: "scenario-cairo-transport",
    environmentId: "environment-cairo-taxi",
    environmentVisualId: "cairo-taxi-night",
    characterId: "character-cairo-taxi-hossam",
    characterVisualId: "hossam-taxi",
    characterAssetPath: "/characters/cairo-taxi-hossam-refined-v1.webp",
    backgroundAssetPath: "/scenes/scenario-cairo-transport/background-refined-v1.webp",
    composition: "cairo-taxi",
    ambientPreset: "street_motion",
    layers: {
      background: { id: "cairo-taxi-night-road", depth: 0, parallax: 2 },
      midground: {
        id: "cairo-taxi-cabin-plane",
        depth: 20,
        parallax: 4,
        objects: ["windshield-frame", "rear-view-mirror"],
      },
      character: { id: "hossam-driver", depth: 40, parallax: 6 },
      foreground: {
        id: "cairo-taxi-dashboard-plane",
        depth: 60,
        parallax: 10,
        objects: ["dashboard", "steering-wheel"],
      },
      ambient: { id: "cairo-taxi-passing-lights", depth: 70, parallax: 4 },
      ui: { id: "cairo-taxi-conversation-ui", depth: 80, parallax: 0 },
      guide: { id: "cairo-taxi-guide", depth: 90, parallax: 0 },
    },
  },
} as const satisfies Readonly<Record<string, ScenarioScenePresentation>>;

export type ScenarioSceneId = keyof typeof scenarioScenePresentations;

export function getScenarioScenePresentation(
  scenarioId: string,
  characterId: string,
): ScenarioScenePresentation | undefined {
  const presentation = scenarioScenePresentations[scenarioId as ScenarioSceneId];
  return presentation?.characterId === characterId ? presentation : undefined;
}
