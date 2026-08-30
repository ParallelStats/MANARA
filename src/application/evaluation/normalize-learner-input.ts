const arabicCombiningMarks = /[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed\u08d3-\u08ff]/gu;
const tatweel = /\u0640/gu;
const whitespace = /\s+/gu;

/**
 * Produces a conservative lookup key without changing Arabic letters.
 *
 * Deliberately absent: case folding, punctuation removal, and letter folding
 * such as hamza/alif, taa marbuta/haa, or yaa/alif maqsura equivalence.
 */
export function normalizeLearnerInput(value: string): string {
  return value
    .normalize("NFC")
    .replace(tatweel, "")
    .replace(arabicCombiningMarks, "")
    .replace(whitespace, " ")
    .trim();
}
