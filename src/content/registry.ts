import { characters } from "@/content/characters";
import { destinations } from "@/content/destinations";
import {
  dialoguePacks,
  getDialoguePackByScenarioId,
  getPublishedDialoguePack,
  validateDialoguePacks,
} from "@/content/dialogue-packs";
import {
  crossDialectTransferRules,
  dialectVariants,
  learningConcepts,
} from "@/content/linguistic-concepts";
import { scenarios } from "@/content/scenarios";
import { getScenarioEnvironment, scenarioEnvironments } from "@/content/scenario-environments";
import {
  destinationArrivals,
  futureDestinationNodes,
  getScenarioHotspot,
  scenarioHotspots,
  worldCameraPreset,
} from "@/content/travel-experiences";
import type {
  CrossDialectTransferRule,
  DialectVariant,
  ReviewMetadata,
} from "@/domain/content/types";
import type { CameraPreset, GeographicPoint, ScenarioHotspot } from "@/domain/travel/types";
import type { DialoguePack } from "@/domain/scenario/types";

export const contentRegistry = Object.freeze({
  characters,
  crossDialectTransferRules,
  destinationArrivals,
  destinations,
  dialectVariants,
  dialoguePacks,
  futureDestinationNodes,
  learningConcepts,
  scenarioHotspots,
  scenarioEnvironments,
  scenarios,
  worldCameraPreset,
});

export function getDestinationBySlug(slug: string) {
  return destinations.find((destination) => destination.slug === slug);
}

export function getScenarioById(id: string) {
  return scenarios.find((scenario) => scenario.id === id);
}

export function getEnterableScenarioBySlugs(destinationSlug: string, hotspotSlug: string) {
  const destination = getDestinationBySlug(destinationSlug);

  if (!destination || destination.availability !== "available") {
    return undefined;
  }

  const hotspot = getScenarioHotspot(destination.id, hotspotSlug);

  if (!hotspot || !destination.scenarioIds.some((id) => id === hotspot.scenarioId)) {
    return undefined;
  }

  const scenario = getScenarioById(hotspot.scenarioId);

  if (
    !scenario ||
    scenario.availability !== "available" ||
    scenario.destinationId !== destination.id
  ) {
    return undefined;
  }

  return { destination, hotspot, scenario } as const;
}

export function getScenarioLearningBundle(scenarioId: string) {
  const scenario = getScenarioById(scenarioId);
  const pack = getDialoguePackByScenarioId(scenarioId);
  const environment = scenario ? getScenarioEnvironment(scenario.environmentId) : undefined;
  const character = scenario
    ? characters.find(({ id }) => id === scenario.characterId)
    : undefined;

  if (!scenario || !pack || !environment || !character) return undefined;
  return { character, environment, pack, scenario } as const;
}

export function getPublishedScenarioLearningBundle(scenarioId: string) {
  const bundle = getScenarioLearningBundle(scenarioId);
  if (!bundle || !getPublishedDialoguePack(scenarioId)) return undefined;
  return bundle;
}

export function getAuthoritativeDialectVariants(): readonly DialectVariant[] {
  const variants: readonly DialectVariant[] = dialectVariants;

  return variants.filter(
    (variant) =>
      variant.validationStatus === "verified" &&
      variant.publicationStatus === "enabled" &&
      variant.evidenceIds.length > 0 &&
      variant.reviewerIds.length > 0 &&
      Boolean(variant.reviewedAt),
  );
}

export function getContentValidationSummary() {
  const dialogueRecords: ReviewMetadata[] = dialoguePacks.flatMap((pack) => [
    pack,
    ...pack.beats.flatMap((beat) => [
      beat,
      beat.characterLine,
      ...beat.responseOptions,
      ...beat.vocabulary,
    ]),
  ]);
  const records: readonly ReviewMetadata[] = [
    ...characters,
    ...scenarios,
    ...learningConcepts,
    ...dialectVariants,
    ...crossDialectTransferRules,
    ...scenarioEnvironments,
    ...dialogueRecords,
  ];

  return records.reduce(
    (summary, record) => ({
      needsReview: summary.needsReview + (record.validationStatus === "needs_review" ? 1 : 0),
      verified: summary.verified + (record.validationStatus === "verified" ? 1 : 0),
    }),
    { needsReview: 0, verified: 0 },
  );
}

function reviewMetadataIssue(record: ReviewMetadata, id: string) {
  if (record.validationStatus !== "verified") {
    return undefined;
  }

  if (record.evidenceIds.length === 0 || record.reviewerIds.length === 0 || !record.reviewedAt) {
    return `${id} is marked verified without complete evidence and reviewer metadata.`;
  }

  return undefined;
}

function geographicPointIssue(point: GeographicPoint, id: string) {
  const [longitude, latitude] = point;

  if (
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180 ||
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90
  ) {
    return `${id} has coordinates outside valid longitude/latitude bounds.`;
  }

  return undefined;
}

function cameraPresetIssues(camera: CameraPreset, id: string) {
  const issues: string[] = [];
  const pointIssue = geographicPointIssue(camera.center, `${id} camera`);

  if (pointIssue) issues.push(pointIssue);
  if (!Number.isFinite(camera.zoom) || camera.zoom < 0 || camera.zoom > 24) {
    issues.push(`${id} has a camera zoom outside the supported range.`);
  }
  if (!Number.isFinite(camera.pitch) || camera.pitch < 0 || camera.pitch > 60) {
    issues.push(`${id} has a camera pitch outside the supported range.`);
  }
  if (!Number.isFinite(camera.bearing) || camera.bearing < -180 || camera.bearing > 180) {
    issues.push(`${id} has a camera bearing outside the supported range.`);
  }

  return issues;
}

function localizedTextIssues(text: Readonly<{ ar: string; en: string }>, id: string) {
  const issues: string[] = [];

  if (!text.en.trim()) issues.push(`${id} is missing English copy.`);
  if (!text.ar.trim()) issues.push(`${id} is missing Arabic copy.`);
  if (text.ar !== text.ar.normalize("NFC")) {
    issues.push(`${id} Arabic copy is not stored in NFC normalization.`);
  }

  return issues;
}

function fallbackPositionIssue(
  position: Readonly<{ inline: number; block: number }>,
  id: string,
) {
  if (
    !Number.isFinite(position.inline) ||
    position.inline < 0 ||
    position.inline > 100 ||
    !Number.isFinite(position.block) ||
    position.block < 0 ||
    position.block > 100
  ) {
    return `${id} has a fallback position outside the 0–100 percent bounds.`;
  }

  return undefined;
}

export function validateContentRegistry(): readonly string[] {
  const issues: string[] = [...validateDialoguePacks()];
  const destinationIds = new Set<string>(destinations.map(({ id }) => id));
  const scenarioIds = new Set<string>(scenarios.map(({ id }) => id));
  const characterIds = new Set<string>(characters.map(({ id }) => id));
  const conceptIds = new Set<string>(learningConcepts.map(({ id }) => id));
  const variantIds = new Set<string>(dialectVariants.map(({ id }) => id));
  const destinationArrivalIds = new Set<string>();
  const hotspotIds = new Set<string>();
  const hotspotRouteKeys = new Set<string>();
  const futureNodeIds = new Set<string>();
  const environmentIds = new Set<string>();
  const travelHotspots: readonly ScenarioHotspot[] = scenarioHotspots;
  const reviewedVariants: readonly DialectVariant[] = dialectVariants;
  const transferRules: readonly CrossDialectTransferRule[] = crossDialectTransferRules;

  issues.push(...cameraPresetIssues(worldCameraPreset, "world"));

  for (const destination of destinations) {
    const coordinateIssue = geographicPointIssue(destination.coordinates, destination.id);
    if (coordinateIssue) issues.push(coordinateIssue);

    if (destination.availability === "coming_soon" && destination.scenarioIds.length > 0) {
      issues.push(`${destination.id} is coming soon but references an enterable scenario.`);
    }

    for (const scenarioId of destination.scenarioIds) {
      const scenario = scenarios.find(({ id }) => id === scenarioId);
      if (!scenario) {
        issues.push(`${destination.id} references missing scenario ${scenarioId}.`);
      } else if (scenario.destinationId !== destination.id) {
        issues.push(`${destination.id} references scenario ${scenarioId} from another destination.`);
      }
    }
  }

  for (const arrival of destinationArrivals) {
    if (!destinationIds.has(arrival.destinationId)) {
      issues.push(`Arrival ${arrival.destinationId} references a missing destination.`);
    }
    if (destinationArrivalIds.has(arrival.destinationId)) {
      issues.push(`${arrival.destinationId} has more than one arrival configuration.`);
    }
    destinationArrivalIds.add(arrival.destinationId);
    issues.push(...cameraPresetIssues(arrival.worldCamera, `${arrival.destinationId} world arrival`));
    issues.push(...cameraPresetIssues(arrival.cityCamera, `${arrival.destinationId} city arrival`));
    issues.push(...localizedTextIssues(arrival.introduction, `${arrival.destinationId} introduction`));
  }

  for (const destination of destinations) {
    if (!destinationArrivalIds.has(destination.id)) {
      issues.push(`${destination.id} has no arrival configuration.`);
    }
  }

  for (const hotspot of travelHotspots) {
    const routeKey = `${hotspot.destinationId}:${hotspot.slug}`;

    if (hotspotIds.has(hotspot.id)) issues.push(`${hotspot.id} is duplicated.`);
    hotspotIds.add(hotspot.id);
    if (hotspotRouteKeys.has(routeKey)) issues.push(`${routeKey} is a duplicated hotspot route.`);
    hotspotRouteKeys.add(routeKey);

    const destination = destinations.find(({ id }) => id === hotspot.destinationId);
    if (!destination) {
      issues.push(`${hotspot.id} references a missing destination.`);
    } else if (destination.availability !== "available") {
      issues.push(`${hotspot.id} belongs to a destination that is not enterable.`);
    }

    const coordinateIssue = geographicPointIssue(hotspot.coordinates, hotspot.id);
    if (coordinateIssue) issues.push(coordinateIssue);
    const fallbackIssue = fallbackPositionIssue(hotspot.fallbackPosition, hotspot.id);
    if (fallbackIssue) issues.push(fallbackIssue);
    issues.push(...cameraPresetIssues(hotspot.camera, `${hotspot.id} scenario`));
    issues.push(...localizedTextIssues(hotspot.name, `${hotspot.id} name`));
    issues.push(...localizedTextIssues(hotspot.objective, `${hotspot.id} objective`));

    if (hotspot.availability === "available") {
      const scenario = scenarios.find(({ id }) => id === hotspot.scenarioId);

      if (!scenario) {
        issues.push(`${hotspot.id} references missing scenario ${hotspot.scenarioId}.`);
      } else {
        if (scenario.destinationId !== hotspot.destinationId) {
          issues.push(`${hotspot.id} references a scenario from another destination.`);
        }
        if (scenario.setting !== hotspot.kind) {
          issues.push(`${hotspot.id} does not match its scenario setting.`);
        }
      }

      if (!destination?.scenarioIds.some((id) => id === hotspot.scenarioId)) {
        issues.push(`${hotspot.id} references a scenario not published by its destination.`);
      }
    }
  }

  for (const node of futureDestinationNodes) {
    if (futureNodeIds.has(node.id) || destinationIds.has(node.id)) {
      issues.push(`${node.id} is duplicated.`);
    }
    futureNodeIds.add(node.id);

    const coordinateIssue = geographicPointIssue(node.coordinates, node.id);
    if (coordinateIssue) issues.push(coordinateIssue);
    issues.push(...localizedTextIssues(node.countryName, `${node.id} country name`));
    if (!Number.isFinite(node.labelPriority) || node.labelPriority < 0) {
      issues.push(`${node.id} has an invalid label priority.`);
    }
    issues.push(...localizedTextIssues(node.name, `${node.id} name`));
  }

  for (const character of characters) {
    if (!destinationIds.has(character.destinationId)) {
      issues.push(`${character.id} references missing destination ${character.destinationId}.`);
    }

    const issue = reviewMetadataIssue(character, character.id);
    if (issue) issues.push(issue);
  }

  for (const environment of scenarioEnvironments) {
    if (environmentIds.has(environment.id)) issues.push(`${environment.id} is duplicated.`);
    environmentIds.add(environment.id);
    if (!scenarioIds.has(environment.scenarioId)) {
      issues.push(`${environment.id} references missing scenario ${environment.scenarioId}.`);
    }
    issues.push(...localizedTextIssues(environment.label, `${environment.id} label`));
    issues.push(...localizedTextIssues(environment.atmosphere, `${environment.id} atmosphere`));
    const issue = reviewMetadataIssue(environment, environment.id);
    if (issue) issues.push(issue);
  }

  for (const scenario of scenarios) {
    if (!destinationIds.has(scenario.destinationId)) {
      issues.push(`${scenario.id} references missing destination ${scenario.destinationId}.`);
    }
    if (!characterIds.has(scenario.characterId)) {
      issues.push(`${scenario.id} references missing character ${scenario.characterId}.`);
    }
    const character = characters.find(({ id }) => id === scenario.characterId);
    if (
      character &&
      (character.destinationId !== scenario.destinationId ||
        character.targetDialectId !== scenario.targetDialectId)
    ) {
      issues.push(`${scenario.id} has a character outside its destination or target variety.`);
    }
    const pack = dialoguePacks.find(({ id }) => id === scenario.dialoguePackId);
    if (!pack || pack.scenarioId !== scenario.id || pack.characterId !== scenario.characterId) {
      issues.push(`${scenario.id} has a missing or mismatched dialogue pack.`);
    }
    const environment = scenarioEnvironments.find(({ id }) => id === scenario.environmentId);
    if (!environment || environment.scenarioId !== scenario.id) {
      issues.push(`${scenario.id} has a missing or mismatched environment.`);
    }
    for (const conceptId of scenario.learningConceptIds) {
      if (!conceptIds.has(conceptId)) issues.push(`${scenario.id} references missing concept ${conceptId}.`);
    }
    for (const variantId of scenario.allowedVariantIds) {
      if (!variantIds.has(variantId)) issues.push(`${scenario.id} references missing variant ${variantId}.`);
    }

    const issue = reviewMetadataIssue(scenario, scenario.id);
    if (issue) issues.push(issue);
  }

  const authoredDialoguePacks: readonly DialoguePack[] = dialoguePacks;
  for (const pack of authoredDialoguePacks) {
    const scenario = scenarios.find(({ id }) => id === pack.scenarioId);
    for (const beat of pack.beats) {
      for (const option of beat.responseOptions) {
        if (!conceptIds.has(option.learningConceptId)) {
          issues.push(`${option.id} references missing concept ${option.learningConceptId}.`);
        } else if (
          !scenario?.learningConceptIds.some((id) => id === option.learningConceptId)
        ) {
          issues.push(`${option.id} uses a concept outside ${pack.scenarioId}.`);
        }
        if ("variantId" in option && option.variantId) {
          const variant = dialectVariants.find(({ id }) => id === option.variantId);
          if (!variant) {
            issues.push(`${option.id} references missing variant ${option.variantId}.`);
          } else if (variant.conceptId !== option.learningConceptId) {
            issues.push(`${option.id} references a variant from another concept.`);
          }
        }
      }
    }
  }

  for (const concept of learningConcepts) {
    for (const variantId of concept.variantIds) {
      if (!variantIds.has(variantId)) issues.push(`${concept.id} references missing variant ${variantId}.`);
    }

    const issue = reviewMetadataIssue(concept, concept.id);
    if (issue) issues.push(issue);
  }

  for (const variant of reviewedVariants) {
    if (!conceptIds.has(variant.conceptId)) {
      issues.push(`${variant.id} references missing concept ${variant.conceptId}.`);
    }
    for (const scenarioId of variant.scenarioIds) {
      if (!scenarioIds.has(scenarioId)) issues.push(`${variant.id} references missing scenario ${scenarioId}.`);
    }
    if (variant.surfaceAr !== variant.surfaceAr.normalize("NFC")) {
      issues.push(`${variant.id} is not stored in NFC normalization.`);
    }
    for (const form of variant.matchForms) {
      if (form !== form.normalize("NFC")) issues.push(`${variant.id} has a non-NFC match form.`);
    }
    if (variant.validationStatus === "needs_review" && variant.publicationStatus === "enabled") {
      issues.push(`${variant.id} enables review-pending teaching content.`);
    }

    const issue = reviewMetadataIssue(variant, variant.id);
    if (issue) issues.push(issue);
  }

  for (const rule of transferRules) {
    if (!conceptIds.has(rule.conceptId)) issues.push(`${rule.id} references missing concept ${rule.conceptId}.`);
    if (!variantIds.has(rule.sourceVariantId)) issues.push(`${rule.id} has a missing source variant.`);
    if (!variantIds.has(rule.targetVariantId)) issues.push(`${rule.id} has a missing target variant.`);
    const sourceVariant = dialectVariants.find(({ id }) => id === rule.sourceVariantId);
    const targetVariant = dialectVariants.find(({ id }) => id === rule.targetVariantId);
    if (
      sourceVariant &&
      targetVariant &&
      (sourceVariant.conceptId !== rule.conceptId || targetVariant.conceptId !== rule.conceptId)
    ) {
      issues.push(`${rule.id} links variants outside its learning concept.`);
    }
    if (rule.validationStatus === "needs_review" && rule.publicationStatus === "enabled") {
      issues.push(`${rule.id} enables a review-pending transfer claim.`);
    }
    for (const scenarioId of rule.targetScenarioIds) {
      if (!scenarioIds.has(scenarioId)) issues.push(`${rule.id} references missing target scenario ${scenarioId}.`);
    }

    const issue = reviewMetadataIssue(rule, rule.id);
    if (issue) issues.push(issue);
  }

  return issues;
}
