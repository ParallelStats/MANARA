import { pendingLinguisticReview as review } from "@/content/review-state";
import type { DialoguePack } from "@/domain/scenario/types";

export const cairoCafeDialoguePack = {
  ...review,
  id: "dialogue-cairo-cafe",
  scenarioId: "scenario-cairo-cafe",
  characterId: "character-cairo-cafe-nour",
  environmentId: "environment-cairo-cafe",

  title: {
    en: "Coffee with Nour",
    ar: "قهوة مع نور",
  },

  startingBeatId: "cac-01-order",
  publicationStatus: "disabled",

  beats: [
    {
      ...review,
      id: "cac-01-order",
      scenarioId: "scenario-cairo-cafe",
      sequence: 1,

      characterLine: {
        ...review,
        id: "line-cac-01",
        scenarioId: "scenario-cairo-cafe",
        characterId: "character-cairo-cafe-nour",
        speaker: "local_character",

        arabicText: "أهلاً، تحب تشرب إيه؟",
        englishMeaning: "Hi, what would you like to drink?",
        transliteration: "Ahlan, tihibb tishrab eh?",

        dialectOrRegister: "Casual Cairene Egyptian Arabic",
        communicativeIntent: "welcome_and_invite_drink_order",
        linguisticNotes: "Short natural café opening.",
        reviewerNote: "Presentation demo dialogue.",
      },

      prompt: {
        en: "Order a coffee.",
        ar: "اطلب قهوة.",
      },

      hint: {
        en: "Say: I want coffee.",
        ar: "قول: عاوز قهوة.",
      },

      vocabulary: [
        {
          ...review,
          id: "vocab-cac-ayiz",
          arabic: "عاوز",
          english: "I want",
          transliteration: "awiz",
          reviewerNote: "Presentation demo vocabulary.",
        },
      ],

      responseOptions: [
        {
          ...review,
          id: "response-cac-01-target",
          scenarioId: "scenario-cairo-cafe",
          beatId: "cac-01-order",

          arabicText: "عاوز قهوة",
          englishMeaning: "I want coffee.",
          transliteration: "Awiz ahwa.",

          dialectOrRegister: "Casual Cairene Egyptian Arabic",
          communicativeIntent: "order_coffee",
          kind: "target_dialect",

          learningConceptId: "concept-order-coffee",
          variantId: "variant-egyptian-want-coffee",

          nextBeatId: "cac-02-type",

          linguisticNotes: "Deterministic presentation phrase.",
          reviewerNote: "Presentation demo dialogue.",
        },
      ],
    },

    {
      ...review,
      id: "cac-02-type",
      scenarioId: "scenario-cairo-cafe",
      sequence: 2,

      characterLine: {
        ...review,
        id: "line-cac-02",
        scenarioId: "scenario-cairo-cafe",
        characterId: "character-cairo-cafe-nour",
        speaker: "local_character",

        arabicText: "اي نوع قهوة عايز؟",
        englishMeaning: "What kind of coffee do you want?",
        transliteration: "Eh naw' ahwa ayiz?",

        dialectOrRegister: "Casual Cairene Egyptian Arabic",
        communicativeIntent: "ask_coffee_type",

        linguisticNotes: "Asks which coffee the learner wants.",
        reviewerNote: "Presentation demo dialogue.",
      },

      prompt: {
        en: "Choose an Americano.",
        ar: "اختار أمريكانو.",
      },

      hint: {
        en: "Say: Americano.",
        ar: "قول: أمريكانو.",
      },

      vocabulary: [
        {
          ...review,
          id: "vocab-cac-americano",
          arabic: "أمريكانو",
          english: "Americano",
          transliteration: "Americano",
          reviewerNote: "Presentation demo vocabulary.",
        },
      ],

      responseOptions: [
        {
          ...review,
          id: "response-cac-02-americano",
          scenarioId: "scenario-cairo-cafe",
          beatId: "cac-02-type",

          arabicText: "أمريكانو",
          englishMeaning: "Americano.",
          transliteration: "Americano.",

          dialectOrRegister: "Casual café speech",
          communicativeIntent: "choose_americano",
          kind: "target_dialect",

          learningConceptId: "concept-coffee-type",

          nextBeatId: "cac-03-close",

          linguisticNotes: "Deterministic presentation phrase.",
          reviewerNote: "Presentation demo dialogue.",
        },
      ],
    },

    {
      ...review,
      id: "cac-03-close",
      scenarioId: "scenario-cairo-cafe",
      sequence: 3,
      isCompletionBeat: true,

      characterLine: {
        ...review,
        id: "line-cac-03",
        scenarioId: "scenario-cairo-cafe",
        characterId: "character-cairo-cafe-nour",
        speaker: "local_character",

        arabicText: "تفضل اقعد دقايق واجيبهولك",
        englishMeaning: "Have a seat for a few minutes and I'll bring it to you.",
        transliteration: "Tfaddal o'od da'aye' w ageebholak.",

        dialectOrRegister: "Casual Cairene Egyptian Arabic",
        communicativeIntent: "confirm_americano_order",

        linguisticNotes: "Friendly café order confirmation.",
        reviewerNote: "Presentation demo dialogue.",
      },

      prompt: {
        en: "Finish the café interaction.",
        ar: "اختتم الطلب.",
      },

      hint: {
        en: "Say: Thanks.",
        ar: "قول: شكراً.",
      },

      vocabulary: [
        {
          ...review,
          id: "vocab-cac-shukran",
          arabic: "شكراً",
          english: "Thanks",
          transliteration: "Shukran",
          reviewerNote: "Presentation demo vocabulary.",
        },
      ],

      responseOptions: [
        {
          ...review,
          id: "response-cac-03-thanks",
          scenarioId: "scenario-cairo-cafe",
          beatId: "cac-03-close",

          arabicText: "شكراً",
          englishMeaning: "Thanks.",
          transliteration: "Shukran.",

          dialectOrRegister: "Everyday Arabic",
          communicativeIntent: "thank_and_close",
          kind: "beginner_model",

          learningConceptId: "concept-polite-close",
          completesScenario: true,

          linguisticNotes: "Simple closing response.",
          reviewerNote: "Presentation demo dialogue.",
        },
      ],
    },
  ],
} as const satisfies DialoguePack;