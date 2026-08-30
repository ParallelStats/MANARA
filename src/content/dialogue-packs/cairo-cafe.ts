import { pendingLinguisticReview as review } from "@/content/review-state";
import type { DialoguePack } from "@/domain/scenario/types";

export const cairoCafeDialoguePack = {
  ...review,
  id: "dialogue-cairo-cafe",
  scenarioId: "scenario-cairo-cafe",
  characterId: "character-cairo-cafe-nour",
  environmentId: "environment-cairo-cafe",
  title: { en: "Coffee with Nour", ar: "قهوة مع نور" },
  startingBeatId: "cac-01-order",
  publicationStatus: "disabled",
  beats: [
    {
      ...review, id: "cac-01-order", scenarioId: "scenario-cairo-cafe", sequence: 1,
      characterLine: {
        ...review, id: "line-cac-01", scenarioId: "scenario-cairo-cafe", characterId: "character-cairo-cafe-nour", speaker: "local_character",
        arabicText: "أهلاً، تحب تشرب إيه؟", englishMeaning: "Hi, what would you like to drink?", transliteration: "Ahlan, tihibb tishrab eh?",
        dialectOrRegister: "Proposed casual Cairene Egyptian Arabic", communicativeIntent: "welcome_and_invite_drink_order",
        linguisticNotes: "A short neighbourhood café opening.", reviewerNote: "Confirm contemporary Cairene naturalness, verb forms, and addressee-gender bounds.",
      },
      prompt: { en: "Order a coffee.", ar: "اطلب قهوة." },
      hint: { en: "Try: I want a coffee, please.", ar: "جرّب: عايز قهوة لو سمحت." },
      vocabulary: [{ ...review, id: "vocab-cac-ayiz", arabic: "عايز", english: "I want", transliteration: "ayiz", reviewerNote: "Confirm gender/person bounds and casual café use." }],
      responseOptions: [
        {
          ...review, id: "response-cac-01-target", scenarioId: "scenario-cairo-cafe", beatId: "cac-01-order",
          arabicText: "عايز قهوة لو سمحت", englishMeaning: "I want a coffee, please.", transliteration: "Ayiz ahwa law samaht.",
          dialectOrRegister: "Proposed casual Cairene Egyptian Arabic", communicativeIntent: "order_coffee", kind: "target_dialect",
          learningConceptId: "concept-order-coffee", variantId: "variant-egyptian-want-coffee", nextBeatId: "cac-02-sugar",
          linguisticNotes: "Establishes the prototype Egyptian variant for later transfer.", reviewerNote: "Confirm wording, politeness, pronunciation guide, and learner-gender support.",
        },
        {
          ...review, id: "response-cac-01-msa", scenarioId: "scenario-cairo-cafe", beatId: "cac-01-order",
          arabicText: "أريد قهوة من فضلك", englishMeaning: "I would like coffee, please.", transliteration: "Uridu qahwatan min fadlik.",
          dialectOrRegister: "Proposed Modern Standard Arabic / formal bridge", communicativeIntent: "order_coffee", kind: "msa",
          learningConceptId: "concept-order-coffee", variantId: "variant-msa-want-coffee", nextBeatId: "cac-02-sugar",
          linguisticNotes: "MSA-aware branch; it must be framed as valid register adaptation if reviewed.", reviewerNote: "Confirm formal effect in this exact Cairene café relationship.",
        },
      ],
    },
    {
      ...review, id: "cac-02-sugar", scenarioId: "scenario-cairo-cafe", sequence: 2,
      characterLine: {
        ...review, id: "line-cac-02", scenarioId: "scenario-cairo-cafe", characterId: "character-cairo-cafe-nour", speaker: "local_character",
        arabicText: "سادة ولا بسكر؟", englishMeaning: "Plain or with sugar?", transliteration: "Sada wala bi-sukkar?",
        dialectOrRegister: "Proposed casual Cairene Egyptian Arabic", communicativeIntent: "ask_sugar_preference",
        linguisticNotes: "A quick order-detail choice.", reviewerNote: "Confirm terminology and default coffee interpretation in this scene.",
      },
      prompt: { en: "Ask for a little sugar.", ar: "اطلب قليلاً من السكر." },
      hint: { en: "Say: With a little sugar.", ar: "قل: بسكر خفيف." },
      vocabulary: [{ ...review, id: "vocab-cac-sukkar", arabic: "بسكر خفيف", english: "with a little sugar", transliteration: "bi-sukkar khafif", reviewerNote: "Confirm naturalness and intended sugar level." }],
      responseOptions: [{
        ...review, id: "response-cac-02", scenarioId: "scenario-cairo-cafe", beatId: "cac-02-sugar",
        arabicText: "بسكر خفيف", englishMeaning: "With a little sugar.", transliteration: "Bi-sukkar khafif.",
        dialectOrRegister: "Proposed casual Cairene café speech", communicativeIntent: "choose_light_sugar", kind: "beginner_model",
        learningConceptId: "concept-drink-detail", nextBeatId: "cac-03-size", linguisticNotes: "Concise service response.", reviewerNote: "Confirm conventional order terminology and agreement.",
      }],
    },
    {
      ...review, id: "cac-03-size", scenarioId: "scenario-cairo-cafe", sequence: 3,
      characterLine: {
        ...review, id: "line-cac-03", scenarioId: "scenario-cairo-cafe", characterId: "character-cairo-cafe-nour", speaker: "local_character",
        arabicText: "تحبها كبيرة ولا صغيرة؟", englishMeaning: "Would you like it large or small?", transliteration: "Tihibbaha kibira wala sughayyara?",
        dialectOrRegister: "Proposed casual Cairene Egyptian Arabic", communicativeIntent: "ask_drink_size",
        linguisticNotes: "Adds a familiar binary decision to the order.", reviewerNote: "Confirm pronominal reference, adjective forms, and café size conventions.",
      },
      prompt: { en: "Choose a small one.", ar: "اختر الحجم الصغير." },
      hint: { en: "Say: Small, please.", ar: "قل: صغيرة، من فضلك." },
      vocabulary: [{ ...review, id: "vocab-cac-sughayyara", arabic: "صغيرة", english: "small", transliteration: "sughayyara", reviewerNote: "Confirm vowel/transliteration and referent agreement." }],
      responseOptions: [{
        ...review, id: "response-cac-03", scenarioId: "scenario-cairo-cafe", beatId: "cac-03-size",
        arabicText: "صغيرة، من فضلك", englishMeaning: "Small, please.", transliteration: "Sughayyara, min fadlik.",
        dialectOrRegister: "Proposed casual/neutral Cairene café speech", communicativeIntent: "choose_small_size", kind: "beginner_model",
        learningConceptId: "concept-drink-detail", nextBeatId: "cac-04-here", linguisticNotes: "Modeled beginner response.", reviewerNote: "Confirm politeness and natural ellipsis.",
      }],
    },
    {
      ...review, id: "cac-04-here", scenarioId: "scenario-cairo-cafe", sequence: 4,
      characterLine: {
        ...review, id: "line-cac-04", scenarioId: "scenario-cairo-cafe", characterId: "character-cairo-cafe-nour", speaker: "local_character",
        arabicText: "تشربها هنا ولا تاخدها معاك؟", englishMeaning: "Will you drink it here or take it with you?", transliteration: "Tishrabha hina wala takhodha ma'ak?",
        dialectOrRegister: "Proposed casual Cairene Egyptian Arabic", communicativeIntent: "ask_dine_in_or_takeaway",
        linguisticNotes: "Moves the order toward completion using a natural service choice.", reviewerNote: "Confirm verb pronunciation, object pronouns, and current café phrasing.",
      },
      prompt: { en: "Say you will have it here.", ar: "قل إنك ستشربها هنا." },
      hint: { en: "Say: Here.", ar: "قل: هنا." },
      vocabulary: [{ ...review, id: "vocab-cac-hina", arabic: "هنا", english: "here", transliteration: "hina", reviewerNote: "Confirm expected Cairene pronunciation guide." }],
      responseOptions: [{
        ...review, id: "response-cac-04", scenarioId: "scenario-cairo-cafe", beatId: "cac-04-here",
        arabicText: "هنا", englishMeaning: "Here.", transliteration: "Hina.",
        dialectOrRegister: "Proposed casual Cairene Egyptian Arabic", communicativeIntent: "choose_dine_in", kind: "beginner_model",
        learningConceptId: "concept-drink-detail", nextBeatId: "cac-05-anything-else", linguisticNotes: "One-word answer is intentionally acceptable in context.", reviewerNote: "Confirm pragmatic completeness and pronunciation guide.",
      }],
    },
    {
      ...review, id: "cac-05-anything-else", scenarioId: "scenario-cairo-cafe", sequence: 5,
      characterLine: {
        ...review, id: "line-cac-05", scenarioId: "scenario-cairo-cafe", characterId: "character-cairo-cafe-nour", speaker: "local_character",
        arabicText: "تحب حاجة تانية؟", englishMeaning: "Would you like anything else?", transliteration: "Tihibb haga tanya?",
        dialectOrRegister: "Proposed casual Cairene Egyptian Arabic", communicativeIntent: "offer_additional_item",
        linguisticNotes: "Creates a concise polite-decline turn.", reviewerNote: "Confirm contemporary Cairo wording and addressee bounds.",
      },
      prompt: { en: "Decline and thank Nour.", ar: "ارفض واشكر نور." },
      hint: { en: "Say: No, thank you.", ar: "قل: لا، شكراً." },
      vocabulary: [{ ...review, id: "vocab-cac-shukran", arabic: "شكراً", english: "thank you", transliteration: "shukran", reviewerNote: "Confirm intended spoken delivery and register." }],
      responseOptions: [{
        ...review, id: "response-cac-05", scenarioId: "scenario-cairo-cafe", beatId: "cac-05-anything-else",
        arabicText: "لا، شكراً", englishMeaning: "No, thank you.", transliteration: "La, shukran.",
        dialectOrRegister: "Neutral everyday Arabic in a Cairene context", communicativeIntent: "decline_additional_item", kind: "beginner_model",
        learningConceptId: "concept-polite-close", nextBeatId: "cac-06-close", linguisticNotes: "Polite decline.", reviewerNote: "Confirm spoken naturalness in this context.",
      }],
    },
    {
      ...review, id: "cac-06-close", scenarioId: "scenario-cairo-cafe", sequence: 6, isCompletionBeat: true,
      characterLine: {
        ...review, id: "line-cac-06", scenarioId: "scenario-cairo-cafe", characterId: "character-cairo-cafe-nour", speaker: "local_character",
        arabicText: "تمام، القهوة جاية حالاً.", englishMeaning: "Great—the coffee is coming right away.", transliteration: "Tamam, il-ahwa gayya halan.",
        dialectOrRegister: "Proposed casual Cairene Egyptian Arabic", communicativeIntent: "confirm_order",
        linguisticNotes: "Signals successful completion without turning Nour into a teacher.", reviewerNote: "Confirm phrasing, agreement, and café naturalness.",
      },
      prompt: { en: "Close the exchange warmly.", ar: "اختتم الحوار بلطف." },
      hint: { en: "Say: Thanks.", ar: "قل: تسلمي." },
      vocabulary: [{ ...review, id: "vocab-cac-tislamy", arabic: "تسلمي", english: "thanks (to a woman)", transliteration: "tislamy", reviewerNote: "Confirm gendered address, spelling, and pragmatic gloss." }],
      responseOptions: [{
        ...review, id: "response-cac-06", scenarioId: "scenario-cairo-cafe", beatId: "cac-06-close",
        arabicText: "تسلمي", englishMeaning: "Thanks.", transliteration: "Tislamy.",
        dialectOrRegister: "Proposed casual Cairene Egyptian Arabic", communicativeIntent: "thank_and_close", kind: "beginner_model",
        learningConceptId: "concept-polite-close", completesScenario: true, linguisticNotes: "Gendered closing addressed to Nour.", reviewerNote: "Confirm spelling, pronunciation, and relationship/register.",
      }],
    },
  ],
} as const satisfies DialoguePack;
