import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { cityRoute } from "@/application/travel/routes";
import { selectDestinationSummaries } from "@/application/travel/select-destination-summaries";
import { characters } from "@/content/characters";
import { destinations } from "@/content/destinations";
import { getEnterableScenarioBySlugs } from "@/content/registry";
import { getDestinationArrival, scenarioHotspots } from "@/content/travel-experiences";
import { ScenarioArrivalExperience } from "@/features/travel/components/scenario-arrival-experience";
import { TravelAppBar } from "@/features/travel/components/travel-app-bar";

interface ScenarioPageProps {
  readonly params: Promise<{ destinationSlug: string; scenarioSlug: string }>;
}

export function generateStaticParams() {
  return scenarioHotspots.flatMap((hotspot) => {
    if (hotspot.availability !== "available") return [];
    const destination = destinations.find(({ id }) => id === hotspot.destinationId);
    return destination ? [{ destinationSlug: destination.slug, scenarioSlug: hotspot.slug }] : [];
  });
}

export async function generateMetadata({ params }: ScenarioPageProps): Promise<Metadata> {
  const { destinationSlug, scenarioSlug } = await params;
  const record = getEnterableScenarioBySlugs(destinationSlug, scenarioSlug);
  return { title: record ? `${record.hotspot.name.en} · ${record.destination.name.en}` : "Scenario unavailable" };
}

export default async function ScenarioPage({ params }: ScenarioPageProps) {
  const { destinationSlug, scenarioSlug } = await params;
  const record = getEnterableScenarioBySlugs(destinationSlug, scenarioSlug);
  if (!record) notFound();

  const arrival = getDestinationArrival(record.destination.id);
  const character = characters.find(({ id }) => id === record.scenario.characterId);
  const destination = selectDestinationSummaries([record.destination])[0];
  if (!arrival || !character || !destination) notFound();

  return (
    <section className="map-app-shell scenario-app-shell">
      <TravelAppBar
        currentLevel="scenario"
        returnHref={cityRoute(record.destination.slug)}
        returnLabel={`Return to ${record.destination.name.en}`}
      />
      <ScenarioArrivalExperience
        arrival={arrival}
        character={character}
        conversationEnhancementAvailable={Boolean(process.env.GEMINI_API_KEY?.trim())}
        destination={destination}
        hotspot={record.hotspot}
        scenario={record.scenario}
      />
    </section>
  );
}
