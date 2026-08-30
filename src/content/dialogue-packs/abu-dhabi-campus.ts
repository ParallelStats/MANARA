import { pendingLinguisticReview as review } from "@/content/review-state";
import type { DialoguePack } from "@/domain/scenario/types";

export const abuDhabiCampusDialoguePack = {
  ...review,
  id: "dialogue-abu-dhabi-campus",
  scenarioId: "scenario-abu-dhabi-campus",
  characterId: "character-abu-dhabi-campus-zayed",
  environmentId: "environment-abu-dhabi-campus",
  title: { en: "A first walk with Zayed", ar: "جولة أولى مع زايد" },
  startingBeatId: "adu-01-greeting",
  publicationStatus: "disabled",
  beats: [
    {
      ...review, id: "adu-01-greeting", scenarioId: "scenario-abu-dhabi-campus", sequence: 1,
      characterLine: {
        ...review, id: "line-adu-01", scenarioId: "scenario-abu-dhabi-campus", characterId: "character-abu-dhabi-campus-zayed", speaker: "local_character",
        arabicText: "السلام عليكم، أول مرة أشوفك هني. يديد في الجامعة؟", englishMeaning: "Hello—I haven't seen you here before. Are you new at the university?", transliteration: "As-salam alaykum, awwal marra ashoofak hini. Yideed fil-jamia?",
        dialectOrRegister: "Proposed casual Emirati youth speech — Abu Dhabi", communicativeIntent: "greet_new_student",
        linguisticNotes: "Peer opening that establishes the learner as new without implying prior history.", reviewerNote: "Confirm greeting flow, هني/يديد usage, addressee gender, and natural youth register.",
      },
      prompt: { en: "Greet Zayed and say you are a new student.", ar: "رحّب بزايد وقل إنك طالب جديد." },
      hint: { en: "Try: Hello, yes, I'm a new student.", ar: "جرّب: وعليكم السلام، هيه، أنا طالب يديد." },
      vocabulary: [{ ...review, id: "vocab-adu-yideed", arabic: "يديد", english: "new", transliteration: "yideed", reviewerNote: "Confirm Emirati attribution, pronunciation, and speaker variation." }],
      responseOptions: [{
        ...review, id: "response-adu-01", scenarioId: "scenario-abu-dhabi-campus", beatId: "adu-01-greeting",
        arabicText: "وعليكم السلام، هيه، أنا طالب يديد", englishMeaning: "Hello, yes, I'm a new student.", transliteration: "Wa alaykum as-salam, heeh, ana talib yideed.",
        dialectOrRegister: "Proposed casual Emirati youth speech", communicativeIntent: "introduce_as_new_student", kind: "beginner_model",
        learningConceptId: "concept-introduce-self", nextBeatId: "adu-02-library", linguisticNotes: "Modeled introduction; masculine learner form is a prototype limitation.", reviewerNote: "Confirm affirmative particle, adjective, and inclusive handling of learner gender.",
      }],
    },
    {
      ...review, id: "adu-02-library", scenarioId: "scenario-abu-dhabi-campus", sequence: 2,
      characterLine: {
        ...review, id: "line-adu-02", scenarioId: "scenario-abu-dhabi-campus", characterId: "character-abu-dhabi-campus-zayed", speaker: "local_character",
        arabicText: "حيّاك. أي مبنى تدور؟", englishMeaning: "Welcome. Which building are you looking for?", transliteration: "Hayyak. Ay mabna tdoor?",
        dialectOrRegister: "Proposed casual Emirati youth speech — Abu Dhabi", communicativeIntent: "ask_needed_building",
        linguisticNotes: "Transitions from introduction into the navigation task.", reviewerNote: "Confirm verb choice, question structure, and local naturalness.",
      },
      prompt: { en: "Say you are looking for the library.", ar: "قل إنك تبحث عن المكتبة." },
      hint: { en: "Say: I'm looking for the library building.", ar: "قل: أدور مبنى المكتبة." },
      vocabulary: [{ ...review, id: "vocab-adu-maktaba", arabic: "المكتبة", english: "the library", transliteration: "il-maktaba", reviewerNote: "Confirm article realization and campus phrasing." }],
      responseOptions: [{
        ...review, id: "response-adu-02", scenarioId: "scenario-abu-dhabi-campus", beatId: "adu-02-library",
        arabicText: "أدور مبنى المكتبة", englishMeaning: "I'm looking for the library building.", transliteration: "Adoor mabna il-maktaba.",
        dialectOrRegister: "Proposed casual Emirati youth speech", communicativeIntent: "ask_for_library", kind: "beginner_model",
        learningConceptId: "concept-find-place", nextBeatId: "adu-03-landmark", linguisticNotes: "Compact location request tied to the scene.", reviewerNote: "Confirm whether this is the most natural peer phrasing in Abu Dhabi.",
      }],
    },
    {
      ...review, id: "adu-03-landmark", scenarioId: "scenario-abu-dhabi-campus", sequence: 3,
      characterLine: {
        ...review, id: "line-adu-03", scenarioId: "scenario-abu-dhabi-campus", characterId: "character-abu-dhabi-campus-zayed", speaker: "local_character",
        arabicText: "المكتبة صوب الساحة، تشوف المبنى الزجاجي؟", englishMeaning: "The library is toward the courtyard. Do you see the glass building?", transliteration: "Il-maktaba soob is-saha, tshoof il-mabna iz-zijaji?",
        dialectOrRegister: "Proposed casual Emirati youth speech — Abu Dhabi", communicativeIntent: "give_landmark_direction",
        linguisticNotes: "Uses a visible landmark rather than a long direction monologue.", reviewerNote: "Confirm صوب, verb form, article assimilation, and landmark naturalness.",
      },
      prompt: { en: "Confirm that you see it.", ar: "أكد أنك تراه." },
      hint: { en: "Say: Yes, I see it.", ar: "قل: هيه، أشوفه." },
      vocabulary: [{ ...review, id: "vocab-adu-soob", arabic: "صوب", english: "toward", transliteration: "soob", reviewerNote: "Confirm Emirati meaning and scenario-appropriate use." }],
      responseOptions: [{
        ...review, id: "response-adu-03", scenarioId: "scenario-abu-dhabi-campus", beatId: "adu-03-landmark",
        arabicText: "هيه، أشوفه", englishMeaning: "Yes, I see it.", transliteration: "Heeh, ashoofah.",
        dialectOrRegister: "Proposed casual Emirati youth speech", communicativeIntent: "confirm_landmark", kind: "beginner_model",
        learningConceptId: "concept-find-place", nextBeatId: "adu-04-time", linguisticNotes: "Short confirmation keeps the exchange conversational.", reviewerNote: "Confirm affirmative and object-pronoun realization.",
      }],
    },
    {
      ...review, id: "adu-04-time", scenarioId: "scenario-abu-dhabi-campus", sequence: 4,
      characterLine: {
        ...review, id: "line-adu-04", scenarioId: "scenario-abu-dhabi-campus", characterId: "character-abu-dhabi-campus-zayed", speaker: "local_character",
        arabicText: "عندك محاضرة الحين؟", englishMeaning: "Do you have a lecture now?", transliteration: "Indak muhadara il-heen?",
        dialectOrRegister: "Proposed casual Emirati youth speech — Abu Dhabi", communicativeIntent: "ask_about_class_time",
        linguisticNotes: "Adds a brief social follow-up after the direction is understood.", reviewerNote: "Confirm الحين preference and addressee bounds.",
      },
      prompt: { en: "Say your class is at ten.", ar: "قل إن محاضرتك الساعة العاشرة." },
      hint: { en: "Say: Yes, at ten.", ar: "قل: هيه، الساعة عشر." },
      vocabulary: [{ ...review, id: "vocab-adu-ashar", arabic: "الساعة عشر", english: "at ten o'clock", transliteration: "is-saa'a ashar", reviewerNote: "Confirm number form and spoken time expression." }],
      responseOptions: [{
        ...review, id: "response-adu-04", scenarioId: "scenario-abu-dhabi-campus", beatId: "adu-04-time",
        arabicText: "هيه، الساعة عشر", englishMeaning: "Yes, at ten.", transliteration: "Heeh, is-saa'a ashar.",
        dialectOrRegister: "Proposed casual Emirati youth speech", communicativeIntent: "state_class_time", kind: "beginner_model",
        learningConceptId: "concept-class-time", nextBeatId: "adu-05-major", linguisticNotes: "Practises a compact time answer.", reviewerNote: "Confirm spoken number and expected article/vowel realization.",
      }],
    },
    {
      ...review, id: "adu-05-major", scenarioId: "scenario-abu-dhabi-campus", sequence: 5,
      characterLine: {
        ...review, id: "line-adu-05", scenarioId: "scenario-abu-dhabi-campus", characterId: "character-abu-dhabi-campus-zayed", speaker: "local_character",
        arabicText: "تدرس أي تخصص؟", englishMeaning: "What subject are you studying?", transliteration: "Tidrus ay takhassus?",
        dialectOrRegister: "Proposed casual Emirati youth speech — Abu Dhabi", communicativeIntent: "ask_field_of_study",
        linguisticNotes: "Turns navigation into a small, believable peer exchange.", reviewerNote: "Confirm peer phrasing and addressee-gender handling.",
      },
      prompt: { en: "Say you study engineering.", ar: "قل إنك تدرس الهندسة." },
      hint: { en: "Say: I study engineering.", ar: "قل: أدرس هندسة." },
      vocabulary: [{ ...review, id: "vocab-adu-handasa", arabic: "هندسة", english: "engineering", transliteration: "handasa", reviewerNote: "Confirm natural omission or use of the article in this reply." }],
      responseOptions: [{
        ...review, id: "response-adu-05", scenarioId: "scenario-abu-dhabi-campus", beatId: "adu-05-major",
        arabicText: "أدرس هندسة", englishMeaning: "I study engineering.", transliteration: "Adrus handasa.",
        dialectOrRegister: "Proposed neutral spoken Arabic", communicativeIntent: "state_field_of_study", kind: "beginner_model",
        learningConceptId: "concept-study-subject", nextBeatId: "adu-06-close", linguisticNotes: "Short subject statement usable by an MSA-aware beginner.", reviewerNote: "Confirm whether a more local verb/register choice is preferable.",
      }],
    },
    {
      ...review, id: "adu-06-close", scenarioId: "scenario-abu-dhabi-campus", sequence: 6, isCompletionBeat: true,
      characterLine: {
        ...review, id: "line-adu-06", scenarioId: "scenario-abu-dhabi-campus", characterId: "character-abu-dhabi-campus-zayed", speaker: "local_character",
        arabicText: "بالتوفيق، وإذا احتجت شي أنا زايد.", englishMeaning: "Good luck—and if you need anything, I'm Zayed.", transliteration: "Bit-tawfeeg, w-itha ihtajt shay ana Zayed.",
        dialectOrRegister: "Proposed casual Emirati youth speech — Abu Dhabi", communicativeIntent: "offer_help_and_close",
        linguisticNotes: "Friendly peer closing that keeps Zayed a person rather than a tutor.", reviewerNote: "Confirm conditional phrasing, register, and natural self-reference.",
      },
      prompt: { en: "Thank Zayed and finish.", ar: "اشكر زايد واختتم." },
      hint: { en: "Say: Thank you—you've been very helpful.", ar: "قل: مشكور، ما تقصّر." },
      vocabulary: [{ ...review, id: "vocab-adu-ma-tgassar", arabic: "ما تقصّر", english: "you've been very helpful", transliteration: "ma tgassar", reviewerNote: "Confirm pragmatic gloss and natural peer use." }],
      responseOptions: [{
        ...review, id: "response-adu-06", scenarioId: "scenario-abu-dhabi-campus", beatId: "adu-06-close",
        arabicText: "مشكور، ما تقصّر", englishMeaning: "Thank you—you've been very helpful.", transliteration: "Mashkoor, ma tgassar.",
        dialectOrRegister: "Proposed casual Emirati/Gulf courtesy formula", communicativeIntent: "thank_peer_and_close", kind: "beginner_model",
        learningConceptId: "concept-polite-close", completesScenario: true, linguisticNotes: "Closes the campus interaction warmly.", reviewerNote: "Confirm Emirati locality, register, and gendered address.",
      }],
    },
  ],
} as const satisfies DialoguePack;
