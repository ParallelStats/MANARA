import type { WorldNetworkNode } from "@/application/travel/select-world-network-nodes";
import type {
  CameraPreset,
  ScenarioHotspot,
  TravelRoute,
} from "@/domain/travel/types";

export interface MapSurfaceProps {
  readonly activeTravelRoute: TravelRoute | null;
  readonly camera: CameraPreset;
  readonly worldNodes: readonly WorldNetworkNode[];
  readonly hotspots: readonly ScenarioHotspot[];
  readonly level: "city" | "world";
  readonly reduceMotion: boolean;
  readonly selectedDestinationId?: string | undefined;
  readonly selectedHotspotId?: string | undefined;
  readonly showRouteArc: boolean;
  readonly onDestinationSelect: (destinationId: string) => void;
  readonly onHotspotSelect: (hotspotId: string) => void;
  readonly onTravelComplete: (routeId: string) => void;
}
