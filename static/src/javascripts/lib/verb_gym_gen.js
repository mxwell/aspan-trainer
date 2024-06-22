import { VerbBuilder } from "./aspan";
import { GymTask, Statement, makeKeyPart, makePlainPart } from "./gym_level";
import { getRandomInt, pickRandom, shuffleArray } from "./random";

// 6 + 2 + 2
const SENTENCE_TYPE_LIST = [
    "Statement",
    "Statement",
    "Statement",
    "Statement",
    "Statement",
    "Statement",
    "Negative",
    "Negative",
    "Question",
    "Question",
];
const LEVEL_SAMPLES = SENTENCE_TYPE_LIST.length;

const REGULAR_WEIGHT_INDEX = 0;
const NEGATIVE_WEIGHT_INDEX = 1;
const CONTINUOUS_WEIGHT_INDEX = 2;

class WeightedSample {
    constructor(infinitive, forceExceptional, weight, negativeWeight, contWeight) {
        this.infinitive = infinitive;
        this.forceExceptional = forceExceptional;
        this.weights = [weight, negativeWeight, contWeight];
    }
}

function regularSample(infinitive) {
    return new WeightedSample(infinitive, false, 1, 1, 1);
}

function forcedException(infinitive) {
    return new WeightedSample(infinitive, true, 1, 1, 1);
}

function negativeSample(infinitive) {
    return new WeightedSample(infinitive, false, 1, 10, 1);
}

function contSample(infinitive) {
    return new WeightedSample(infinitive, false, 1, 1, 10);
}

// Add companion words to the verb
const VERB_POOL = [
    contSample("құю"),        /* additional й */
    contSample("сүю"),
    contSample("шаю"),
    regularSample("оқу"),     /* additional ы */
    regularSample("ренжу"),
    regularSample("тану"),
    forcedException("тану"),
    regularSample("есту"),    /* additional і */
    regularSample("ренжу"),
    regularSample("сүңгу"),
    negativeSample("кешiгу"), /* base ends with гғб: matters for negative */
    negativeSample("шығу"),
    new WeightedSample("жабу", false, 1, 10, 10),  /* base ends with б and special cases for present continuous */
    new WeightedSample("табу", false, 1, 10, 10),
    new WeightedSample("тебу", false, 1, 10, 10),
    new WeightedSample("қабу", false, 1, 10, 10),
    new WeightedSample("қабу", true, 1, 10, 1),
    contSample("бару"),       /* special cases for present continuous */
    contSample("келу"),
    contSample("апару"),
    contSample("әкелу"),
];

const PRESENT_VERB_POOL = [
    regularSample("жату"),
    regularSample("отыру"),
    regularSample("тұру"),
    regularSample("жүру"),
];

/*
 * Pick random from the first 5 for Statement and Negative,
 * and from all 8 for Question.
 **/
const CASE_LIST = [
    ["First", "Singular", "Мен"],
    ["First", "Plural", "Біз"],
    ["Second", "Singular", "Сен"],
    ["SecondPolite", "Singular", "Сіз"],
    ["Third", "Singular", "Ол"],
    ["Third", "Singular", "Ол"],
    ["Third", "Singular", "Ол"],
    ["Third", "Singular", "Ол"],
];

function reservoirSampling(k, wIndex) {
    const n = VERB_POOL.length;
    let wSum = 0;
    let result = [];
    for (let i = 0; i < k; ++i) {
        result.push(VERB_POOL[i]);
        wSum += VERB_POOL[i].weights[wIndex];
    }
    for (let i = k; i < n; ++i) {
        const curWeight = VERB_POOL[i].weights[wIndex];
        wSum += curWeight;
        const p = curWeight / wSum;
        const j = Math.random();
        if (j < p) {
            const pos = getRandomInt(k);
            result[pos] = VERB_POOL[i];
        }
    }
    return result;
}

function pickCaseIndex(sentType) {
    if (sentType == "Question") {
        return getRandomInt(CASE_LIST.length);
    } else {
        return getRandomInt(5);
    }
}

function extractForm(phrasal) {
    const raw = phrasal.raw;
    // remove ? at the end if present
    return raw.endsWith("?") ? raw.slice(0, -1) : raw;
}

function generatePresentTransitiveTasks() {
    let verbs = reservoirSampling(LEVEL_SAMPLES, REGULAR_WEIGHT_INDEX);
    shuffleArray(verbs);

    let result = [];
    for (let i = 0; i < SENTENCE_TYPE_LIST.length; ++i) {
        const sentType = SENTENCE_TYPE_LIST[i];
        const caseIndex = pickCaseIndex(sentType);
        const [person, number, pronoun] = CASE_LIST[caseIndex];
        const verbInfo = verbs[i];
        const builder = new VerbBuilder(
            verbInfo.infinitive,
            verbInfo.forceExceptional,
        );
        const phrasal = builder.presentTransitiveForm(person, number, sentType);
        const form = extractForm(phrasal);
        let parts = [
            makePlainPart(`${pronoun} `),
            makeKeyPart(verbInfo.infinitive),
        ];
        if (sentType == "Question") {
            parts.push(makePlainPart("?"));
        }
        const metaParts = {
            SentenceType: sentType,
            forceExceptional: verbInfo.forceExceptional,
        };
        const taskStmt = new Statement(parts, metaParts);
        result.push(new GymTask(taskStmt, [form]));
    }
    return result;
}

function generatePresentSimpleTasks() {
    let result = [];
    for (let i = 0; i < SENTENCE_TYPE_LIST.length; ++i) {
        const sentType = SENTENCE_TYPE_LIST[i];
        const caseIndex = getRandomInt(5);
        const [person, number, pronoun] = CASE_LIST[caseIndex];
        const verbInfo = pickRandom(PRESENT_VERB_POOL);
        const builder = new VerbBuilder(
            verbInfo.infinitive,
            verbInfo.forceExceptional,
        );
        const phrasal = builder.presentSimpleContinuousForm(person, number, sentType);
        const form = extractForm(phrasal);
        let parts = [
            makePlainPart(`${pronoun} `),
            makeKeyPart(verbInfo.infinitive),
        ];
        if (sentType == "Question") {
            parts.push(makePlainPart("?"));
        }
        const metaParts = {
            SentenceType: sentType,
            forceExceptional: verbInfo.forceExceptional,
        };
        const taskStmt = new Statement(parts, metaParts);
        result.push(new GymTask(taskStmt, [form]));
    }
    return result;
}

function generateTasksByLevelKey(levelKey) {
    if (levelKey == "presentTransitive") {
        return generatePresentTransitiveTasks();
    } else if (levelKey == "presentSimple") {
        return generatePresentSimpleTasks();
    } else {
        console.log(`generateTasksByLevelKey: unsupported levelKey: ${levelKey}`);
        return null;
    }
}

export {
    generateTasksByLevelKey,
};