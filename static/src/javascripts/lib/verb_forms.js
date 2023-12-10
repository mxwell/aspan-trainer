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
    // forms is an array of VerbForm
    constructor(tenseNameKey, forms) {
        this.tenseNameKey = tenseNameKey;
        this.forms = forms;
    }
}

function createForms(tenseNameKey, pronounType, caseFn) {
    let forms = [];
    for (const person of GRAMMAR_PERSONS) {
        for (const number of GRAMMAR_NUMBERS) {
            const verbPhrase = caseFn(person, number);
            const pronoun = getPronounByParams(pronounType, person, number);
            forms.push(new VerbForm(pronoun, verbPhrase));
        }
    }
    return new TenseForms(tenseNameKey, forms);
}

export function generateVerbForms(verb, auxVerb, forceExceptional, sentenceType) {
    let tenses = [];
    let verbBuilder = new VerbBuilder(verb, forceExceptional);
    tenses.push(createForms(
        "presentTransitive",
        NOMINATIVE_PRONOUN,
        (person, number) => verbBuilder.presentTransitiveForm(person, number, sentenceType),
    ));
    if (auxVerb == null || auxVerb == "") {
        auxVerb = "жату";
    }
    let auxBuilder = new VerbBuilder(auxVerb);
    tenses.push(createForms(
        "presentContinuous",
        NOMINATIVE_PRONOUN,
        (person, number) => verbBuilder.presentContinuousForm(person, number, sentenceType, auxBuilder),
    ));
    tenses.push(createForms(
        "pastTense",
        NOMINATIVE_PRONOUN,
        (person, number) => verbBuilder.pastForm(person, number, sentenceType),
    ));
    tenses.push(createForms(
        "possibleFuture",
        NOMINATIVE_PRONOUN,
        (person, number) => verbBuilder.possibleFutureForm(person, number, sentenceType),
    ));
    tenses.push(createForms(
        "intentionFuture",
        NOMINATIVE_PRONOUN,
        (person, number) => verbBuilder.intentionFutureForm(person, number, sentenceType),
    ));
    const shak = "PresentTransitive";
    tenses.push(createForms(
        "wantClause",
        POSSESSIVE_PRONOUN,
        (person, number) => verbBuilder.wantClause(person, number, sentenceType, shak),
    ));
    tenses.push(createForms(
        "canClause",
        NOMINATIVE_PRONOUN,
        (person, number) => verbBuilder.canClause(person, number, sentenceType, shak),
    ));
    return tenses;
}