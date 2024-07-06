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
const PRIOR_CONS_WEIGHT_INDEX = 1;
const CONTINUOUS_WEIGHT_INDEX = 2;
const POSS_FUT_WEIGHT_INDEX = 3;

const INTEREST = 10;
const HEAVY = 80;
const SUPER_HEAVY = 120;

class WeightedSample {
    constructor(infinitive, forceExceptional, weight, priorConsWeight, contWeight, possFutWeight) {
        this.infinitive = infinitive;
        this.forceExceptional = forceExceptional;
        this.weights = [weight, priorConsWeight, contWeight, possFutWeight];
    }

    builder() {
        return new VerbBuilder(this.infinitive, this.forceExceptional);
    }
}

function regularSample(infinitive) {
    return new WeightedSample(infinitive, false, 1, 1, 1, 1);
}

function interestingSample(infinitive) {
    return new WeightedSample(infinitive, false, INTEREST, INTEREST, INTEREST, INTEREST);
}

function forcedException(infinitive) {
    return new WeightedSample(infinitive, true, INTEREST, INTEREST, INTEREST, INTEREST);
}

function priorConsSample(infinitive) {
    return new WeightedSample(infinitive, false, INTEREST, HEAVY, INTEREST, INTEREST);
}

function contSample(infinitive, weight) {
    return new WeightedSample(infinitive, false, INTEREST, INTEREST, weight, INTEREST);
}

function possFutSample(infinitive) {
    return new WeightedSample(infinitive, false, INTEREST, INTEREST, INTEREST, SUPER_HEAVY);
}

/**
 * Order approximately by increasing weight, so that regular samples get more chances to be shuffled among themselves.
 * If we allow heavy samples to be picked first, they would stabilize the selection and make later swaps less likely.
 */
const VERB_POOL = [
    regularSample("істеу"),    /* popular verbs */
    regularSample("алу"),
    regularSample("беру"),
    regularSample("жоспарлау"),
    regularSample("өту"),
    regularSample("жасау"),
    regularSample("көрсету"),
    regularSample("күту"),
    regularSample("жүргізу"),
    regularSample("қарау"),
    regularSample("жазу"),
    regularSample("жету"),
    regularSample("сұрау"),
    regularSample("қалу"),
    regularSample("көздеу"),
    regularSample("түсу"),
    regularSample("ұсыну"),
    regularSample("толу"),
    regularSample("қатысу"),
    regularSample("жасалу"),
    regularSample("қабылдау"),
    regularSample("көзделу"),
    regularSample("салыну"),
    regularSample("көріну"),
    regularSample("қою"),
    regularSample("бастау"),
    regularSample("берілу"),
    regularSample("салу"),
    regularSample("қосу"),
    regularSample("кету"),
    regularSample("тыңдау"),
    regularSample("тарту"),
    regularSample("шығару"),
    regularSample("білу"),
    regularSample("ұстау"),
    regularSample("ойлау"),
    regularSample("қарастыру"),
    regularSample("анықталу"),
    regularSample("асу"),
    regularSample("жалғасу"),
    regularSample("ұйымдастырылу"),
    regularSample("іздеу"),
    regularSample("құрау"),
    regularSample("өткізу"),
    regularSample("сүру"),
    regularSample("дайындалу"),
    regularSample("қуану"),
    regularSample("түсіну"),
    regularSample("білдіру"),
    regularSample("таныту"),
    regularSample("атқару"),
    regularSample("шақыру"),
    regularSample("айналысу"),
    regularSample("туындау"),
    regularSample("ашылу"),
    regularSample("талқылау"),
    regularSample("айтылу"),
    regularSample("бөліну"),
    regularSample("талқылану"),
    regularSample("жүзеге"),
    regularSample("қолдау"),
    regularSample("қаралу"),
    regularSample("тіркелу"),
    regularSample("алыну"),
    regularSample("өсу"),
    regularSample("айналу"),
    regularSample("қамту"),
    regularSample("анықтау"),
    regularSample("алаңдату"),
    regularSample("жылау"),
    regularSample("келтіру"),
    regularSample("ұсынылу"),
    regularSample("туу"),
    regularSample("көмектесу"),
    regularSample("тексеру"),
    regularSample("тәрбиелеу"),

    interestingSample("ішу"),     /* ends with unvoiced consonant */
    interestingSample("айту"),
    interestingSample("тырысу"),
    interestingSample("оқу"),     /* additional ы */
    interestingSample("қобалжу"),
    interestingSample("аршу"),
    interestingSample("баю"),
    interestingSample("тану"),    /* optionally exceptional */
    forcedException("тану"),
    interestingSample("жану"),
    forcedException("жану"),
    interestingSample("жуу"),
    forcedException("жуу"),
    interestingSample("құру"),
    forcedException("құру"),
    interestingSample("ию"),
    forcedException("ию"),
    interestingSample("ашу"),
    forcedException("ашу"),
    interestingSample("есту"),    /* additional і */
    interestingSample("ренжу"),
    interestingSample("сүңгу"),

    contSample("құю", HEAVY),    /* additional й */
    contSample("сүю", HEAVY),
    contSample("шаю", HEAVY),
    priorConsSample("кешігу"), /* base ends with гғб: matters for negative */
    priorConsSample("шығу"),

    priorConsSample("қорқу"), /* base has a vowel if followed by a consonant */
    priorConsSample("қырқу"),
    priorConsSample("ірку"),
    priorConsSample("бүрку"),

    new WeightedSample("жабу", false, 1, HEAVY, SUPER_HEAVY, 1),  /* base ends with б and special cases for present continuous */
    new WeightedSample("табу", false, 1, HEAVY, SUPER_HEAVY, 1),
    new WeightedSample("тебу", false, 1, HEAVY, SUPER_HEAVY, 1),
    new WeightedSample("қабу", false, 1, HEAVY, SUPER_HEAVY, 1),
    new WeightedSample("қабу", true, 1, HEAVY, INTEREST, 1),

    contSample("бару", SUPER_HEAVY),   /* special cases for present continuous */
    contSample("келу", SUPER_HEAVY),
    contSample("апару", SUPER_HEAVY),
    contSample("әкелу", SUPER_HEAVY),

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
        PRIOR_CONS_WEIGHT_INDEX,
        false,
        (builder, person, number, sentType) => builder.pastForm(person, number, sentType),
    );
}

function generateRemotePastTasks() {
    let verbs = reservoirSampling(LEVEL_SAMPLES, PRIOR_CONS_WEIGHT_INDEX);
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
        PRIOR_CONS_WEIGHT_INDEX,
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
    } else if (levelKey == "possibleFuture") {
        return generatePossibleFutureTasks();
    } else if (levelKey == "intentionFuture") {
        return generateIntentionFutureTasks();
    } else {
        console.log(`generateTasksByLevelKey: unsupported levelKey: ${levelKey}`);
        return null;
    }
}

export {
    generateTasksByLevelKey,
};