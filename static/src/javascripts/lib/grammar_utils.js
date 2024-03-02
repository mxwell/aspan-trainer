import {
    GRAMMAR_PERSONS,
    GRAMMAR_NUMBERS,
    PRONOUN_BY_PERSON_NUMBER,
    POSSESSIVE_BY_PERSON_NUMBER,
    validateVerb,
    isVerbOptionalException,
    validPresentContPair,
    VerbBuilder
} from './aspan';

export const NOMINATIVE_PRONOUN = "NOMINATIVE_PRONOUN";
export const POSSESSIVE_PRONOUN = "POSSESSIVE_PRONOUN";

export function getPronounByParams(pronounType, person, number) {
    if (pronounType == POSSESSIVE_PRONOUN) {
        return POSSESSIVE_BY_PERSON_NUMBER[person][number];
    }
    return PRONOUN_BY_PERSON_NUMBER[person][number];
}

export function getNomPronounByPersonNumber(person, number) {
    return getPronounByParams(NOMINATIVE_PRONOUN, person, number);
}

export function getSentenceTerminator(sentenceType) {
    if (sentenceType == "Question") {
        return "?";
    }
    return "";
}

export class PersonNumber {
    constructor(person, number, pronoun = null) {
        this.person = person;
        this.number = number;
        this.pronoun = pronoun;
    }
}

export function buildMapByPronoun() {
    let map = new Map();
    for (const person of GRAMMAR_PERSONS) {
        for (const number of GRAMMAR_NUMBERS) {
            const pronoun = getPronounByParams(NOMINATIVE_PRONOUN, person, number);
            map.set(pronoun, new PersonNumber(person, number, pronoun));
        }
    }
    return map;
}

export function buildPersonNumberList() {
    let list = [];
    for (const person of GRAMMAR_PERSONS) {
        for (const number of GRAMMAR_NUMBERS) {
            const pronoun = getPronounByParams(NOMINATIVE_PRONOUN, person, number);
            list.push(new PersonNumber(person, number, pronoun));
        }
    }
    return list;
}
