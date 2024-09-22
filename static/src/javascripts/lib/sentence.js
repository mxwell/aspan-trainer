const SENTENCE_TYPES = [
    "Statement",
    "Negative",
    "Question",
];

function parseSentenceType(s) {
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

function sentenceTypeAsParam(sentenceType) {
    if (sentenceType == null || sentenceType == SENTENCE_TYPES[0]) {
        return null;
    }
    return `sentence_type=${sentenceType}`;
}

export {
    SENTENCE_TYPES,
    parseSentenceType,
    sentenceTypeAsParam,
};