import type { DestinationSummary } from "@/application/travel/select-destination-summaries";
import type { DialectReference, LocalizedText } from "@/domain/content/types";
import type { FutureDestinationNode, GeographicPoint } from "@/domain/travel/types";

interface WorldNetworkNodeBase {
  readonly id: string;
  readonly name: LocalizedText;
  readonly countryName: LocalizedText;
  readonly coordinates: GeographicPoint;
  readonly labelPriority: number;
}

export interface EnterableWorldNetworkNode extends WorldNetworkNodeBase {
  readonly source: "destination";
  readonly availability: "available";
  readonly slug: string;
  readonly dialect: DialectReference;
}

export interface PreviewWorldNetworkNode extends WorldNetworkNodeBase {
  readonly source: "destination";
  readonly availability: "preview";
  readonly slug: string;
  readonly dialect: DialectReference;
}

export interface FutureWorldNetworkNode extends WorldNetworkNodeBase {
  readonly source: "future";
  readonly availability: "future";
}

export type WorldNetworkNode =
  | EnterableWorldNetworkNode
  | FutureWorldNetworkNode
  | PreviewWorldNetworkNode;

const destinationPriority: Readonly<Record<string, number>> = {
  "destination-abu-dhabi": 950,
  "destination-cairo": 940,
  "destination-casablanca": 820,
};

export function selectWorldNetworkNodes(
  destinations: readonly DestinationSummary[],
  futureDestinations: readonly FutureDestinationNode[],
): readonly WorldNetworkNode[] {
  return [
    ...destinations.map((destination): EnterableWorldNetworkNode | PreviewWorldNetworkNode => ({
      id: destination.id,
      name: destination.name,
      countryName: destination.countryName,
      coordinates: destination.coordinates,
      labelPriority: destinationPriority[destination.id] ?? 800,
      source: "destination",
      availability: destination.availability === "available" ? "available" : "preview",
      slug: destination.slug,
      dialect: destination.dialect,
    })),
    ...futureDestinations.map((destination): FutureWorldNetworkNode => ({
      id: destination.id,
      name: destination.name,
      countryName: destination.countryName,
      coordinates: destination.coordinates,
      labelPriority: destination.labelPriority,
      source: "future",
      availability: "future",
    })),
  ];
}

export function isEnterableWorldNetworkNode(
  node: WorldNetworkNode | undefined,
): node is EnterableWorldNetworkNode {
  return node?.source === "destination" && node.availability === "available";
}

export function getWorldNodePresentationPriority(
  node: WorldNetworkNode,
  selectedNodeId?: string,
) {
  return node.id === selectedNodeId ? 2_000 : node.labelPriority;
}
