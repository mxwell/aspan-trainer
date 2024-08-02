class TransDirection {
    constructor(src, dst) {
        this.src = src;
        this.dst = dst;
    }

    toKey() {
        return `${this.src}${this.dst}`;
    }

    toString() {
        return `${this.src} → ${this.dst}`;
    }
}

function buildDirectionByKeyMap(dirs) {
    let result = {};
    for (let d of dirs) {
        result[d.toKey()] = d;
    }
    return result;
}

const PARTS_OF_SPEECH = [
    "ADJ",
    "ADP",
    "ADV",
    "AUX",
    "CCONJ",
    "DET",
    "INTJ",
    "NOUN",
    "NUM",
    "PART",
    "PRON",
    "PROPN",
    "SCONJ",
    "VERB",
    "X",
];

function ellipsize(s) {
    if (s.length <= 8) {
        return s;
    }
    return `${s.substr(0, 7)}…`;
}

export {
    TransDirection,
    buildDirectionByKeyMap,
    PARTS_OF_SPEECH,
    ellipsize,
};