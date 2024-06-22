import { VerbBuilder } from "./aspan";
import { GymTask, Statement, makeKeyPart, makePlainPart } from "./gym_level";
import { getRandomBool, getRandomInt, pickRandom, shuffleArray } from "./random";

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
const POSS_FUT_WEIGHT_INDEX = 3;

class WeightedSample {
    constructor(infinitive, forceExceptional, weight, negativeWeight, contWeight, possFutWeight) {
        this.infinitive = infinitive;
        this.forceExceptional = forceExceptional;
        this.weights = [weight, negativeWeight, contWeight, possFutWeight];
    }

    builder() {
        return new VerbBuilder(this.infinitive, this.forceExceptional);
    }
}

function regularSample(infinitive) {
    return new WeightedSample(infinitive, false, 1, 1, 1, 1);
}

function forcedException(infinitive) {
    return new WeightedSample(infinitive, true, 1, 1, 1, 1);
}

function negativeSample(infinitive) {
    return new WeightedSample(infinitive, false, 1, 10, 1, 1);
}

function contSample(infinitive, weight) {
    return new WeightedSample(infinitive, false, 1, 1, weight, 1);
}

function possFutSample(infinitive) {
    return new WeightedSample(infinitive, false, 1, 1, 1, 30);
}

// Add companion words to the verb
const VERB_POOL = [
    contSample("құю", 10),    /* additional й */
    contSample("сүю", 10),
    contSample("шаю", 10),
    regularSample("оқу"),     /* additional ы */
    regularSample("тану"),
    forcedException("тану"),
    regularSample("есту"),    /* additional і */
    regularSample("ренжу"),
    regularSample("сүңгу"),
    negativeSample("кешігу"), /* base ends with гғб: matters for negative */
    negativeSample("шығу"),
    new WeightedSample("жабу", false, 1, 10, 10, 1),  /* base ends with б and special cases for present continuous */
    new WeightedSample("табу", false, 1, 10, 10, 1),
    new WeightedSample("тебу", false, 1, 10, 10, 1),
    new WeightedSample("қабу", false, 1, 10, 10, 1),
    new WeightedSample("қабу", true, 1, 10, 1, 1),
    contSample("бару", 30),   /* special cases for present continuous */
    contSample("келу", 30),
    contSample("апару", 30),
    contSample("әкелу", 30),
    regularSample("ішу"),     /* ends with unvoiced consonant */
    regularSample("айту"),
    regularSample("тырысу"),
    possFutSample("қыдыру"),  /* ends with р */
    possFutSample("кіру"),
    possFutSample("көру"),
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
        // console.log(`verb: ${VERB_POOL[i].infinitive}, curWeight: ${curWeight}, wSum: ${wSum}, p: ${p}, j: ${j}`);
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

function commonGenerator(weightIndex, specQuestionSample, phrasalCallback) {
    let verbs = reservoirSampling(LEVEL_SAMPLES, weightIndex);
    shuffleArray(verbs);

    let result = [];
    for (let i = 0; i < SENTENCE_TYPE_LIST.length; ++i) {
        const sentType = SENTENCE_TYPE_LIST[i];
        const caseIndex = (
            specQuestionSample
            ? pickCaseIndex(sentType)
            : getRandomInt(5)
        );
        const [person, number, pronoun] = CASE_LIST[caseIndex];
        const verbInfo = verbs[i];
        const builder = verbInfo.builder();
        const phrasal = phrasalCallback(builder, person, number, sentType);
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

function generatePresentTransitiveTasks() {
    return commonGenerator(
        REGULAR_WEIGHT_INDEX,
        true,
        (builder, person, number, sentType) => builder.presentTransitiveForm(person, number, sentType)
    );
}

function generatePresentSimpleTasks() {
    let result = [];
    for (let i = 0; i < SENTENCE_TYPE_LIST.length; ++i) {
        const sentType = SENTENCE_TYPE_LIST[i];
        const caseIndex = getRandomInt(5);
        const [person, number, pronoun] = CASE_LIST[caseIndex];
        const verbInfo = pickRandom(PRESENT_VERB_POOL);
        const builder = verbInfo.builder();
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

function generatePresentContinuousTasks() {
    let verbs = reservoirSampling(LEVEL_SAMPLES, CONTINUOUS_WEIGHT_INDEX);
    shuffleArray(verbs);

    const onlyJatu = ["бару", "келу", "апару", "әкелу"];

    let result = [];
    for (let i = 0; i < SENTENCE_TYPE_LIST.length; ++i) {
        const sentType = SENTENCE_TYPE_LIST[i];
        const caseIndex = getRandomInt(5);
        const [person, number, pronoun] = CASE_LIST[caseIndex];
        const verbInfo = verbs[i];

        const auxVerbInfo = (
            onlyJatu.includes(verbInfo.infinitive)
            ? PRESENT_VERB_POOL[0]
            : pickRandom(PRESENT_VERB_POOL)
        );
        const auxBuilder = auxVerbInfo.builder();
        const negateAux = getRandomBool();
        const builder = verbInfo.builder();
        const phrasal = builder.presentContinuousForm(person, number, sentType, auxBuilder, negateAux);
        const form = extractForm(phrasal);
        let parts = [
            makePlainPart(`${pronoun} `),
            makeKeyPart(`${verbInfo.infinitive} + ${auxVerbInfo.infinitive}`),
        ];
        if (sentType == "Question") {
            parts.push(makePlainPart("?"));
        }
        const metaParts = {
            SentenceType: sentType,
            forceExceptional: verbInfo.forceExceptional,
            negateAux: negateAux,
        };
        const taskStmt = new Statement(parts, metaParts);
        result.push(new GymTask(taskStmt, [form]));
    }
    return result;
}

function generatePresentColloquialTasks() {
    return commonGenerator(
        CONTINUOUS_WEIGHT_INDEX,
        false,
        (builder, person, number, sentType) => builder.presentColloquialForm(person, number, sentType),
    );
}

function generatePastTasks() {
    return commonGenerator(
        REGULAR_WEIGHT_INDEX,
        false,
        (builder, person, number, sentType) => builder.pastForm(person, number, sentType),
    );
}

function generateRemotePastTasks() {
    let verbs = reservoirSampling(LEVEL_SAMPLES, REGULAR_WEIGHT_INDEX);
    shuffleArray(verbs);

    let result = [];
    for (let i = 0; i < SENTENCE_TYPE_LIST.length; ++i) {
        const sentType = SENTENCE_TYPE_LIST[i];
        const caseIndex = getRandomInt(5);
        const [person, number, pronoun] = CASE_LIST[caseIndex];
        const verbInfo = verbs[i];

        const negateAux = getRandomBool();
        const builder = verbInfo.builder();
        const phrasal = builder.remotePastTense(person, number, sentType, negateAux);
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
            negateAux: negateAux,
        };
        const taskStmt = new Statement(parts, metaParts);
        result.push(new GymTask(taskStmt, [form]));
    }
    return result;
}

function generatePastUncertainTasks() {
    return commonGenerator(
        REGULAR_WEIGHT_INDEX,
        false,
        (builder, person, number, sentType) => builder.pastUncertainTense(person, number, sentType),
    );
}

function generatePastTransitiveTasks() {
    return commonGenerator(
        REGULAR_WEIGHT_INDEX,
        false,
        (builder, person, number, sentType) => builder.pastTransitiveTense(person, number, sentType),
    );
}

function generateIntentionFutureTasks() {
    return commonGenerator(
        REGULAR_WEIGHT_INDEX,
        false,
        (builder, person, number, sentType) => builder.intentionFutureForm(person, number, sentType),
    );
}

function generatePossibleFutureTasks() {
    return commonGenerator(
        POSS_FUT_WEIGHT_INDEX,
        false,
        (builder, person, number, sentType) => builder.possibleFutureForm(person, number, sentType),
    );
}

function generateTasksByLevelKey(levelKey) {
    if (levelKey == "presentTransitive") {
        return generatePresentTransitiveTasks();
    } else if (levelKey == "presentSimple") {
        return generatePresentSimpleTasks();
    } else if (levelKey == "presentContinuous") {
        return generatePresentContinuousTasks();
    } else if (levelKey == "presentColloquial") {
        return generatePresentColloquialTasks();
    } else if (levelKey == "past") {
        return generatePastTasks();
    } else if (levelKey == "remotePast") {
        return generateRemotePastTasks();
    } else if (levelKey == "pastUncertain") {
        return generatePastUncertainTasks();
    } else if (levelKey == "pastTransitive") {
        return generatePastTransitiveTasks();
    } else if (levelKey == "intentionFuture") {
        return generateIntentionFutureTasks();
    } else if (levelKey == "possibleFuture") {
        return generatePossibleFutureTasks();
    } else {
        console.log(`generateTasksByLevelKey: unsupported levelKey: ${levelKey}`);
        return null;
    }
}

export {
    generateTasksByLevelKey,
};