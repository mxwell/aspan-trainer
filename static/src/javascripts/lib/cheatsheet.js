const FSPT_SPACE = "space";
const FSPT_BASE = "base";
const FSPT_BASE_EXT = "baseExt";
const FSPT_BASE_AUX = "baseAux";
const FSPT_TENSE_AFFIX = "tenseAffix";
const FSPT_PERS_AFFIX = "persAffix";
const FSPT_NEG = "neg";  // negation particle
const FSPT_NEG_WORD = "negWord";  // negation word
const FSPT_Q = "q";  // question particle
const FSPT_QM = "qm";  // question mark

class StructurePart {
    constructor(partType, content) {
        this.partType = partType;
        this.content = content;
    }
    toString() {
        if (this.content == null) {
            return this.partType;
        }
        return `${this.partType}(${this.content})`;
    }
}

class FormStructure {
    constructor(parts, examplePhrasal) {
        this.parts = parts;
        this.examplePhrasal = examplePhrasal;
    }
    toString() {
        return this.parts.map(part => part.toString()).join(" ");
    }
}

class TopicLink {
    constructor(sourceTitle, title, url) {
        this.sourceTitle = sourceTitle;
        this.title = title;
        this.url = url;
    }
}

class FormStructureBuilder {
    constructor() {
        this.parts = [];
        this.examplePhrasal = null;
    }
    space() {
        this.parts.push(new StructurePart(FSPT_SPACE, null));
        return this;
    }
    base() {
        this.parts.push(new StructurePart(FSPT_BASE, null));
        return this;
    }
    baseExt(content) {
        this.parts.push(new StructurePart(FSPT_BASE_EXT, content));
        return this;
    }
    baseAux(content) {
        this.parts.push(new StructurePart(FSPT_BASE_AUX, content));
        return this;
    }
    tenseAffix(content) {
        this.parts.push(new StructurePart(FSPT_TENSE_AFFIX, content));
        return this;
    }
    persAffix() {
        this.parts.push(new StructurePart(FSPT_PERS_AFFIX, null));
        return this;
    }
    neg() {
        this.parts.push(new StructurePart(FSPT_NEG, null));
        return this;
    }
    negWord(content) {
        this.parts.push(new StructurePart(FSPT_NEG_WORD, content));
        return this;
    }
    q() {
        this.parts.push(new StructurePart(FSPT_Q, null));
        return this;
    }
    qM() {
        this.parts.push(new StructurePart(FSPT_QM, null));
        return this;
    }
    qPartsIf(condition) {
        if (condition) {
            this.space().q().qM();
        }
        return this;
    }
    example(examplePhrasal) {
        this.examplePhrasal = examplePhrasal;
        return this;
    }
    build() {
        return new FormStructure(this.parts, this.examplePhrasal);
    }
}

function newFormStructureBuilder() {
    return new FormStructureBuilder();
}

class Cheatsheet {
    constructor(statement, negative, question, links) {
        this.statement = statement;
        this.negative = negative;
        this.question = question;
        this.links = links;
    }
    print() {
        console.log("Cheatsheet:");
        console.log("- statement:");
        this.statement.forEach(structure => console.log(structure.toString()));
        console.log("- negative:");
        this.negative.forEach(structure => console.log(structure.toString()));
        console.log("- question:");
        this.question.forEach(structure => console.log(structure.toString()));
        console.log("- links:");
        this.links.forEach(link => console.log(link));
        console.log("End of Cheatsheet");
    }
}

export {
    FSPT_SPACE,
    FSPT_BASE,
    FSPT_BASE_EXT,
    FSPT_BASE_AUX,
    FSPT_TENSE_AFFIX,
    FSPT_PERS_AFFIX,
    FSPT_NEG,
    FSPT_NEG_WORD,
    FSPT_Q,
    FSPT_QM,
    TopicLink,
    newFormStructureBuilder,
    Cheatsheet,
};