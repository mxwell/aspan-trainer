const AUX_VERBS = [
    "жату",
    "отыру",
    "тұру",
    "жүру",
];

function parseAuxVerb(s) {
    if (s != null) {
        const sLower = s.trim().toLowerCase();
        for (let i in AUX_VERBS) {
            if (AUX_VERBS[i] == sLower) {
                return AUX_VERBS[i];
            }
        }
    }
    return AUX_VERBS[0];
}

function auxVerbAsParam(auxVerb) {
    if (auxVerb == null || auxVerb == AUX_VERBS[0]) {
        return null;
    }
    return `aux=${auxVerb}`;
}

export {
    AUX_VERBS,
    parseAuxVerb,
    auxVerbAsParam,
};