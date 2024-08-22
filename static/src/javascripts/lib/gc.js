class TransDirection {
    constructor(src, dst) {
        this.src = src;
        this.dst = dst;
    }

    toKey() {
        return `${this.src}${this.dst}`;
    }

    toFullKey() {
        return `full_${this.src}${this.dst}`;
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

class PosInfo {
    constructor(codeName, major) {
        this.codeName = codeName;
        this.major = major;
    }
}

const PARTS_OF_SPEECH = [
    new PosInfo("NOUN", true),
    new PosInfo("VERB", true),
    new PosInfo("ADJ", true),
    new PosInfo("ADV", true),

    new PosInfo("ADP", false),
    new PosInfo("AUX", false),
    new PosInfo("CCONJ", false),
    new PosInfo("DET", false),
    new PosInfo("INTJ", false),
    new PosInfo("NUM", false),
    new PosInfo("PART", false),
    new PosInfo("PRON", false),
    new PosInfo("PROPN", false),
    new PosInfo("SCONJ", false),
    new PosInfo("X", false),
];

function ellipsize(s, targetLength) {
    if (s.length <= targetLength) {
        return s;
    }
    return `${s.substr(0, targetLength - 1)}…`;
}

const COMMON_TRANS_DIRECTIONS = [
    new TransDirection("kk", "ru"),
    new TransDirection("kk", "en"),
];

const COMMON_TRANS_DIRECTION_BY_KEY = buildDirectionByKeyMap(COMMON_TRANS_DIRECTIONS);

export {
    TransDirection,
    buildDirectionByKeyMap,
    PARTS_OF_SPEECH,
    ellipsize,
    COMMON_TRANS_DIRECTIONS,
    COMMON_TRANS_DIRECTION_BY_KEY,
};