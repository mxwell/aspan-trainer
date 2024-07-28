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

export {
    TransDirection,
    buildDirectionByKeyMap,
};