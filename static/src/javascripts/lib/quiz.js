import {
    GRAMMAR_PERSONS,
    GRAMMAR_NUMBERS,
    PRONOUN_BY_PERSON_NUMBER,
    VerbBuilder
} from './aspan';

class QuizItem {
    constructor(hint, textHint, expected) {
        this.hint = hint;
        this.textHint = textHint;
        this.expected = expected;
    }
}

const PRESET_VERBS = [
    "бару",
    "оқу",
    "жүзу",
    "алу",
    "ренжу",
    "жасау",
    "зерттеу",
    "қуыру",
    "ойнау",
    "отыру",
    "тігу",
    "үйрену",
    "көмектесу",
    "демалу",
    "еріну",
    "жазу",
]

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

export function getVerb(hint) {
    if (hint.length > 0) {
        return hint;
    }
    return PRESET_VERBS[getRandomInt(PRESET_VERBS.length)];
}

export function createVerbPresentTransitiveQuiz(verb) {
    var result = [];
    const verbBuilder = new VerbBuilder(verb);
    for (const person of GRAMMAR_PERSONS) {
        for (const number of GRAMMAR_NUMBERS) {
            const hint = "Present transitive form of " + verb + " for " + person + " person, " + number;
            const pronoun = PRONOUN_BY_PERSON_NUMBER[person][number];
            const textHint = pronoun + " __";
            const expected = pronoun + " " + verbBuilder.presentTransitiveForm(person, number, "Statement");
            result.push(new QuizItem(hint, textHint, expected));
        }
    }
    return result;
}

export function checkCustomVerb(verb) {
    return verb.endsWith("у") || verb.endsWith("ю");
}

export class QuizState {
    constructor(total, position, correct) {
        this.total = total;
        this.position = position;
        this.correct = correct;
    }

    advance(correct) {
        if (this.position >= this.total) {
            console.log("Unable to advance past final quiz state");
            return this;
        }
        return new QuizState(this.total, this.position + 1, this.correct + correct);
    }
}