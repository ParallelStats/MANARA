import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { worldRoute } from "@/application/travel/routes";
import { selectDestinationSummaries } from "@/application/travel/select-destination-summaries";
import { resolveMapConfiguration } from "@/config/map";
import { destinations } from "@/content/destinations";
import { getDestinationBySlug } from "@/content/registry";
import { getDestinationArrival, getDestinationHotspots } from "@/content/travel-experiences";
import { CityExperience } from "@/features/travel/components/city-experience";
import { TravelAppBar } from "@/features/travel/components/travel-app-bar";

interface CityPageProps {
  readonly params: Promise<{ destinationSlug: string }>;
}

export function generateStaticParams() {
  return destinations
    .filter(({ availability }) => availability === "available")
    .map(({ slug }) => ({ destinationSlug: slug }));
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { destinationSlug } = await params;
  const destination = getDestinationBySlug(destinationSlug);
  return { title: destination?.availability === "available" ? `Explore ${destination.name.en}` : "Destination unavailable" };
}

export default async function CityPage({ params }: CityPageProps) {
  const { destinationSlug } = await params;
  const destination = getDestinationBySlug(destinationSlug);
  if (!destination || destination.availability !== "available") notFound();

  const arrival = getDestinationArrival(destination.id);
  if (!arrival) notFound();

  const summary = selectDestinationSummaries([destination])[0];
  if (!summary) notFound();

  return (
    <section className="map-app-shell">
      <TravelAppBar currentLevel="city" returnHref={worldRoute()} returnLabel="Return to the world map" />
      <CityExperience
        arrival={arrival}
        configuration={resolveMapConfiguration()}
        destination={summary}
        hotspots={getDestinationHotspots(destination.id)}
      />
    </section>
  );
}
