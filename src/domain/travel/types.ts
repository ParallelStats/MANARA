import type { LocalizedText, ValidationStatus } from "@/domain/content/types";

export type GeographicPoint = readonly [longitude: number, latitude: number];

export type JourneyLevel = "city" | "scenario" | "world";

export type TravelPhase =
  | "arrived"
  | "cancelled"
  | "departing"
  | "destination_selected"
  | "idle"
  | "in_transit"
  | "recoverable_error";

export interface TravelState {
  readonly phase: TravelPhase;
  readonly originDestinationId?: string;
  readonly targetDestinationId?: string;
}

export interface CameraPreset {
  readonly center: GeographicPoint;
  readonly zoom: number;
  readonly pitch: number;
  readonly bearing: number;
}

export interface TravelTransferContext {
  readonly sourceDialectId?: string;
  readonly targetDialectId: string;
  readonly conceptIds: readonly string[];
}

export interface TravelRoute {
  readonly id: string;
  readonly from: CameraPreset;
  readonly to: CameraPreset;
  readonly originDestinationId?: string;
  readonly targetDestinationId: string;
  readonly durationMs: number;
  readonly reducedMotionDurationMs: number;
  readonly transferContext: TravelTransferContext;
}

export type ScenarioHotspotAvailability = "available" | "coming_soon" | "preview";

interface ScenarioHotspotBase {
  readonly id: string;
  readonly slug: string;
  readonly destinationId: string;
  readonly name: LocalizedText;
  readonly kind: "cafe" | "campus" | "majlis" | "market" | "transport";
  readonly coordinates: GeographicPoint;
  readonly fallbackPosition: Readonly<{ inline: number; block: number }>;
  readonly camera: CameraPreset;
  readonly objective: LocalizedText;
  readonly validationStatus: ValidationStatus;
}

export interface AvailableScenarioHotspot extends ScenarioHotspotBase {
  readonly availability: "available";
  readonly scenarioId: string;
}

export interface UnavailableScenarioHotspot extends ScenarioHotspotBase {
  readonly availability: Exclude<ScenarioHotspotAvailability, "available">;
  readonly scenarioId?: never;
}

export type ScenarioHotspot = AvailableScenarioHotspot | UnavailableScenarioHotspot;

export interface DestinationArrival {
  readonly destinationId: string;
  readonly worldCamera: CameraPreset;
  readonly cityCamera: CameraPreset;
  readonly atmosphere: "coastal" | "river";
  readonly introduction: LocalizedText;
  readonly validationStatus: ValidationStatus;
}

export interface FutureDestinationNode {
  readonly id: string;
  readonly name: LocalizedText;
  readonly countryName: LocalizedText;
  readonly coordinates: GeographicPoint;
  readonly labelPriority: number;
  readonly availability: "future";
  readonly validationStatus: ValidationStatus;
}
