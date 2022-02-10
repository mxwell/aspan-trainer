import {
    GRAMMAR_PERSONS,
    GRAMMAR_NUMBERS,
    PRONOUN_BY_PERSON_NUMBER,
    validateVerb,
    isVerbOptionalException,
    validPresentContPair,
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
];

const PRESET_PRESENT_CONTINUOUS_VERBS = [
    ["алу", "ішу", "салу", "беру", "жазу", "ояну"],
    ["жасау", "жеу", "ұйықтау", "зерттеу"],
    ["бару", "апару"],
    ["келу", "әкелу"],
    ["жабу", "кебу", "себу", "тебу", "табу", "шабу"],
];

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function pickRandom(items) {
    return items[getRandomInt(items.length)];
}

export function getVerb(hint) {
    if (hint.length > 0) {
        return hint;
    }
    return pickRandom(PRESET_VERBS);
}

export function getPresentContinuousVerb() {
    let row = pickRandom(PRESET_PRESENT_CONTINUOUS_VERBS);
    let verb = pickRandom(row);
    return verb;
}

function getSentenceTerminator(sentenceType) {
    if (sentenceType == "Question") {
        return "?";
    }
    return "";
}

export class VerbQuizBuilder {
    constructor(verb, forceExceptional, sentenceType) {
        this.verb = verb;
        this.verbBuilder = new VerbBuilder(verb, forceExceptional);
        this.sentenceType = sentenceType;
    }

    buildForAllPersonsAndNumbers(caseFn) {
        let result = [];
        for (const person of GRAMMAR_PERSONS) {
            for (const number of GRAMMAR_NUMBERS) {
                result.push(caseFn(this, person, number));
            }
        }
        return result;
    }

    makeHint(tenseName, person, number) {
        return `${tenseName} ${this.sentenceType} form of ${this.verb} for ${person} person, ${number}`;
    }

    buildPresentTransitive() {
        return this.buildForAllPersonsAndNumbers((self, person, number) => {
            const hint = self.makeHint("Present transitive", person, number);
            const pronoun = PRONOUN_BY_PERSON_NUMBER[person][number];
            const textHint = pronoun + " _____" + getSentenceTerminator(self.sentenceType);
            const expected = pronoun + " " + self.verbBuilder.presentTransitiveForm(person, number, self.sentenceType);
            return new QuizItem(hint, textHint, expected);
        })
    }

    buildPresentContinuous(auxVerb) {
        if (auxVerb == null || auxVerb == "") {
            auxVerb = "жату";
        }
        let auxBuilder = new VerbBuilder(auxVerb);
        if (auxBuilder.cont_context == null) {
            return null;
        }
        return this.buildForAllPersonsAndNumbers((self, person, number) => {
            const hint = self.makeHint("Present continuous", person, number);
            const pronoun = PRONOUN_BY_PERSON_NUMBER[person][number];
            const textHint = pronoun + " _____" + getSentenceTerminator(self.sentenceType);
            const expected = pronoun + " " + self.verbBuilder.presentContinuousForm(person, number, self.sentenceType, auxBuilder);
            return new QuizItem(hint, textHint, expected);
        });
    }
}

export function checkCustomVerb(verb) {
    return validateVerb(verb);
}

export function checkOptionalExceptionVerb(verb) {
    return isVerbOptionalException(verb);
}

export function checkPresentContPair(verb, auxVerb) {
    return validPresentContPair(verb, auxVerb);
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