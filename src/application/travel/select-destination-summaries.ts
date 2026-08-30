import type {
  Destination,
  DestinationAvailability,
  DialectReference,
  LocalizedText,
} from "@/domain/content/types";
import type { GeographicPoint } from "@/domain/travel/types";

export interface DestinationSummary {
  readonly id: string;
  readonly slug: string;
  readonly name: LocalizedText;
  readonly countryName: LocalizedText;
  readonly dialect: DialectReference;
  readonly availability: DestinationAvailability;
  readonly coordinates: GeographicPoint;
  readonly mapPosition: Readonly<{
    inline: number;
    block: number;
  }>;
}

export function selectDestinationSummaries(
  records: readonly Destination[],
): readonly DestinationSummary[] {
  return records.map(({ id, slug, name, countryName, dialect, availability, coordinates, mapPosition }) => ({
    id,
    slug,
    name,
    countryName,
    dialect,
    availability,
    coordinates,
    mapPosition,
  }));
}
