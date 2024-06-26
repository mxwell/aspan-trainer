import {
    GRAMMAR_PERSONS,
    GRAMMAR_NUMBERS,
    VerbBuilder,
    getOptExceptVerbMeanings,
    NounBuilder,
} from './aspan';
import { AUX_VERBS } from './aux_verbs';
import {
    NOMINATIVE_PRONOUN,
    POSSESSIVE_PRONOUN,
    getPronounByParams,
} from './grammar_utils';
import { getRandomInt, pickRandom } from './random';

export const PARTICIPLE_PAST = "pastParticiple";
export const PARTICIPLE_PRESENT = "presentParticiple";
export const PARTICIPLE_FUTURE = "futureParticiple";

class VerbForm {
    constructor(pronoun, formKey, verbPhrase, declinable) {
        this.pronoun = pronoun;
        this.formKey = formKey;
        this.verbPhrase = verbPhrase;
        this.declinable = declinable;
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
            forms.push(new VerbForm(pronoun, null, verbPhrase, false));
        }
    }
    return new TenseForms(tenseNameKey, groupNameKey, forms);
}

export function generateParticipleForms(verb, forceExceptional, sentenceType) {
    let verbBuilder = new VerbBuilder(verb, forceExceptional);

    let forms = [];
    const declinable = (sentenceType == "Statement" || sentenceType == "Negative");
    forms.push(new VerbForm(null, PARTICIPLE_PAST, verbBuilder.pastParticiple(sentenceType), declinable))
    forms.push(new VerbForm(null, PARTICIPLE_PRESENT, verbBuilder.presentParticiple(sentenceType), declinable));
    forms.push(new VerbForm(null, PARTICIPLE_FUTURE, verbBuilder.futureParticiple(sentenceType), declinable));
    return new TenseForms("participle", "participle", forms);
}

export function generatePromoVerbForms(verb, forceExceptional) {
    let forms = [];
    const number = "Singular";
    const sentenceType = "Statement";
    for (const person of GRAMMAR_PERSONS) {
        const verbBuilder = new VerbBuilder(verb, forceExceptional);
        const phrasal = verbBuilder.presentTransitiveForm(person, number, sentenceType);
        const pronoun = getPronounByParams(NOMINATIVE_PRONOUN, person, number);
        forms.push(new VerbForm(pronoun, null, phrasal, false));
    }
    return new TenseForms("presentTransitive", "present", forms);
}

export function generateVerbForms(verb, auxVerb, auxNeg, forceExceptional, sentenceType) {
    let tenses = [];
    let verbBuilder = new VerbBuilder(verb, forceExceptional);
    tenses.push(createForms(
        "presentTransitive",
        "present",
        NOMINATIVE_PRONOUN,
        (person, number) => verbBuilder.presentTransitiveForm(person, number, sentenceType),
    ));
    if (auxVerb == null || auxVerb == "") {
        auxVerb = AUX_VERBS[0];
    }
    let auxBuilder = new VerbBuilder(auxVerb);
    tenses.push(createForms(
        "presentContinuous",
        "present",
        NOMINATIVE_PRONOUN,
        (person, number) => verbBuilder.presentContinuousForm(person, number, sentenceType, auxBuilder, auxNeg),
    ));
    tenses.push(createForms(
        "presentColloquial",
        "present",
        NOMINATIVE_PRONOUN,
        (person, number) => verbBuilder.presentColloquialForm(person, number, sentenceType),
    ));
    tenses.push(createForms(
        "past",
        "past",
        NOMINATIVE_PRONOUN,
        (person, number) => verbBuilder.pastForm(person, number, sentenceType),
    ));
    tenses.push(createForms(
        "remotePast",
        "past",
        NOMINATIVE_PRONOUN,
        (person, number) => verbBuilder.remotePastTense(person, number, sentenceType, auxNeg),
    ));
    tenses.push(createForms(
        "pastUncertain",
        "past",
        NOMINATIVE_PRONOUN,
        (person, number) => verbBuilder.pastUncertainTense(person, number, sentenceType),
    ));
    tenses.push(createForms(
        "pastTransitive",
        "past",
        NOMINATIVE_PRONOUN,
        (person, number) => verbBuilder.pastTransitiveTense(person, number, sentenceType),
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
    tenses.push(generateParticipleForms(verb, forceExceptional, sentenceType));
    return tenses;
}

const CASE_KEYS = [
    "presentTransitive",
    "presentContinuous",
    "past",
    "remotePast",
    "pastUncertain",
    "pastTransitive",
    "possibleFuture",
    "intentionFuture",
    "conditionalMood",
    "imperativeMood",
    "optativeMood",
];

function createFormById(verbBuider, person, number, sentenceType, id) {
    switch (id) {
        case 0:
            return verbBuider.presentTransitiveForm(person, number, sentenceType);
        case 1:
            return verbBuider.presentContinuousForm(person, number, sentenceType, new VerbBuilder("жату"));
        case 2:
            return verbBuider.pastForm(person, number, sentenceType);
        case 3:
            return verbBuider.remotePastTense(person, number, sentenceType);
        case 4:
            return verbBuider.pastUncertainTense(person, number, sentenceType);
        case 5:
            return verbBuider.pastTransitiveTense(person, number, sentenceType);
        case 6:
            return verbBuider.possibleFutureForm(person, number, sentenceType);
        case 7:
            return verbBuider.intentionFutureForm(person, number, sentenceType);
        case 8:
            return verbBuider.conditionalMood(person, number, sentenceType);
        case 9:
            return verbBuider.imperativeMood(person, number, sentenceType);
        case 10:
            return verbBuider.wantClause(person, number, sentenceType);
        default:
            return null;
    }
}

class SideQuizTask {
    constructor(subject, caseKeys, correct) {
        this.subject = subject;
        this.caseKeys = caseKeys;
        this.correct = correct;
        this.rawSubject = subject.raw;
        this.completedSubject = null;
    }
}

export function createSideQuizTask(verb, forceExceptional, sentenceType) {
    let caseIds = [];
    let caseKeys = [];
    let attempts = 0;
    while (caseIds.length < 4) {
        while (true) {
            let id = getRandomInt(CASE_KEYS.length);
            ++attempts;
            if (caseIds.indexOf(id) >= 0) {
                if (attempts > 100) {
                    return null;
                }
                continue;
            }
            caseIds.push(id);
            caseKeys.push(CASE_KEYS[id]);
            break;
        }
    }
    let verbBuilder = new VerbBuilder(verb, forceExceptional);
    let person = pickRandom(GRAMMAR_PERSONS);
    let number = pickRandom(GRAMMAR_NUMBERS);
    let correct = getRandomInt(caseIds.length);
    let phrasal = createFormById(verbBuilder, person, number, sentenceType, caseIds[correct]);
    return new SideQuizTask(
        phrasal,
        caseKeys,
        correct
    );
}

export function getOptionalExceptionalVerbMeanings(verb) {
    return getOptExceptVerbMeanings(verb);
}

export function createFormByParams(verb, forceExceptional, sentenceType, tense, personNumber) {
    const meanings = getOptionalExceptionalVerbMeanings(verb);
    if (meanings == null && forceExceptional) {
        console.log(`Unnecessary forceExceptional flag for the selected verb: ${verb}`);
        return null;
    }
    if (tense != "presentTransitive") {
        console.log(`tense is not supported: ${tense}`);
        return null;
    }
    const tenseId = CASE_KEYS.indexOf(tense);
    if (tenseId < 0) {
        console.log(`Unknown tense: ${tense}`);
        return null;
    }
    if (GRAMMAR_PERSONS.indexOf(personNumber.person) < 0) {
        console.log(`Unsupported grammar person: ${personNumber.person}`);
        return null;
    }
    if (GRAMMAR_NUMBERS.indexOf(personNumber.number) < 0) {
        console.log(`Unsupported grammar number: ${personNumber.number}`);
        return null;
    }
    let verbBuilder = new VerbBuilder(verb, forceExceptional);
    let phrasal = createFormById(
        verbBuilder,
        personNumber.person,
        personNumber.number,
        sentenceType,
        tenseId,
    );
    return phrasal;
}

class ParticipleBuilder {
    constructor(form, nounBuilder) {
        this.form = form;
        this.nounBuilder = nounBuilder;
    }
}

export function getParticipleBuilder(verb, participle, sentenceType) {
    let verbBuilder = new VerbBuilder(verb);
    const soft = verbBuilder.soft;
    if (participle == PARTICIPLE_PAST) {
        const builder = verbBuilder.pastParticipleBuilder(sentenceType);
        const form = builder.build();
        return new ParticipleBuilder(form, new NounBuilder(builder, soft));
    } else if (participle == PARTICIPLE_PRESENT) {
        const builder = verbBuilder.presentParticipleBuilder(sentenceType);
        const form = builder.build();
        return new ParticipleBuilder(form, new NounBuilder(builder, soft));
    } else if (participle == PARTICIPLE_FUTURE) {
        const builder = verbBuilder.futureParticipleBuilder(sentenceType);
        const form = builder.build();
        return new ParticipleBuilder(form, new NounBuilder(builder, soft));
    }
    return null;
}