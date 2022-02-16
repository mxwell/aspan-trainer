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

class QuizItem {
    constructor(hint, textHint, expected) {
        this.hint = hint;
        this.textHint = textHint;
        this.expected = expected;
    }
}

class FormDetails {
    constructor(formName, expectedVerbPhrase) {
        this.formName = formName;
        this.expectedVerbPhrase = expectedVerbPhrase;
    }
}

const PRESET_VERBS2 = [
    /* common */
    ["бару", "келу", "алу", "беру", "жазу"],
    /* end with vowel */
    ["жасау", "зерттеу", "ойнау", "билеу", "жаю"],
    /* end with бвгғд */
    ["тігу", "тебу", "шабу"],
    /* exceptions */
    ["абыржу", "аршу", "қобалжу", "оқу"],
    /* exceptions of different kind */
    ["жаю", "қою", "сүю"],
    /* end with руйл */
    ["қуыру", "демалу", "жуу", "пісіру"],
    /* end with unvoiced consonant */
    ["көмектесу", "айту", "кесу", "көшу"],
    /* end with мнң */
    ["еріну", "үйрену", "қуану"],
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
    let row = pickRandom(PRESET_VERBS2);
    let verb = pickRandom(row);
    return verb;
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

    buildNominativePronounPhrases(caseFn) {
        return this.buildForAllPersonsAndNumbers(function(self, person, number) {
            const details = caseFn(self, person, number);
            const hint = self.makeHint(details.formName, person, number);
            const pronoun = PRONOUN_BY_PERSON_NUMBER[person][number];
            const terminator = getSentenceTerminator(self.sentenceType);
            const textHint = `${pronoun} ____${terminator}`;
            const expected = `${pronoun} ${details.expectedVerbPhrase}`;
            return new QuizItem(hint, textHint, expected);
        });
    }

    buildPresentTransitive() {
        return this.buildNominativePronounPhrases(function(self, person, number) {
            return new FormDetails(
                "Present transitive",
                self.verbBuilder.presentTransitiveForm(person, number, self.sentenceType)
            );
        });
    }

    buildPresentContinuous(auxVerb) {
        if (auxVerb == null || auxVerb == "") {
            auxVerb = "жату";
        }
        let auxBuilder = new VerbBuilder(auxVerb);
        if (auxBuilder.cont_context == null) {
            return null;
        }
        return this.buildNominativePronounPhrases(function(self, person, number) {
            return new FormDetails(
                "Present continuous",
                self.verbBuilder.presentContinuousForm(person, number, self.sentenceType, auxBuilder)
            );
        });
    }

    buildPast() {
        return this.buildNominativePronounPhrases(function(self, person, number) {
            return new FormDetails(
                "Past",
                self.verbBuilder.pastForm(person, number, self.sentenceType)
            );
        });
    }

    buildWantClause() {
        // TODO make it a param
        const shak = "PresentTransitive";

        return this.buildForAllPersonsAndNumbers(function(self, person, number) {
            const hint = self.makeHint("Want clause", person, number);
            const pronoun = POSSESSIVE_BY_PERSON_NUMBER[person][number];
            const terminator = getSentenceTerminator(self.sentenceType);
            const textHint = `${pronoun} ____${terminator}`;
            const expectedPhrase = self.verbBuilder.wantClause(person, number, self.sentenceType, shak);
            const expected = `${pronoun} ${expectedPhrase}`;
            return new QuizItem(hint, textHint, expected);
        });
    }

    buildCanClause() {
        // TODO make it a param
        const shak = "PresentTransitive";

        return this.buildNominativePronounPhrases(function(self, person, number) {
            return new FormDetails(
                "Can clause",
                self.verbBuilder.canClause(person, number, self.sentenceType, shak)
            );
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