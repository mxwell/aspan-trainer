export const SENTENCE_TYPES = [
    "Statement",
    "Negative",
    "Question",
];

export function parseSentenceType(s) {
    if (s != null) {
        const sLower = s.toLowerCase();
        for (let i in SENTENCE_TYPES) {
            if (SENTENCE_TYPES[i].toLowerCase() == sLower) {
                return SENTENCE_TYPES[i];
            }
        }
    }
    return SENTENCE_TYPES[0];
}