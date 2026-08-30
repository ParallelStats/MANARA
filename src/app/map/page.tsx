import type { Metadata } from "next";

import { selectDestinationSummaries } from "@/application/travel/select-destination-summaries";
import { selectWorldNetworkNodes } from "@/application/travel/select-world-network-nodes";
import { resolveMapConfiguration } from "@/config/map";
import { destinations } from "@/content/destinations";
import { futureDestinationNodes } from "@/content/travel-experiences";
import { TravelAppBar } from "@/features/travel/components/travel-app-bar";
import { WorldExperience } from "@/features/travel/components/world-experience";

const destinationSummaries = selectDestinationSummaries(destinations);
const worldNodes = selectWorldNetworkNodes(destinationSummaries, futureDestinationNodes);

export const metadata: Metadata = {
  title: "Choose a destination · اختر وجهة",
};

export default function MapPage() {
  const configuration = resolveMapConfiguration();

  return (
    <section className="map-app-shell">
      <TravelAppBar currentLevel="world" returnHref="/" returnLabel="Back to MANARA introduction" />
      <WorldExperience configuration={configuration} worldNodes={worldNodes} />
    </section>
  );
}
