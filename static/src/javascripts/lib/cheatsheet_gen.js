import { GRAMMAR_NUMBERS, GRAMMAR_PERSONS, VerbBuilder } from "./aspan";
import { Cheatsheet, TopicLink, newFormStructureBuilder } from "./cheatsheet";
import { SENTENCE_TYPES } from "./sentence";

function buildPresentTransitiveCheatsheet() {
    const firstPerson = GRAMMAR_PERSONS[0];
    const singular = GRAMMAR_NUMBERS[0];

    const statementType = SENTENCE_TYPES[0];
    let statement = [];
    statement.push(newFormStructureBuilder()
        .base().tenseAffix("а").persAffix()
        .example(new VerbBuilder("алу").presentTransitiveForm(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().tenseAffix("е").persAffix()
        .example(new VerbBuilder("беру").presentTransitiveForm(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().tenseAffix("й").persAffix()
        .example(new VerbBuilder("қарау").presentTransitiveForm(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().tenseAffix("и").persAffix()
        .example(new VerbBuilder("оқу").presentTransitiveForm(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().baseExt("й").tenseAffix("е").persAffix()
        .example(new VerbBuilder("сүю").presentTransitiveForm(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().tenseAffix("я").persAffix()
        .example(new VerbBuilder("шаю").presentTransitiveForm(firstPerson, singular, statementType))
        .build());

    const negativeType = SENTENCE_TYPES[1];
    let negative = [];
    negative.push(newFormStructureBuilder()
        .base().neg().tenseAffix("й").persAffix()
        .example(new VerbBuilder("алу").presentTransitiveForm(firstPerson, singular, negativeType))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("і").neg().tenseAffix("й").persAffix()
        .example(new VerbBuilder("есту").presentTransitiveForm(firstPerson, singular, negativeType))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("ы").neg().tenseAffix("й").persAffix()
        .example(new VerbBuilder("оқу").presentTransitiveForm(firstPerson, singular, negativeType))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("й").neg().tenseAffix("й").persAffix()
        .example(new VerbBuilder("құю").presentTransitiveForm(firstPerson, singular, negativeType))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("к").neg().tenseAffix("й").persAffix()
        .example(new VerbBuilder("кешігу").presentTransitiveForm(firstPerson, singular, negativeType))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("п").neg().tenseAffix("й").persAffix()
        .example(new VerbBuilder("жабу").presentTransitiveForm(firstPerson, singular, negativeType))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("ік").neg().tenseAffix("й").persAffix()
        .example(new VerbBuilder("ірку").presentTransitiveForm(firstPerson, singular, negativeType))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("ық").neg().tenseAffix("й").persAffix()
        .example(new VerbBuilder("қорқу").presentTransitiveForm(firstPerson, singular, negativeType))
        .build());

    const questionType = SENTENCE_TYPES[2];
    const thirdPerson = GRAMMAR_PERSONS[3];
    let question = [];
    question.push(newFormStructureBuilder()
        .base().tenseAffix("а").persAffix().space().q().qM()
        .example(new VerbBuilder("алу").presentTransitiveForm(firstPerson, singular, questionType))
        .build());
    question.push(newFormStructureBuilder()
        .base().tenseAffix("е").persAffix().space().q().qM()
        .example(new VerbBuilder("беру").presentTransitiveForm(firstPerson, singular, questionType))
        .build());
    question.push(newFormStructureBuilder()
        .base().tenseAffix("й").persAffix().space().q().qM()
        .example(new VerbBuilder("қарау").presentTransitiveForm(firstPerson, singular, questionType))
        .build());
    question.push(newFormStructureBuilder()
        .base().tenseAffix("и").persAffix().space().q().qM()
        .example(new VerbBuilder("оқу").presentTransitiveForm(firstPerson, singular, questionType))
        .build());
    question.push(newFormStructureBuilder()
        .base().baseExt("й").tenseAffix("е").persAffix().space().q().qM()
        .example(new VerbBuilder("сүю").presentTransitiveForm(firstPerson, singular, questionType))
        .build());
    question.push(newFormStructureBuilder()
        .base().tenseAffix("я").persAffix().space().q().qM()
        .example(new VerbBuilder("шаю").presentTransitiveForm(firstPerson, singular, questionType))
        .build());
    question.push(newFormStructureBuilder()
        .base().tenseAffix("а").space().q().qM()
        .example(new VerbBuilder("алу").presentTransitiveForm(thirdPerson, singular, questionType))
        .build());

    let links = [
        new TopicLink("Казахский язык. Просто о сложном", "Переходное время глагола", "https://www.kaz-tili.kz/glag2.htm"),
        new TopicLink("Казахский язык. Просто о сложном", "Глаголы-исключения", "https://www.kaz-tili.kz/gl04.htm"),
    ];

    return new Cheatsheet(statement, negative, question, links);
}

function buildPresentSimpleCheatsheet() {
    const firstPerson = GRAMMAR_PERSONS[0];
    const singular = GRAMMAR_NUMBERS[0];

    const statementType = SENTENCE_TYPES[0];
    let statement = [];
    statement.push(newFormStructureBuilder()
        .baseExt("жатыр").persAffix()
        .example(new VerbBuilder("жату").presentSimpleContinuousForm(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .baseExt("отыр").persAffix()
        .example(new VerbBuilder("отыру").presentSimpleContinuousForm(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .baseExt("тұр").persAffix()
        .example(new VerbBuilder("тұру").presentSimpleContinuousForm(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .baseExt("жүр").persAffix()
        .example(new VerbBuilder("жүру").presentSimpleContinuousForm(firstPerson, singular, statementType))
        .build());

    const negativeType = SENTENCE_TYPES[1];
    let negative = [];
    negative.push(newFormStructureBuilder()
        .baseExt("жат").tenseAffix("қан").space().negWord("жоқ").persAffix()
        .example(new VerbBuilder("жату").presentSimpleContinuousForm(firstPerson, singular, negativeType))
        .build());
    negative.push(newFormStructureBuilder()
        .baseExt("отыр").tenseAffix("ған").space().negWord("жоқ").persAffix()
        .example(new VerbBuilder("отыру").presentSimpleContinuousForm(firstPerson, singular, negativeType))
        .build());
    negative.push(newFormStructureBuilder()
        .baseExt("тұр").tenseAffix("ған").space().negWord("жоқ").persAffix()
        .example(new VerbBuilder("тұру").presentSimpleContinuousForm(firstPerson, singular, negativeType))
        .build());
    negative.push(newFormStructureBuilder()
        .baseExt("жүр").tenseAffix("ген").space().negWord("жоқ").persAffix()
        .example(new VerbBuilder("жүру").presentSimpleContinuousForm(firstPerson, singular, negativeType))
        .build());

    const questionType = SENTENCE_TYPES[2];
    let question = [];
    question.push(newFormStructureBuilder()
        .baseExt("жатыр").persAffix().space().q().qM()
        .example(new VerbBuilder("жату").presentSimpleContinuousForm(firstPerson, singular, questionType))
        .build());
    question.push(newFormStructureBuilder()
        .baseExt("отыр").persAffix().space().q().qM()
        .example(new VerbBuilder("отыру").presentSimpleContinuousForm(firstPerson, singular, questionType))
        .build());
    question.push(newFormStructureBuilder()
        .baseExt("тұр").persAffix().space().q().qM()
        .example(new VerbBuilder("тұру").presentSimpleContinuousForm(firstPerson, singular, questionType))
        .build());
    question.push(newFormStructureBuilder()
        .baseExt("жүр").persAffix().space().q().qM()
        .example(new VerbBuilder("жүру").presentSimpleContinuousForm(firstPerson, singular, questionType))
        .build());

    let links = [
        new TopicLink("Казахский язык. Просто о сложном", "Настоящее время глагола", "https://www.kaz-tili.kz/glag1.htm"),
    ];

    return new Cheatsheet(statement, negative, question, links);
}

function buildPresentContinuousCheatsheet() {
    const firstPerson = GRAMMAR_PERSONS[0];
    const singular = GRAMMAR_NUMBERS[0];

    const jatu = new VerbBuilder("жату");
    const otyru = new VerbBuilder("отыру");
    const turu = new VerbBuilder("тұру");
    const juru = new VerbBuilder("жүру");

    const statementType = SENTENCE_TYPES[0];
    let statement = [];
    statement.push(newFormStructureBuilder()
        .base().tenseAffix("іп").space().baseAux(null).persAffix()
        .example(new VerbBuilder("беру").presentContinuousForm(firstPerson, singular, statementType, otyru))
        .build());
    statement.push(newFormStructureBuilder()
        .base().tenseAffix("ып").space().baseAux(null).persAffix()
        .example(new VerbBuilder("алу").presentContinuousForm(firstPerson, singular, statementType, otyru))
        .build());
    statement.push(newFormStructureBuilder()
        .base().tenseAffix("п").space().baseAux(null).persAffix()
        .example(new VerbBuilder("қарау").presentContinuousForm(firstPerson, singular, statementType, otyru))
        .build());
    statement.push(newFormStructureBuilder()
        .base().baseExt("і").tenseAffix("п").space().baseAux(null).persAffix()
        .example(new VerbBuilder("есту").presentContinuousForm(firstPerson, singular, statementType, otyru))
        .build());
    statement.push(newFormStructureBuilder()
        .base().baseExt("ы").tenseAffix("п").space().baseAux(null).persAffix()
        .example(new VerbBuilder("оқу").presentContinuousForm(firstPerson, singular, statementType, otyru))
        .build());
    statement.push(newFormStructureBuilder()
        .base().baseExt("й").tenseAffix("іп").space().baseAux(null).persAffix()
        .example(new VerbBuilder("сүю").presentContinuousForm(firstPerson, singular, statementType, otyru))
        .build());
    statement.push(newFormStructureBuilder()
        .base().baseExt("й").tenseAffix("ып").space().baseAux(null).persAffix()
        .example(new VerbBuilder("шаю").presentContinuousForm(firstPerson, singular, statementType, otyru))
        .build());
    statement.push(newFormStructureBuilder()
        .base().tenseAffix("е").space().baseAux("жатыр").persAffix()
        .example(new VerbBuilder("келу").presentContinuousForm(firstPerson, singular, statementType, jatu))
        .build());
    statement.push(newFormStructureBuilder()
        .base().tenseAffix("а").space().baseAux("жатыр").persAffix()
        .example(new VerbBuilder("апару").presentContinuousForm(firstPerson, singular, statementType, jatu))
        .build());

    const negativeType = SENTENCE_TYPES[1];
    let negative = [];
    negative.push(newFormStructureBuilder()
        .base().tenseAffix("іп").space().baseAux("жат").tenseAffix("қан").space().negWord("жоқ").persAffix()
        .example(new VerbBuilder("беру").presentContinuousForm(firstPerson, singular, negativeType, jatu, true))
        .build());
    negative.push(newFormStructureBuilder()
        .base().tenseAffix("іп").space().baseAux("отыр").tenseAffix("ған").space().negWord("жоқ").persAffix()
        .example(new VerbBuilder("беру").presentContinuousForm(firstPerson, singular, negativeType, otyru, true))
        .build());
    negative.push(newFormStructureBuilder()
        .base().tenseAffix("іп").space().baseAux("тұр").tenseAffix("ған").space().negWord("жоқ").persAffix()
        .example(new VerbBuilder("беру").presentContinuousForm(firstPerson, singular, negativeType, turu, true))
        .build());
    negative.push(newFormStructureBuilder()
        .base().tenseAffix("іп").space().baseAux("жүр").tenseAffix("ген").space().negWord("жоқ").persAffix()
        .example(new VerbBuilder("беру").presentContinuousForm(firstPerson, singular, negativeType, juru, true))
        .build());
    negative.push(newFormStructureBuilder()
        .base().neg().tenseAffix("й").space().baseAux(null).persAffix()
        .example(new VerbBuilder("алу").presentContinuousForm(firstPerson, singular, negativeType, otyru, false))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("і").neg().tenseAffix("й").space().baseAux(null).persAffix()
        .example(new VerbBuilder("есту").presentContinuousForm(firstPerson, singular, negativeType, otyru, false))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("ы").neg().tenseAffix("й").space().baseAux(null).persAffix()
        .example(new VerbBuilder("оқу").presentContinuousForm(firstPerson, singular, negativeType, otyru, false))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("й").neg().tenseAffix("й").space().baseAux(null).persAffix()
        .example(new VerbBuilder("сүю").presentContinuousForm(firstPerson, singular, negativeType, otyru, false))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("к").neg().tenseAffix("й").space().baseAux(null).persAffix()
        .example(new VerbBuilder("кешігу").presentContinuousForm(firstPerson, singular, negativeType, otyru, false))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("п").neg().tenseAffix("й").space().baseAux(null).persAffix()
        .example(new VerbBuilder("жабу").presentContinuousForm(firstPerson, singular, negativeType, otyru, false))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("ік").neg().tenseAffix("й").space().baseAux(null).persAffix()
        .example(new VerbBuilder("ірку").presentContinuousForm(firstPerson, singular, negativeType, otyru, false))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("ық").neg().tenseAffix("й").space().baseAux(null).persAffix()
        .example(new VerbBuilder("қорқу").presentContinuousForm(firstPerson, singular, negativeType, otyru, false))
        .build());

    const questionType = SENTENCE_TYPES[2];
    let question = [];
    question.push(newFormStructureBuilder()
        .base().tenseAffix("іп").space().baseAux(null).persAffix().space().q().qM()
        .example(new VerbBuilder("беру").presentContinuousForm(firstPerson, singular, questionType, otyru))
        .build());
    question.push(newFormStructureBuilder()
        .base().tenseAffix("ып").space().baseAux(null).persAffix().space().q().qM()
        .example(new VerbBuilder("алу").presentContinuousForm(firstPerson, singular, questionType, otyru))
        .build());
    question.push(newFormStructureBuilder()
        .base().tenseAffix("п").space().baseAux(null).persAffix().space().q().qM()
        .example(new VerbBuilder("қарау").presentContinuousForm(firstPerson, singular, questionType, otyru))
        .build());
    question.push(newFormStructureBuilder()
        .base().baseExt("і").tenseAffix("п").space().baseAux(null).persAffix().space().q().qM()
        .example(new VerbBuilder("есту").presentContinuousForm(firstPerson, singular, questionType, otyru))
        .build());
    question.push(newFormStructureBuilder()
        .base().baseExt("ы").tenseAffix("п").space().baseAux(null).persAffix().space().q().qM()
        .example(new VerbBuilder("оқу").presentContinuousForm(firstPerson, singular, questionType, otyru))
        .build());
    question.push(newFormStructureBuilder()
        .base().baseExt("й").tenseAffix("іп").space().baseAux(null).persAffix().space().q().qM()
        .example(new VerbBuilder("сүю").presentContinuousForm(firstPerson, singular, questionType, otyru))
        .build());
    question.push(newFormStructureBuilder()
        .base().baseExt("й").tenseAffix("ып").space().baseAux(null).persAffix().space().q().qM()
        .example(new VerbBuilder("шаю").presentContinuousForm(firstPerson, singular, questionType, otyru))
        .build());
    question.push(newFormStructureBuilder()
        .base().tenseAffix("е").space().baseAux("жатыр").persAffix().space().q().qM()
        .example(new VerbBuilder("келу").presentContinuousForm(firstPerson, singular, questionType, otyru))
        .build());
    question.push(newFormStructureBuilder()
        .base().tenseAffix("а").space().baseAux("жатыр").persAffix().space().q().qM()
        .example(new VerbBuilder("апару").presentContinuousForm(firstPerson, singular, questionType, otyru))
        .build());

    let links = [
        new TopicLink("Казахский язык. Просто о сложном", "Настоящее время глагола", "https://www.kaz-tili.kz/glag1.htm"),
    ];

    return new Cheatsheet(statement, negative, question, links);
}

function buildPastCheatsheet() {
    const firstPerson = GRAMMAR_PERSONS[0];
    const singular = GRAMMAR_NUMBERS[0];

    const statementType = SENTENCE_TYPES[0];
    let statement = [];
    statement.push(newFormStructureBuilder()
        .base().tenseAffix("ды").persAffix()
        .example(new VerbBuilder("алу").pastForm(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().tenseAffix("ді").persAffix()
        .example(new VerbBuilder("беру").pastForm(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().tenseAffix("ты").persAffix()
        .example(new VerbBuilder("айту").pastForm(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().tenseAffix("ті").persAffix()
        .example(new VerbBuilder("кесу").pastForm(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().baseExt("і").tenseAffix("ді").persAffix()
        .example(new VerbBuilder("есту").pastForm(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().baseExt("ы").tenseAffix("ды").persAffix()
        .example(new VerbBuilder("оқу").pastForm(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().baseExt("й").tenseAffix(null).persAffix()
        .example(new VerbBuilder("сүю").pastForm(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().baseExt("к").tenseAffix("ті").persAffix()
        .example(new VerbBuilder("кешігу").pastForm(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().baseExt("қ").tenseAffix("ты").persAffix()
        .example(new VerbBuilder("шығу").pastForm(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().baseExt("п").tenseAffix(null).persAffix()
        .example(new VerbBuilder("жабу").pastForm(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().baseExt("ік").tenseAffix("ті").persAffix()
        .example(new VerbBuilder("ірку").pastForm(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().baseExt("ық").tenseAffix("ты").persAffix()
        .example(new VerbBuilder("қорқу").pastForm(firstPerson, singular, statementType))
        .build());

    const negativeType = SENTENCE_TYPES[1];
    let negative = [];
    negative.push(newFormStructureBuilder()
        .base().neg().tenseAffix(null).persAffix()
        .example(new VerbBuilder("алу").pastForm(firstPerson, singular, negativeType))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("і").negC("ме").tenseAffix(null).persAffix()
        .example(new VerbBuilder("есту").pastForm(firstPerson, singular, negativeType))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("ы").negC("ма").tenseAffix(null).persAffix()
        .example(new VerbBuilder("оқу").pastForm(firstPerson, singular, negativeType))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("й").neg().tenseAffix(null).persAffix()
        .example(new VerbBuilder("сүю").pastForm(firstPerson, singular, negativeType))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("к").negC("пе").tenseAffix("ді").persAffix()
        .example(new VerbBuilder("кешігу").pastForm(firstPerson, singular, negativeType))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("қ").negC("па").tenseAffix("ды").persAffix()
        .example(new VerbBuilder("шығу").pastForm(firstPerson, singular, negativeType))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("п").neg().tenseAffix(null).persAffix()
        .example(new VerbBuilder("жабу").pastForm(firstPerson, singular, negativeType))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("ік").negC("пе").tenseAffix("ді").persAffix()
        .example(new VerbBuilder("ірку").pastForm(firstPerson, singular, negativeType))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("ық").negC("па").tenseAffix("ды").persAffix()
        .example(new VerbBuilder("қорқу").pastForm(firstPerson, singular, negativeType))
        .build());

    let links = [
        new TopicLink("Казахский язык. Просто о сложном", "Прошедшее время глагола", "https://www.kaz-tili.kz/glag3.htm"),
    ];

    return new Cheatsheet(statement, negative, [], links);
}

function buildRemotePastCheatsheet() {
    const firstPerson = GRAMMAR_PERSONS[0];
    const singular = GRAMMAR_NUMBERS[0];

    const statementType = SENTENCE_TYPES[0];
    let statement = [];
    statement.push(newFormStructureBuilder()
        .base().tenseAffix("ған").persAffix()
        .example(new VerbBuilder("алу").remotePastTense(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().tenseAffix("ген").persAffix()
        .example(new VerbBuilder("беру").remotePastTense(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().tenseAffix("қан").persAffix()
        .example(new VerbBuilder("айту").remotePastTense(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().tenseAffix("кен").persAffix()
        .example(new VerbBuilder("кесу").remotePastTense(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().baseExt("і").tenseAffix("ген").persAffix()
        .example(new VerbBuilder("есту").remotePastTense(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().baseExt("ы").tenseAffix("ған").persAffix()
        .example(new VerbBuilder("оқу").remotePastTense(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().baseExt("й").tenseAffix(null).persAffix()
        .example(new VerbBuilder("сүю").remotePastTense(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().baseExt("к").tenseAffix("кен").persAffix()
        .example(new VerbBuilder("кешігу").remotePastTense(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().baseExt("қ").tenseAffix("қан").persAffix()
        .example(new VerbBuilder("шығу").remotePastTense(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().baseExt("п").tenseAffix(null).persAffix()
        .example(new VerbBuilder("жабу").remotePastTense(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().baseExt("ік").tenseAffix("кен").persAffix()
        .example(new VerbBuilder("ірку").remotePastTense(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().baseExt("ық").tenseAffix("қан").persAffix()
        .example(new VerbBuilder("қорқу").remotePastTense(firstPerson, singular, statementType))
        .build());

    const negativeType = SENTENCE_TYPES[1];
    let negative = [];
    negative.push(newFormStructureBuilder()
        .base().tenseAffix(null).space().negWord("жоқ").persAffix()
        .example(new VerbBuilder("алу").remotePastTense(firstPerson, singular, negativeType, true))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("і").tenseAffix("ген").space().negWord("жоқ").persAffix()
        .example(new VerbBuilder("есту").remotePastTense(firstPerson, singular, negativeType, true))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("ы").tenseAffix("ған").space().negWord("жоқ").persAffix()
        .example(new VerbBuilder("оқу").remotePastTense(firstPerson, singular, negativeType, true))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("й").tenseAffix(null).space().negWord("жоқ").persAffix()
        .example(new VerbBuilder("сүю").remotePastTense(firstPerson, singular, negativeType, true))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("к").tenseAffix("кен").space().negWord("жоқ").persAffix()
        .example(new VerbBuilder("кешігу").remotePastTense(firstPerson, singular, negativeType, true))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("қ").tenseAffix("қан").space().negWord("жоқ").persAffix()
        .example(new VerbBuilder("шығу").remotePastTense(firstPerson, singular, negativeType, true))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("п").tenseAffix(null).space().negWord("жоқ").persAffix()
        .example(new VerbBuilder("жабу").remotePastTense(firstPerson, singular, negativeType, true))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("ік").tenseAffix("кен").space().negWord("жоқ").persAffix()
        .example(new VerbBuilder("ірку").remotePastTense(firstPerson, singular, negativeType, true))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("ық").tenseAffix("қан").space().negWord("жоқ").persAffix()
        .example(new VerbBuilder("қорқу").remotePastTense(firstPerson, singular, negativeType, true))
        .build());

    negative.push(newFormStructureBuilder()
        .base().neg().tenseAffix(null).persAffix()
        .example(new VerbBuilder("алу").remotePastTense(firstPerson, singular, negativeType, false))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("і").negC("ме").tenseAffix(null).persAffix()
        .example(new VerbBuilder("есту").remotePastTense(firstPerson, singular, negativeType, false))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("ы").negC("ма").tenseAffix(null).persAffix()
        .example(new VerbBuilder("оқу").remotePastTense(firstPerson, singular, negativeType, false))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("й").neg().tenseAffix(null).persAffix()
        .example(new VerbBuilder("сүю").remotePastTense(firstPerson, singular, negativeType, false))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("к").negC("пе").tenseAffix("ген").persAffix()
        .example(new VerbBuilder("кешігу").remotePastTense(firstPerson, singular, negativeType, false))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("қ").negC("па").tenseAffix("ған").persAffix()
        .example(new VerbBuilder("шығу").remotePastTense(firstPerson, singular, negativeType, false))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("п").neg().tenseAffix(null).persAffix()
        .example(new VerbBuilder("жабу").remotePastTense(firstPerson, singular, negativeType, false))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("ік").negC("пе").tenseAffix("ген").persAffix()
        .example(new VerbBuilder("ірку").remotePastTense(firstPerson, singular, negativeType, false))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("ық").negC("па").tenseAffix("ған").persAffix()
        .example(new VerbBuilder("қорқу").remotePastTense(firstPerson, singular, negativeType, false))
        .build());

    const links = [
        new TopicLink("Казахский язык. Просто о сложном", "Давнопрошедшее очевидное время глагола", "https://www.kaz-tili.kz/glag9.htm"),
    ];

    return new Cheatsheet(statement, negative, [], links);
}

function generateCheatsheetByLevelKey(levelKey) {
    if (levelKey == "presentTransitive") {
        return buildPresentTransitiveCheatsheet();
    } else if (levelKey == "presentSimple") {
        return buildPresentSimpleCheatsheet();
    } else if (levelKey == "presentContinuous") {
        return buildPresentContinuousCheatsheet();
    } else if (levelKey == "past") {
        return buildPastCheatsheet();
    } else if (levelKey == "remotePast") {
        return buildRemotePastCheatsheet();
    } else {
        console.log(`generateCheatsheetByLevelKey: unsupported level key: ${levelKey}`);
        return null;
    }
}

export {
    generateCheatsheetByLevelKey,
};