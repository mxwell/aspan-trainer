import { GRAMMAR_NUMBERS, GRAMMAR_PERSONS, SEPTIKS } from "./aspan";
import { SENTENCE_TYPES } from "./sentence";

class DetectedWord {
    constructor(verb, isExceptional, sentenceType, tense, grammarPerson, grammarNumber, isNoun, septik) {
        this.verb = verb;
        this.isExceptional = isExceptional;
        this.sentenceType = sentenceType;
        this.tense = tense;
        this.grammarPerson = grammarPerson;
        this.grammarNumber = grammarNumber;
        this.isNoun = isNoun;
        this.septik = septik;
    }
}

function getSentenceTypeByIndex(sentenceType) {
    if (sentenceType == "0") {
        return SENTENCE_TYPES[0];
    } else if (sentenceType == "1") {
        return SENTENCE_TYPES[1];
    } else if (sentenceType == "2") {
        return SENTENCE_TYPES[2];
    }
    return null;
}

function getGrammarPerson(p) {
    if (p.length == 0) {
        return null;
    }
    const index = Number(p);
    if (index < 0 || index >= GRAMMAR_PERSONS.length) {
        return null;
    }
    return GRAMMAR_PERSONS[index];
}

function getGrammarNumber(n) {
    if (n.length == 0) {
        return null;
    }
    const index = Number(n);
    if (index < 0 || index >= GRAMMAR_NUMBERS.length) {
        return null;
    }
    return GRAMMAR_NUMBERS[index];
}

function getSeptik(n) {
    if (n.length == 0) {
        return null;
    }
    const index = Number(n);
    if (index < 0 || index >= SEPTIKS.length) {
        return null;
    }
    return SEPTIKS[index];
}

function unpackResponseWord(word) {
    const verb = word.initial;
    if (verb == null || verb.length == 0) {
        console.log("No verb in response word.");
        return null;
    }
    const isExceptional = word.exceptional == true;
    const parts = word.transition.split(":");
    if (parts.length == 4) {
        const sentenceType = getSentenceTypeByIndex(parts[0]);
        const tense = parts[1];
        if (tense.length == 0) {
            console.log("Error: empty tense in response word");
            return null;
        }
        const grammarPerson = getGrammarPerson(parts[2]);
        const grammarNumber = getGrammarNumber(parts[3]);
        return new DetectedWord(
            verb,
            isExceptional,
            sentenceType,
            tense,
            grammarPerson,
            grammarNumber,
            /* isNoun */ false,
            /* septik */ null,
        );
    } else if (parts.length == 5) {
        const sentenceType = getSentenceTypeByIndex(parts[0]);
        const tense = parts[1];
        const grammarPerson = getGrammarPerson(parts[2]);
        const grammarNumber = getGrammarNumber(parts[3]);
        const septik = getSeptik(parts[4]);
        const isNoun = septik != null;
        return new DetectedWord(
            verb,
            isExceptional,
            sentenceType,
            tense,
            grammarPerson,
            grammarNumber,
            isNoun,
            septik,
        );
    }
    return new DetectedWord(verb, isExceptional, null, null, null, null, false, null);
}

function unpackDetectResponse(responseWords) {
    for (let i = 0; i < responseWords.length; ++i) {
        let word = responseWords[i];
        let unpacked = unpackResponseWord(word);
        if (unpacked != null) {
            return unpacked;
        }
    }
    return null;
}

class DetectedForm {
    constructor(pos, base, sentenceType, excVerb, tense, grammarPerson, grammarNumber, septik) {
        this.pos = pos;
        this.base = base;
        this.sentenceType = sentenceType;
        this.excVerb = excVerb;
        this.tense = tense;
        this.grammarPerson = grammarPerson;
        this.grammarNumber = grammarNumber;
        this.septik = septik;
    }
}

function unpackResponseWordWithPos(word) {
    const base = word.initial;
    if (base == null || base.length == 0) {
        console.log("No initial in response word.");
        return null;
    }

    const meta = word.meta;
    let pos = meta.pos;
    let excVerb = false;
    if (pos == "w") {
        pos = "v";
        excVerb = true;
    }
    const parts = word.transition.split(":");
    const sentenceType = getSentenceTypeByIndex(parts[0]);
    const tense = parts[1];
    const grammarPerson = getGrammarPerson(parts[2]);
    const grammarNumber = getGrammarNumber(parts[3]);
    const septik = getSeptik(parts[4]);
    return new DetectedForm(
        pos,
        base,
        sentenceType,
        excVerb,
        tense,
        grammarPerson,
        grammarNumber,
        septik,
    );
}

/**
 * @returns array of DetectedForm
 */
function unpackDetectResponseWithPos(responseWords) {
    let result = [];
    for (let i = 0; i < responseWords.length; ++i) {
        let word = responseWords[i];
        let unpacked = unpackResponseWordWithPos(word);
        if (unpacked != null) {
            result.push(unpacked);
        }
    }
    return result;
}

export {
    unpackDetectResponse,
    unpackDetectResponseWithPos,
};