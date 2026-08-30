import { describe, expect, it } from "vitest";

import {
  getScenarioScenePresentation,
  learningSurfaceContracts,
  scenarioScenePresentations,
  sceneLayerOrder,
} from "@/features/learning/presentation/scenario-presentation";

describe("scenario presentation contracts", () => {
  const presentations = Object.values(scenarioScenePresentations);

  it("keeps the Local Character and MANARA Guide on separate state sources", () => {
    expect(learningSurfaceContracts.localCharacter.label).toBe("Local Character");
    expect(learningSurfaceContracts.manaraGuide.label).toBe("MANARA Guide");
    expect(learningSurfaceContracts.localCharacter.stateSource).not.toBe(
      learningSurfaceContracts.manaraGuide.stateSource,
    );
  });

  it("defines exactly four distinct scenario compositions", () => {
    expect(presentations).toHaveLength(4);
    expect(new Set(presentations.map(({ composition }) => composition)).size).toBe(4);
  });

  it("gives every scenario the complete ordered layer stack", () => {
    for (const presentation of presentations) {
      expect(Object.keys(presentation.layers)).toEqual(sceneLayerOrder);

      const layers = sceneLayerOrder.map((layerName) => presentation.layers[layerName]);

      expect(new Set(layers.map(({ id }) => id)).size).toBe(sceneLayerOrder.length);

      for (let index = 1; index < layers.length; index += 1) {
        expect(layers[index]!.depth).toBeGreaterThan(layers[index - 1]!.depth);
      }
    }
  });

  it("increases physical-scene parallax from background to foreground", () => {
    const physicalLayerOrder = ["background", "midground", "character", "foreground"] as const;

    for (const presentation of presentations) {
      const parallaxValues = physicalLayerOrder.map(
        (layerName) => presentation.layers[layerName].parallax,
      );

      for (let index = 1; index < parallaxValues.length; index += 1) {
        expect(parallaxValues[index]!).toBeGreaterThan(parallaxValues[index - 1]!);
      }
    }
  });

  it("keeps character cutouts separate from unique environment backgrounds", () => {
    for (const presentation of presentations) {
      expect(presentation.characterAssetPath).not.toBe(presentation.backgroundAssetPath);
    }

    const signatures = presentations.map(
      ({ composition, backgroundAssetPath }) => `${composition}:${backgroundAssetPath}`,
    );
    const backgroundAssetPaths = presentations.map(({ backgroundAssetPath }) => backgroundAssetPath);

    expect(new Set(signatures).size).toBe(4);
    expect(new Set(backgroundAssetPaths).size).toBe(4);
  });

  it("fails safely for unknown scenarios and mismatched characters", () => {
    const firstPresentation = presentations[0]!;
    const secondPresentation = presentations[1]!;

    expect(
      getScenarioScenePresentation("scenario-that-does-not-exist", firstPresentation.characterId),
    ).toBeUndefined();
    expect(
      getScenarioScenePresentation(firstPresentation.scenarioId, secondPresentation.characterId),
    ).toBeUndefined();

    for (const presentation of presentations) {
      expect(
        getScenarioScenePresentation(presentation.scenarioId, presentation.characterId),
      ).toBe(presentation);
    }
  });
});
