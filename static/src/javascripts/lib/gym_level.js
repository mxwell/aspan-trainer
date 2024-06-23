class GymLevel {
    constructor(levelKey, parentKey, available, completed) {
        this.levelKey = levelKey;
        this.parentKey = parentKey;
        this.available = available;
        this.completed = completed;
    }
}

const PART_TYPE_PLAIN = "plain";  // text is shown as is
const PART_TYPE_KEY = "key";  // text "алу" should be shown like this: [ алу ]

class StatementPart {
    constructor(partType, text) {
        this.partType = partType;
        this.text = text;
    }
}

function makePlainPart(text) {
    return new StatementPart(PART_TYPE_PLAIN, text);
}

function makeKeyPart(text) {
    return new StatementPart(PART_TYPE_KEY, text);
}

class Statement {
    constructor(parts, metaParts) {
        this.parts = parts;
        this.metaParts = metaParts;
    }
}

class GymTask {
    constructor(statement, correctAnswers) {
        this.statement = statement;
        this.correctAnswers = correctAnswers;
    }
}

export {
    GymLevel,
    PART_TYPE_PLAIN,
    PART_TYPE_KEY,
    makePlainPart,
    makeKeyPart,
    Statement,
    GymTask,
};