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

export function getSentenceTerminator(sentenceType) {
    if (sentenceType == "Question") {
        return "?";
    }
    return "";
}
