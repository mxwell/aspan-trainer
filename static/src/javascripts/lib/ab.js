const ALPHABET_KEYS = [
    "cyrillic",
    "latin2021",
];

function parseAlphabetKey(s) {
    if (s != null) {
        for (const abKey of ALPHABET_KEYS) {
            if (abKey == s) {
                return abKey;
            }
        }
    }
    return ALPHABET_KEYS[0];
}

function abKeyAsParam(abKey) {
    if (abKey == null || abKey == ALPHABET_KEYS[0]) {
        return null;
    }
    return `ab=${abKey}`;
}

function abIsLatin(abKey) {
    return abKey == ALPHABET_KEYS[1];
}

export {
    ALPHABET_KEYS,
    parseAlphabetKey,
    abKeyAsParam,
    abIsLatin,
};