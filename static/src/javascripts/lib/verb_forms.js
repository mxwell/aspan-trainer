import {
    GRAMMAR_PERSONS,
    GRAMMAR_NUMBERS,
    VerbBuilder
} from './aspan';
import {
    NOMINATIVE_PRONOUN,
    POSSESSIVE_PRONOUN,
    getPronounByParams,
} from './grammar_utils';

class VerbForm {
    constructor(pronoun, verbPhrase) {
        this.pronoun = pronoun;
        this.verbPhrase = verbPhrase;
    }
}

class TenseForms {
    /**
     *
     * @param {*} tenseNameKey - a title for the forms table
     * @param {*} groupNameKey - a key to group tables into sections;
     *   if it is the same for all tables, then only one section would appear
     * @param {*} forms - an array of VerbForm
     */
    constructor(tenseNameKey, groupNameKey, forms) {
        if (!(typeof groupNameKey == "string")) {
            throw Error("unexpected type of groupNameKey: " + typeof groupNameKey);
        }
        this.tenseNameKey = tenseNameKey;
        this.forms = forms;
        this.groupNameKey = groupNameKey;
    }
}

function createForms(tenseNameKey, groupNameKey, pronounType, caseFn) {
    let forms = [];
    for (const person of GRAMMAR_PERSONS) {
        for (const number of GRAMMAR_NUMBERS) {
            const verbPhrase = caseFn(person, number);
            const pronoun = getPronounByParams(pronounType, person, number);
            forms.push(new VerbForm(pronoun, verbPhrase));
        }
    }
    return new TenseForms(tenseNameKey, groupNameKey, forms);
}

export function generateVerbForms(verb, auxVerb, forceExceptional, sentenceType) {
    let tenses = [];
    let verbBuilder = new VerbBuilder(verb, forceExceptional);
    tenses.push(createForms(
        "presentTransitive",
        "present",
        NOMINATIVE_PRONOUN,
        (person, number) => verbBuilder.presentTransitiveForm(person, number, sentenceType),
    ));
    if (auxVerb == null || auxVerb == "") {
        auxVerb = "жату";
    }
    let auxBuilder = new VerbBuilder(auxVerb);
    tenses.push(createForms(
        "presentContinuous",
        "present",
        NOMINATIVE_PRONOUN,
        (person, number) => verbBuilder.presentContinuousForm(person, number, sentenceType, auxBuilder),
    ));
    tenses.push(createForms(
        "remotePastTense",
        "past",
        NOMINATIVE_PRONOUN,
        (person, number) => verbBuilder.remotePastTense(person, number, sentenceType),
    ));
    tenses.push(createForms(
        "pastUncertainTense",
        "past",
        NOMINATIVE_PRONOUN,
        (person, number) => verbBuilder.pastUncertainTense(person, number, sentenceType),
    ));
    tenses.push(createForms(
        "pastTransitiveTense",
        "past",
        NOMINATIVE_PRONOUN,
        (person, number) => verbBuilder.pastTransitiveTense(person, number, sentenceType),
    ));
    tenses.push(createForms(
        "pastTense",
        "past",
        NOMINATIVE_PRONOUN,
        (person, number) => verbBuilder.pastForm(person, number, sentenceType),
    ));
    tenses.push(createForms(
        "possibleFuture",
        "future",
        NOMINATIVE_PRONOUN,
        (person, number) => verbBuilder.possibleFutureForm(person, number, sentenceType),
    ));
    tenses.push(createForms(
        "intentionFuture",
        "future",
        NOMINATIVE_PRONOUN,
        (person, number) => verbBuilder.intentionFutureForm(person, number, sentenceType),
    ));
    tenses.push(createForms(
        "conditionalMood",
        "moods",
        NOMINATIVE_PRONOUN,
        (person, number) => verbBuilder.conditionalMood(person, number, sentenceType),
    ));
    tenses.push(createForms(
        "imperativeMood",
        "moods",
        NOMINATIVE_PRONOUN,
        (person, number) => verbBuilder.imperativeMood(person, number, sentenceType),
    ));
    const shak = "PresentTransitive";
    tenses.push(createForms(
        "optativeMood",
        "moods",
        POSSESSIVE_PRONOUN,
        (person, number) => verbBuilder.wantClause(person, number, sentenceType, shak),
    ));
    tenses.push(createForms(
        "canClause",
        "special",
        NOMINATIVE_PRONOUN,
        (person, number) => verbBuilder.canClause(person, number, sentenceType, shak),
    ));
    return tenses;
}