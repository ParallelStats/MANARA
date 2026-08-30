import { pendingLinguisticReview as review } from "@/content/review-state";
import type { DialoguePack } from "@/domain/scenario/types";

export const cairoTaxiDialoguePack = {
  ...review,
  id: "dialogue-cairo-taxi",
  scenarioId: "scenario-cairo-transport",
  characterId: "character-cairo-taxi-hossam",
  environmentId: "environment-cairo-taxi",
  title: { en: "Across the city with Hossam", ar: "عبر المدينة مع حسام" },
  startingBeatId: "cat-01-destination",
  publicationStatus: "disabled",
  beats: [
    {
      ...review, id: "cat-01-destination", scenarioId: "scenario-cairo-transport", sequence: 1,
      characterLine: {
        ...review, id: "line-cat-01", scenarioId: "scenario-cairo-transport", characterId: "character-cairo-taxi-hossam", speaker: "local_character",
        arabicText: "أهلاً، رايح فين؟", englishMeaning: "Hello, where are you going?", transliteration: "Ahlan, rayih fein?",
        dialectOrRegister: "Proposed casual Cairene Egyptian Arabic", communicativeIntent: "ask_destination",
        linguisticNotes: "Starts from the passenger-seat context with a direct practical question.", reviewerNote: "Confirm everyday driver wording, addressee gender, and tone.",
      },
      prompt: { en: "Say you are going downtown.", ar: "قل إنك ذاهب إلى وسط البلد." },
      hint: { en: "Try: I'm going downtown.", ar: "جرّب: رايح وسط البلد." },
      vocabulary: [{ ...review, id: "vocab-cat-wust", arabic: "وسط البلد", english: "downtown", transliteration: "wust il-balad", reviewerNote: "Confirm destination meaning and contemporary Cairo usage." }],
      responseOptions: [{
        ...review, id: "response-cat-01", scenarioId: "scenario-cairo-transport", beatId: "cat-01-destination",
        arabicText: "رايح وسط البلد", englishMeaning: "I'm going downtown.", transliteration: "Rayih wust il-balad.",
        dialectOrRegister: "Proposed casual Cairene Egyptian Arabic", communicativeIntent: "state_destination", kind: "beginner_model",
        learningConceptId: "concept-state-destination", nextBeatId: "cat-02-route", linguisticNotes: "Direct destination statement; masculine learner form is a prototype limitation.", reviewerNote: "Confirm destination phrasing and inclusive learner-gender strategy.",
      }],
    },
    {
      ...review, id: "cat-02-route", scenarioId: "scenario-cairo-transport", sequence: 2,
      characterLine: {
        ...review, id: "line-cat-02", scenarioId: "scenario-cairo-transport", characterId: "character-cairo-taxi-hossam", speaker: "local_character",
        arabicText: "من طريق النيل ولا الطريق السريع؟", englishMeaning: "Via the Nile road or the highway?", transliteration: "Min taree' in-Neel wala it-taree' is-saree'?",
        dialectOrRegister: "Proposed casual Cairene Egyptian Arabic", communicativeIntent: "offer_route_choice",
        linguisticNotes: "Introduces route vocabulary without claiming a specific real trip is optimal.", reviewerNote: "Confirm route labels, article realization, and natural driver phrasing.",
      },
      prompt: { en: "Choose the Nile road.", ar: "اختر طريق النيل." },
      hint: { en: "Say: Via the Nile road, please.", ar: "قل: من طريق النيل لو سمحت." },
      vocabulary: [{ ...review, id: "vocab-cat-taree", arabic: "طريق", english: "road / route", transliteration: "taree'", reviewerNote: "Confirm pronunciation guide and transport-context gloss." }],
      responseOptions: [{
        ...review, id: "response-cat-02", scenarioId: "scenario-cairo-transport", beatId: "cat-02-route",
        arabicText: "من طريق النيل لو سمحت", englishMeaning: "Via the Nile road, please.", transliteration: "Min taree' in-Neel law samaht.",
        dialectOrRegister: "Proposed casual Cairene Egyptian Arabic", communicativeIntent: "choose_nile_route", kind: "beginner_model",
        learningConceptId: "concept-choose-route", nextBeatId: "cat-03-urgency", linguisticNotes: "Polite route selection.", reviewerNote: "Confirm preposition and naturalness in a taxi exchange.",
      }],
    },
    {
      ...review, id: "cat-03-urgency", scenarioId: "scenario-cairo-transport", sequence: 3,
      characterLine: {
        ...review, id: "line-cat-03", scenarioId: "scenario-cairo-transport", characterId: "character-cairo-taxi-hossam", speaker: "local_character",
        arabicText: "عندك وقت ولا مستعجل؟", englishMeaning: "Do you have time, or are you in a hurry?", transliteration: "Andak wa't wala mista'gil?",
        dialectOrRegister: "Proposed casual Cairene Egyptian Arabic", communicativeIntent: "ask_urgency",
        linguisticNotes: "Creates a short clarification about travel pace.", reviewerNote: "Confirm idiomatic phrasing and addressee-gender handling.",
      },
      prompt: { en: "Say you are not in a hurry.", ar: "قل إنك لست مستعجلاً." },
      hint: { en: "Say: I'm not in a hurry.", ar: "قل: مش مستعجل." },
      vocabulary: [{ ...review, id: "vocab-cat-mistaagil", arabic: "مستعجل", english: "in a hurry", transliteration: "mista'gil", reviewerNote: "Confirm Cairene realization and gender variants." }],
      responseOptions: [{
        ...review, id: "response-cat-03", scenarioId: "scenario-cairo-transport", beatId: "cat-03-urgency",
        arabicText: "مش مستعجل", englishMeaning: "I'm not in a hurry.", transliteration: "Mish mista'gil.",
        dialectOrRegister: "Proposed casual Cairene Egyptian Arabic", communicativeIntent: "state_not_urgent", kind: "beginner_model",
        learningConceptId: "concept-describe-urgency", nextBeatId: "cat-04-stop", linguisticNotes: "Short practical response.", reviewerNote: "Confirm gender handling and everyday taxi naturalness.",
      }],
    },
    {
      ...review, id: "cat-04-stop", scenarioId: "scenario-cairo-transport", sequence: 4,
      characterLine: {
        ...review, id: "line-cat-04", scenarioId: "scenario-cairo-transport", characterId: "character-cairo-taxi-hossam", speaker: "local_character",
        arabicText: "أنزّلك عند الميدان؟", englishMeaning: "Shall I drop you at the square?", transliteration: "Anazzilak and il-midan?",
        dialectOrRegister: "Proposed casual Cairene Egyptian Arabic", communicativeIntent: "confirm_dropoff",
        linguisticNotes: "Checks the exact stop before the fare exchange.", reviewerNote: "Confirm causative form, pronoun, and driver register.",
      },
      prompt: { en: "Confirm the square.", ar: "أكد أن النزول عند الميدان." },
      hint: { en: "Say: Yes, at the square.", ar: "قل: أيوه، عند الميدان." },
      vocabulary: [{ ...review, id: "vocab-cat-midan", arabic: "الميدان", english: "the square", transliteration: "il-midan", reviewerNote: "Confirm generic destination sense and pronunciation." }],
      responseOptions: [{
        ...review, id: "response-cat-04", scenarioId: "scenario-cairo-transport", beatId: "cat-04-stop",
        arabicText: "أيوه، عند الميدان", englishMeaning: "Yes, at the square.", transliteration: "Aywa, and il-midan.",
        dialectOrRegister: "Proposed casual Cairene Egyptian Arabic", communicativeIntent: "confirm_dropoff", kind: "beginner_model",
        learningConceptId: "concept-confirm-stop", nextBeatId: "cat-05-fare", linguisticNotes: "Confirms the agreed stop.", reviewerNote: "Confirm affirmative spelling/transliteration and preposition.",
      }],
    },
    {
      ...review, id: "cat-05-fare", scenarioId: "scenario-cairo-transport", sequence: 5,
      characterLine: {
        ...review, id: "line-cat-05", scenarioId: "scenario-cairo-transport", characterId: "character-cairo-taxi-hossam", speaker: "local_character",
        arabicText: "العداد دلوقتي مية جنيه.", englishMeaning: "The meter is at one hundred pounds now.", transliteration: "Il-addad dilwa'ti miyya gineh.",
        dialectOrRegister: "Proposed casual Cairene Egyptian Arabic", communicativeIntent: "state_meter_fare",
        linguisticNotes: "A fictional practice fare, not current pricing guidance.", reviewerNote: "Confirm number form, currency pronunciation, and natural meter phrasing; this is synthetic scenario data.",
      },
      prompt: { en: "Acknowledge the fare.", ar: "أكد أنك فهمت الأجرة." },
      hint: { en: "Say: Okay, understood.", ar: "قل: تمام، فهمت." },
      vocabulary: [{ ...review, id: "vocab-cat-miyya", arabic: "مية جنيه", english: "one hundred pounds", transliteration: "miyya gineh", reviewerNote: "Confirm numeral/currency form; retain fictional-price disclaimer." }],
      responseOptions: [{
        ...review, id: "response-cat-05", scenarioId: "scenario-cairo-transport", beatId: "cat-05-fare",
        arabicText: "تمام، فهمت", englishMeaning: "Okay, understood.", transliteration: "Tamam, fihimt.",
        dialectOrRegister: "Proposed casual Cairene Egyptian Arabic", communicativeIntent: "acknowledge_fare", kind: "beginner_model",
        learningConceptId: "concept-understand-price", nextBeatId: "cat-06-close", linguisticNotes: "Acknowledges the fictional meter amount.", reviewerNote: "Confirm spoken form and whether a different response is more natural.",
      }],
    },
    {
      ...review, id: "cat-06-close", scenarioId: "scenario-cairo-transport", sequence: 6, isCompletionBeat: true,
      characterLine: {
        ...review, id: "line-cat-06", scenarioId: "scenario-cairo-transport", characterId: "character-cairo-taxi-hossam", speaker: "local_character",
        arabicText: "وصلنا. هنا مناسب؟", englishMeaning: "We've arrived. Is here okay?", transliteration: "Wisilna. Hina munasib?",
        dialectOrRegister: "Proposed casual Cairene Egyptian Arabic", communicativeIntent: "confirm_arrival",
        linguisticNotes: "Ends with a final location check rather than an abrupt completion.", reviewerNote: "Confirm verb pronunciation, adjective choice, and taxi naturalness.",
      },
      prompt: { en: "Confirm and thank Hossam.", ar: "أكد واشكر حسام." },
      hint: { en: "Say: Yes, here is good. Thank you.", ar: "قل: أيوه، هنا كويس. شكراً." },
      vocabulary: [{ ...review, id: "vocab-cat-kwayyis", arabic: "كويس", english: "good / fine", transliteration: "kwayyis", reviewerNote: "Confirm natural use for a stopping place and gender agreement." }],
      responseOptions: [{
        ...review, id: "response-cat-06", scenarioId: "scenario-cairo-transport", beatId: "cat-06-close",
        arabicText: "أيوه، هنا كويس. شكراً", englishMeaning: "Yes, here is good. Thank you.", transliteration: "Aywa, hina kwayyis. Shukran.",
        dialectOrRegister: "Proposed casual Cairene Egyptian Arabic", communicativeIntent: "confirm_stop_and_thank", kind: "beginner_model",
        learningConceptId: "concept-polite-close", completesScenario: true, linguisticNotes: "Completes the taxi journey politely.", reviewerNote: "Confirm agreement, punctuation/prosody, and natural closing.",
      }],
    },
  ],
} as const satisfies DialoguePack;
