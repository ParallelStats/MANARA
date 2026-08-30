export type ProviderMode = "mock";

export interface ProviderConfiguration {
  readonly mode: ProviderMode;
  readonly characterProvider: "mock";
  readonly guideProvider: "mock";
  readonly liveAIEnabled: false;
}

export const providerConfiguration: ProviderConfiguration = Object.freeze({
  mode: "mock",
  characterProvider: "mock",
  guideProvider: "mock",
  liveAIEnabled: false,
});

export function resolveProviderConfiguration(requestedMode?: string): ProviderConfiguration {
  // Phase 1 fails closed to mock mode. A future live adapter must be added explicitly server-side.
  void requestedMode;
  return providerConfiguration;
}
