export type Locale = "ar" | "en";

export type LocalizedText = Readonly<Record<Locale, string>>;

export type ValidationStatus = "needs_review" | "verified";

export type DestinationAvailability = "available" | "coming_soon";

export interface ReviewMetadata {
  readonly validationStatus: ValidationStatus;
  readonly version: number;
  readonly evidenceIds: readonly string[];
  readonly reviewerIds: readonly string[];
  readonly reviewedAt?: string;
  readonly reviewNotes?: string;
}

export interface DialectReference {
  readonly id: string;
  readonly label: string;
  readonly locality: string;
  readonly validationStatus: ValidationStatus;
}

export interface Destination {
  readonly id: string;
  readonly slug: string;
  readonly name: LocalizedText;
  readonly countryName: LocalizedText;
  readonly dialect: DialectReference;
  readonly availability: DestinationAvailability;
  readonly scenarioIds: readonly string[];
  readonly coordinates: readonly [longitude: number, latitude: number];
  readonly mapPosition: Readonly<{
    inline: number;
    block: number;
  }>;
}

export interface Scenario extends ReviewMetadata {
  readonly id: string;
  readonly destinationId: string;
  readonly targetDialectId: string;
  readonly characterId: string;
  readonly title: string;
  readonly setting: "cafe" | "campus" | "transport";
  readonly availability: "planned" | "available";
  readonly environmentId: string;
  readonly dialoguePackId: string;
  readonly communicativeGoal: LocalizedText;
  readonly learningConceptIds: readonly string[];
  readonly allowedVariantIds: readonly string[];
}

export interface Character extends ReviewMetadata {
  readonly id: string;
  readonly destinationId: string;
  readonly targetDialectId: string;
  readonly displayName: LocalizedText;
  readonly role: "local_character";
  readonly learnerLevel: "beginner" | "intermediate";
  readonly ageContext: string;
  readonly relationship: string;
  readonly personality: string;
  readonly voiceProfile: Readonly<{
    locale: "ar-AE" | "ar-EG";
    preferredGender: "female" | "male";
  }>;
  readonly visualAssetPath: string;
  readonly visualId: string;
}

export interface LearningConcept extends ReviewMetadata {
  readonly id: string;
  readonly intent: string;
  readonly meaningEn: string;
  readonly variantIds: readonly string[];
}

export interface DialectVariant extends ReviewMetadata {
  readonly id: string;
  readonly conceptId: string;
  readonly dialectId: string;
  readonly surfaceAr: string;
  readonly matchForms: readonly string[];
  readonly glossEn: string;
  readonly register: "casual" | "formal" | "neutral";
  readonly communicativeIntent: string;
  readonly locality: string;
  readonly linguisticNotes: string;
  readonly reviewerNote: string;
  readonly scenarioIds: readonly string[];
  readonly publicationStatus: "disabled" | "enabled";
}

export interface CrossDialectTransferRule extends ReviewMetadata {
  readonly id: string;
  readonly conceptId: string;
  readonly sourceVariantId: string;
  readonly targetVariantId: string;
  readonly targetScenarioIds: readonly string[];
  readonly explanationKey: string;
  readonly reviewerNote: string;
  readonly publicationStatus: "disabled" | "enabled";
}
