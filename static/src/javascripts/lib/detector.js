import { GRAMMAR_NUMBERS, GRAMMAR_PERSONS } from "./aspan";
import { SENTENCE_TYPES } from "./sentence";

class DetectedVerb {
    constructor(verb, isExceptional, sentenceType, tense, grammarPerson, grammarNumber) {
        this.verb = verb;
        this.isExceptional = isExceptional;
        this.sentenceType = sentenceType;
        this.tense = tense;
        this.grammarPerson = grammarPerson;
        this.grammarNumber = grammarNumber;
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
        return new DetectedVerb(verb, isExceptional, sentenceType, tense, grammarPerson, grammarNumber);
    }
    return new DetectedVerb(verb, isExceptional, null, null, null, null);
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

export {
    unpackDetectResponse,
};