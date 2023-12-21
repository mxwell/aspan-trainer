import {
    GRAMMAR_PERSONS,
    GRAMMAR_NUMBERS,
    validateVerb,
    isVerbOptionalException,
    validPresentContPair,
    VerbBuilder
} from './aspan';
import { i18n } from './i18n';
import {
    NOMINATIVE_PRONOUN,
    POSSESSIVE_PRONOUN,
    getPronounByParams,
    getSentenceTerminator
} from './grammar_utils';

export function composeAnswer(pronoun, verbPhrase) {
    return `${pronoun} ${verbPhrase}`;
}

class QuizItem {
    constructor(hint, textHint, expectedPronoun, expectedVerbPhrase) {
        this.hint = hint;
        this.textHint = textHint;
        this.expectedPronoun = expectedPronoun;
        this.expectedVerbPhrase = expectedVerbPhrase;
        this.expected = composeAnswer(expectedPronoun, expectedVerbPhrase);
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

export function shuffleArray(array) {
    const n = array.length;
    if (n <= 0) {
        return array;
    }
    for (var i = n - 1; i > 0; --i) {
        var j = getRandomInt(i);
        const temp = array[j];
        array[j] = array[i];
        array[i] = temp;
    }
    return array;
}

export function collectAnswerOptions(quizItems) {
    const optionSet = new Set();
    for (const quizItem of quizItems) {
        optionSet.add(quizItem.expectedVerbPhrase);
    }
    const optionArray = [];
    for (const option of optionSet) {
        optionArray.push(option);
    }
    return optionArray;
}

const HINT_PERSON_KEYS = new Map([
    ["First", "quizForFirstPerson"],
    ["Second", "quizForSecondPerson"],
    ["SecondPolite", "quizForSecondPolitePerson"],
    ["Third", "quizForThirdPerson"],
]);

const HINT_NUMBER_KEYS = new Map([
    ["Singular", "quizForSingularNumber"],
    ["Plural", "quizForPluralNumber"],
]);

export class VerbQuizBuilder {
    constructor(lang, topic, verb, forceExceptional, sentenceType) {
        this.lang = lang;
        this.topic = topic;
        this.verb = verb;
        this.verbBuilder = new VerbBuilder(verb, forceExceptional);
        this.sentenceType = sentenceType;
        this.sentenceTypeI18nLower = this.i18n(this.sentenceType.toLowerCase());
    }

    i18n(key) {
        return i18n(key, this.lang);
    }

    makeHint(person, number) {
        const personText = this.i18n(HINT_PERSON_KEYS.get(person));
        const numberText = this.i18n(HINT_NUMBER_KEYS.get(number));
        return `${this.i18n(this.topic)}, ${this.sentenceTypeI18nLower} ${this.i18n("quizSentenceOfVerb")} ${this.verb} ${personText} ${numberText}`;
    }

    /**
     * The function:
     * - returns a list of QuizItem
     * - requires "caseFn" to return expected verb phrase (no pronoun, but with question mark if needed)
     **/
    buildForAllPersonsAndNumbers(pronounType, caseFn) {
        let result = [];
        for (const person of GRAMMAR_PERSONS) {
            for (const number of GRAMMAR_NUMBERS) {
                const hint = this.makeHint(person, number);
                const expectedVerbPhrase = caseFn(this, person, number).raw;
                const pronoun = getPronounByParams(pronounType, person, number).toLowerCase();
                const terminator = getSentenceTerminator(this.sentenceType);
                const textHint = `${pronoun} ____${terminator}`;
                result.push(new QuizItem(hint, textHint, pronoun, expectedVerbPhrase));
            }
        }
        return result;
    }

    buildPresentTransitive() {
        return this.buildForAllPersonsAndNumbers(
            NOMINATIVE_PRONOUN,
            (self, person, number) => self.verbBuilder.presentTransitiveForm(person, number, self.sentenceType)
        );
    }

    buildPresentContinuous(auxVerb) {
        if (auxVerb == null || auxVerb == "") {
            auxVerb = "жату";
        }
        let auxBuilder = new VerbBuilder(auxVerb);
        if (auxBuilder.cont_context == null) {
            return null;
        }
        return this.buildForAllPersonsAndNumbers(
            NOMINATIVE_PRONOUN,
            (self, person, number) => self.verbBuilder.presentContinuousForm(person, number, self.sentenceType, auxBuilder)
        );
    }

    buildPast() {
        return this.buildForAllPersonsAndNumbers(
            NOMINATIVE_PRONOUN,
            (self, person, number) => self.verbBuilder.pastForm(person, number, self.sentenceType)
        );
    }

    buildOptativeMood() {
        // TODO make it a param
        const shak = "PresentTransitive";

        return this.buildForAllPersonsAndNumbers(
            POSSESSIVE_PRONOUN,
            (self, person, number) => self.verbBuilder.wantClause(person, number, self.sentenceType, shak)
        );
    }

    buildCanClause() {
        // TODO make it a param
        const shak = "PresentTransitive";

        return this.buildForAllPersonsAndNumbers(
            NOMINATIVE_PRONOUN,
            (self, person, number) => self.verbBuilder.canClause(person, number, self.sentenceType, shak)
        );
    }

    build(auxVerb) {
        if (this.topic == "presentTransitive") {
            return this.buildPresentTransitive();
        } else if (this.topic == "presentContinuous") {
            return this.buildPresentContinuous(auxVerb);
        } else if (this.topic == "pastTense") {
            return this.buildPast();
        } else if (this.topic == "optativeMood") {
            return this.buildOptativeMood();
        } else if (this.topic == "canClause") {
            return this.buildCanClause();
        } else {
            console.log(`Unsupported topic: ${this.topic}`)
            return [];
        }
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
    constructor(total, position, correct, options) {
        this.total = total;
        this.position = position;
        this.correct = correct;
        this.options = shuffleArray(options);
    }

    advance(correct) {
        if (this.done()) {
            console.log("Unable to advance past final quiz state");
            return this;
        }
        return new QuizState(this.total, this.position + 1, this.correct + correct, this.options);
    }

    done() {
        return this.position >= this.total;
    }
}

const DONE_QUIZES_KEY = "KAZGRAM_DONE_QUIZES";

export function storeDoneQuizes(count) {
    if (count < 1) {
        console.log(`Trying to store invalid value to localStorage at key ${DONE_QUIZES_KEY}: ${count}, ignoring it`);
        return false;
    }
    console.log(`Store done quizes: ${count}`);
    window.localStorage.setItem(DONE_QUIZES_KEY, count.toString());
    return true;
}

export function retrieveDoneQuizes() {
    const localStorage = window.localStorage;
    var str = localStorage.getItem(DONE_QUIZES_KEY);
    if (isNaN(str) || isNaN(parseInt(str))) {
        console.log(`Invalid value retrieved from localStorage at key ${DONE_QUIZES_KEY}: ${str}, clearing it`);
        localStorage.removeItem(DONE_QUIZES_KEY);
        str = "0";
    }
    return parseInt(str);
}