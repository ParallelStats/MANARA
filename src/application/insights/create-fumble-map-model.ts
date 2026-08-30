import { deriveLearningPatterns } from "@/application/insights/derive-learning-patterns";
import { generateFumbleMapInsights } from "@/application/insights/generate-insights";
import { generateFumbleMapRecommendations } from "@/application/insights/generate-recommendations";
import { scenarioRoute } from "@/application/travel/routes";
import { destinations } from "@/content/destinations";
import { scenarioHotspots } from "@/content/travel-experiences";
import type { FumbleMapModel } from "@/domain/insights/types";
import type { LearnerProfile } from "@/domain/learning/types";

function hrefForScenario(scenarioId: string | undefined) {
  const hotspot = scenarioHotspots.find(
    (item) => "scenarioId" in item && item.scenarioId === scenarioId,
  );
  const destination = destinations.find(({ id }) => id === hotspot?.destinationId);
  return hotspot && destination
    ? scenarioRoute(destination.slug, hotspot.slug)
    : "/map";
}

export function createFumbleMapModel(profile: LearnerProfile): FumbleMapModel {
  const startingPoint = profile.startingPoint?.kind ?? "beginner";
  const patterns = deriveLearningPatterns(profile);
  const insights = generateFumbleMapInsights(profile, patterns);
  const recommendations = generateFumbleMapRecommendations(insights, startingPoint, hrefForScenario);
  const scenarioEvents = profile.learningEvents.filter((event) =>
    event.type === "scenario_completed" || event.type === "turn_evaluated");
  const scenarioIds = [...new Set(scenarioEvents.map(({ scenarioId }) => scenarioId))];

  return {
    isEmpty: insights.length === 0,
    learnerStartingPoint: startingPoint,
    insights,
    recommendations,
    journey: scenarioIds.map((scenarioId) => {
      const events = scenarioEvents.filter((event) => event.scenarioId === scenarioId);
      return {
        scenarioId,
        eventIds: events.map(({ id }) => id),
        successful: events.some((event) =>
          event.type === "scenario_completed" || (event.type === "turn_evaluated" && event.understood)),
      };
    }),
  };
}
