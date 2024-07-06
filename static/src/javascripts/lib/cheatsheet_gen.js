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
        .example("алу", new VerbBuilder("алу").presentTransitiveForm(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().tenseAffix("е").persAffix()
        .example("беру", new VerbBuilder("беру").presentTransitiveForm(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().tenseAffix("й").persAffix()
        .example("қарау", new VerbBuilder("қарау").presentTransitiveForm(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().tenseAffix("и").persAffix()
        .example("оқу", new VerbBuilder("оқу").presentTransitiveForm(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().baseExt("й").tenseAffix("е").persAffix()
        .example("сүю", new VerbBuilder("сүю").presentTransitiveForm(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().tenseAffix("я").persAffix()
        .example("шаю", new VerbBuilder("шаю").presentTransitiveForm(firstPerson, singular, statementType))
        .build());

    const negativeType = SENTENCE_TYPES[1];
    let negative = [];
    negative.push(newFormStructureBuilder()
        .base().neg().tenseAffix("й").persAffix()
        .example("алу", new VerbBuilder("алу").presentTransitiveForm(firstPerson, singular, negativeType))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("і").neg().tenseAffix("й").persAffix()
        .example("есту", new VerbBuilder("есту").presentTransitiveForm(firstPerson, singular, negativeType))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("ы").neg().tenseAffix("й").persAffix()
        .example("оқу", new VerbBuilder("оқу").presentTransitiveForm(firstPerson, singular, negativeType))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("й").neg().tenseAffix("й").persAffix()
        .example("құю", new VerbBuilder("құю").presentTransitiveForm(firstPerson, singular, negativeType))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("к").neg().tenseAffix("й").persAffix()
        .example("кешігу", new VerbBuilder("кешігу").presentTransitiveForm(firstPerson, singular, negativeType))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("п").neg().tenseAffix("й").persAffix()
        .example("жабу", new VerbBuilder("жабу").presentTransitiveForm(firstPerson, singular, negativeType))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("ік").neg().tenseAffix("й").persAffix()
        .example("ірку", new VerbBuilder("ірку").presentTransitiveForm(firstPerson, singular, negativeType))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("ық").neg().tenseAffix("й").persAffix()
        .example("қорқу", new VerbBuilder("қорқу").presentTransitiveForm(firstPerson, singular, negativeType))
        .build());

    const questionType = SENTENCE_TYPES[2];
    const thirdPerson = GRAMMAR_PERSONS[3];
    let question = [];
    question.push(newFormStructureBuilder()
        .base().tenseAffix(null).persAffix().space().q().qM()
        .example("алу", new VerbBuilder("алу").presentTransitiveForm(firstPerson, singular, questionType))
        .build());
    question.push(newFormStructureBuilder()
        .base().tenseAffix(null).space().q().qM()
        .example("алу", new VerbBuilder("алу").presentTransitiveForm(thirdPerson, singular, questionType))
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
        .example("жату", new VerbBuilder("жату").presentSimpleContinuousForm(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .baseExt("отыр").persAffix()
        .example("отыру", new VerbBuilder("отыру").presentSimpleContinuousForm(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .baseExt("тұр").persAffix()
        .example("тұру", new VerbBuilder("тұру").presentSimpleContinuousForm(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .baseExt("жүр").persAffix()
        .example("жүру", new VerbBuilder("жүру").presentSimpleContinuousForm(firstPerson, singular, statementType))
        .build());

    const negativeType = SENTENCE_TYPES[1];
    let negative = [];
    negative.push(newFormStructureBuilder()
        .baseExt("жат").tenseAffix("қан").space().negWord("жоқ").persAffix()
        .example("жату", new VerbBuilder("жату").presentSimpleContinuousForm(firstPerson, singular, negativeType))
        .build());
    negative.push(newFormStructureBuilder()
        .baseExt("отыр").tenseAffix("ған").space().negWord("жоқ").persAffix()
        .example("отыру", new VerbBuilder("отыру").presentSimpleContinuousForm(firstPerson, singular, negativeType))
        .build());
    negative.push(newFormStructureBuilder()
        .baseExt("тұр").tenseAffix("ған").space().negWord("жоқ").persAffix()
        .example("тұру", new VerbBuilder("тұру").presentSimpleContinuousForm(firstPerson, singular, negativeType))
        .build());
    negative.push(newFormStructureBuilder()
        .baseExt("жүр").tenseAffix("ген").space().negWord("жоқ").persAffix()
        .example("жүру", new VerbBuilder("жүру").presentSimpleContinuousForm(firstPerson, singular, negativeType))
        .build());

    let links = [
        new TopicLink("Казахский язык. Просто о сложном", "Настоящее время глагола", "https://www.kaz-tili.kz/glag1.htm"),
    ];

    return new Cheatsheet(statement, negative, [], links);
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
        .example("беру", new VerbBuilder("беру").presentContinuousForm(firstPerson, singular, statementType, otyru))
        .build());
    statement.push(newFormStructureBuilder()
        .base().tenseAffix("ып").space().baseAux(null).persAffix()
        .example("алу", new VerbBuilder("алу").presentContinuousForm(firstPerson, singular, statementType, otyru))
        .build());
    statement.push(newFormStructureBuilder()
        .base().tenseAffix("п").space().baseAux(null).persAffix()
        .example("қарау", new VerbBuilder("қарау").presentContinuousForm(firstPerson, singular, statementType, otyru))
        .build());
    statement.push(newFormStructureBuilder()
        .base().baseExt("у").tenseAffix("ып").space().baseAux(null).persAffix()
        .example("жабу", new VerbBuilder("жабу").presentContinuousForm(firstPerson, singular, statementType, otyru))
        .build());
    statement.push(newFormStructureBuilder()
        .base().baseExt("і").tenseAffix("п").space().baseAux(null).persAffix()
        .example("есту", new VerbBuilder("есту").presentContinuousForm(firstPerson, singular, statementType, otyru))
        .build());
    statement.push(newFormStructureBuilder()
        .base().baseExt("ы").tenseAffix("п").space().baseAux(null).persAffix()
        .example("оқу", new VerbBuilder("оқу").presentContinuousForm(firstPerson, singular, statementType, otyru))
        .build());
    statement.push(newFormStructureBuilder()
        .base().baseExt("й").tenseAffix(null).space().baseAux(null).persAffix()
        .example("сүю", new VerbBuilder("сүю").presentContinuousForm(firstPerson, singular, statementType, otyru))
        .build());
    statement.push(newFormStructureBuilder()
        .base().tenseAffix("е").space().baseAux("жатыр").persAffix()
        .example("келу", new VerbBuilder("келу").presentContinuousForm(firstPerson, singular, statementType, jatu))
        .build());
    statement.push(newFormStructureBuilder()
        .base().tenseAffix("а").space().baseAux("жатыр").persAffix()
        .example("апару", new VerbBuilder("апару").presentContinuousForm(firstPerson, singular, statementType, jatu))
        .build());

    const negativeType = SENTENCE_TYPES[1];
    let negative = [];
    negative.push(newFormStructureBuilder()
        .base().tenseAffix(null).space().baseAux("жат").tenseAffix("қан").space().negWord("жоқ").persAffix()
        .example("беру", new VerbBuilder("беру").presentContinuousForm(firstPerson, singular, negativeType, jatu, true))
        .build());
    negative.push(newFormStructureBuilder()
        .base().tenseAffix(null).space().baseAux("отыр").tenseAffix("ған").space().negWord("жоқ").persAffix()
        .example("беру", new VerbBuilder("беру").presentContinuousForm(firstPerson, singular, negativeType, otyru, true))
        .build());
    negative.push(newFormStructureBuilder()
        .base().tenseAffix(null).space().baseAux("тұр").tenseAffix("ған").space().negWord("жоқ").persAffix()
        .example("беру", new VerbBuilder("беру").presentContinuousForm(firstPerson, singular, negativeType, turu, true))
        .build());
    negative.push(newFormStructureBuilder()
        .base().tenseAffix(null).space().baseAux("жүр").tenseAffix("ген").space().negWord("жоқ").persAffix()
        .example("беру", new VerbBuilder("беру").presentContinuousForm(firstPerson, singular, negativeType, juru, true))
        .build());
    negative.push(newFormStructureBuilder()
        .base().neg().tenseAffix("й").space().baseAux(null).persAffix()
        .example("алу", new VerbBuilder("алу").presentContinuousForm(firstPerson, singular, negativeType, otyru, false))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("і").neg().tenseAffix("й").space().baseAux(null).persAffix()
        .example("есту", new VerbBuilder("есту").presentContinuousForm(firstPerson, singular, negativeType, otyru, false))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("ы").neg().tenseAffix("й").space().baseAux(null).persAffix()
        .example("оқу", new VerbBuilder("оқу").presentContinuousForm(firstPerson, singular, negativeType, otyru, false))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("й").neg().tenseAffix("й").space().baseAux(null).persAffix()
        .example("сүю", new VerbBuilder("сүю").presentContinuousForm(firstPerson, singular, negativeType, otyru, false))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("к").neg().tenseAffix("й").space().baseAux(null).persAffix()
        .example("кешігу", new VerbBuilder("кешігу").presentContinuousForm(firstPerson, singular, negativeType, otyru, false))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("п").neg().tenseAffix("й").space().baseAux(null).persAffix()
        .example("жабу", new VerbBuilder("жабу").presentContinuousForm(firstPerson, singular, negativeType, otyru, false))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("ік").neg().tenseAffix("й").space().baseAux(null).persAffix()
        .example("ірку", new VerbBuilder("ірку").presentContinuousForm(firstPerson, singular, negativeType, otyru, false))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("ық").neg().tenseAffix("й").space().baseAux(null).persAffix()
        .example("қорқу", new VerbBuilder("қорқу").presentContinuousForm(firstPerson, singular, negativeType, otyru, false))
        .build());

    let links = [
        new TopicLink("Казахский язык. Просто о сложном", "Настоящее время глагола", "https://www.kaz-tili.kz/glag1.htm"),
    ];

    return new Cheatsheet(statement, negative, [], links);
}

function buildPastCheatsheet() {
    const firstPerson = GRAMMAR_PERSONS[0];
    const singular = GRAMMAR_NUMBERS[0];

    const statementType = SENTENCE_TYPES[0];
    let statement = [];
    statement.push(newFormStructureBuilder()
        .base().tenseAffix("ды").persAffix()
        .example("алу", new VerbBuilder("алу").pastForm(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().tenseAffix("ді").persAffix()
        .example("беру", new VerbBuilder("беру").pastForm(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().tenseAffix("ты").persAffix()
        .example("айту", new VerbBuilder("айту").pastForm(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().tenseAffix("ті").persAffix()
        .example("кесу", new VerbBuilder("кесу").pastForm(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().baseExt("і").tenseAffix("ді").persAffix()
        .example("есту", new VerbBuilder("есту").pastForm(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().baseExt("ы").tenseAffix("ды").persAffix()
        .example("оқу", new VerbBuilder("оқу").pastForm(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().baseExt("й").tenseAffix(null).persAffix()
        .example("сүю", new VerbBuilder("сүю").pastForm(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().baseExt("к").tenseAffix("ті").persAffix()
        .example("кешігу", new VerbBuilder("кешігу").pastForm(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().baseExt("қ").tenseAffix("ты").persAffix()
        .example("шығу", new VerbBuilder("шығу").pastForm(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().baseExt("п").tenseAffix(null).persAffix()
        .example("жабу", new VerbBuilder("жабу").pastForm(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().baseExt("ік").tenseAffix("ті").persAffix()
        .example("ірку", new VerbBuilder("ірку").pastForm(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().baseExt("ық").tenseAffix("ты").persAffix()
        .example("қорқу", new VerbBuilder("қорқу").pastForm(firstPerson, singular, statementType))
        .build());

    const negativeType = SENTENCE_TYPES[1];
    let negative = [];
    negative.push(newFormStructureBuilder()
        .base().neg().tenseAffix(null).persAffix()
        .example("алу", new VerbBuilder("алу").pastForm(firstPerson, singular, negativeType))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("і").negC("ме").tenseAffix(null).persAffix()
        .example("есту", new VerbBuilder("есту").pastForm(firstPerson, singular, negativeType))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("ы").negC("ма").tenseAffix(null).persAffix()
        .example("оқу", new VerbBuilder("оқу").pastForm(firstPerson, singular, negativeType))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("й").neg().tenseAffix(null).persAffix()
        .example("сүю", new VerbBuilder("сүю").pastForm(firstPerson, singular, negativeType))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("к").negC("пе").tenseAffix("ді").persAffix()
        .example("кешігу", new VerbBuilder("кешігу").pastForm(firstPerson, singular, negativeType))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("қ").negC("па").tenseAffix("ды").persAffix()
        .example("шығу", new VerbBuilder("шығу").pastForm(firstPerson, singular, negativeType))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("п").neg().tenseAffix(null).persAffix()
        .example("жабу", new VerbBuilder("жабу").pastForm(firstPerson, singular, negativeType))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("ік").negC("пе").tenseAffix("ді").persAffix()
        .example("ірку", new VerbBuilder("ірку").pastForm(firstPerson, singular, negativeType))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("ық").negC("па").tenseAffix("ды").persAffix()
        .example("қорқу", new VerbBuilder("қорқу").pastForm(firstPerson, singular, negativeType))
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
        .example("алу", new VerbBuilder("алу").remotePastTense(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().tenseAffix("ген").persAffix()
        .example("беру", new VerbBuilder("беру").remotePastTense(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().tenseAffix("қан").persAffix()
        .example("айту", new VerbBuilder("айту").remotePastTense(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().tenseAffix("кен").persAffix()
        .example("кесу", new VerbBuilder("кесу").remotePastTense(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().baseExt("і").tenseAffix("ген").persAffix()
        .example("есту", new VerbBuilder("есту").remotePastTense(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().baseExt("ы").tenseAffix("ған").persAffix()
        .example("оқу", new VerbBuilder("оқу").remotePastTense(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().baseExt("й").tenseAffix(null).persAffix()
        .example("сүю", new VerbBuilder("сүю").remotePastTense(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().baseExt("к").tenseAffix("кен").persAffix()
        .example("кешігу", new VerbBuilder("кешігу").remotePastTense(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().baseExt("қ").tenseAffix("қан").persAffix()
        .example("шығу", new VerbBuilder("шығу").remotePastTense(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().baseExt("п").tenseAffix(null).persAffix()
        .example("жабу", new VerbBuilder("жабу").remotePastTense(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().baseExt("ік").tenseAffix("кен").persAffix()
        .example("ірку", new VerbBuilder("ірку").remotePastTense(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().baseExt("ық").tenseAffix("қан").persAffix()
        .example("қорқу", new VerbBuilder("қорқу").remotePastTense(firstPerson, singular, statementType))
        .build());

    const negativeType = SENTENCE_TYPES[1];
    let negative = [];
    negative.push(newFormStructureBuilder()
        .base().tenseAffix(null).space().negWord("жоқ").persAffix()
        .example("алу", new VerbBuilder("алу").remotePastTense(firstPerson, singular, negativeType, true))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("і").tenseAffix("ген").space().negWord("жоқ").persAffix()
        .example("есту", new VerbBuilder("есту").remotePastTense(firstPerson, singular, negativeType, true))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("ы").tenseAffix("ған").space().negWord("жоқ").persAffix()
        .example("оқу", new VerbBuilder("оқу").remotePastTense(firstPerson, singular, negativeType, true))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("й").tenseAffix(null).space().negWord("жоқ").persAffix()
        .example("сүю", new VerbBuilder("сүю").remotePastTense(firstPerson, singular, negativeType, true))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("к").tenseAffix("кен").space().negWord("жоқ").persAffix()
        .example("кешігу", new VerbBuilder("кешігу").remotePastTense(firstPerson, singular, negativeType, true))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("қ").tenseAffix("қан").space().negWord("жоқ").persAffix()
        .example("шығу", new VerbBuilder("шығу").remotePastTense(firstPerson, singular, negativeType, true))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("п").tenseAffix(null).space().negWord("жоқ").persAffix()
        .example("жабу", new VerbBuilder("жабу").remotePastTense(firstPerson, singular, negativeType, true))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("ік").tenseAffix("кен").space().negWord("жоқ").persAffix()
        .example("ірку", new VerbBuilder("ірку").remotePastTense(firstPerson, singular, negativeType, true))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("ық").tenseAffix("қан").space().negWord("жоқ").persAffix()
        .example("қорқу", new VerbBuilder("қорқу").remotePastTense(firstPerson, singular, negativeType, true))
        .build());

    negative.push(newFormStructureBuilder()
        .base().neg().tenseAffix(null).persAffix()
        .example("алу", new VerbBuilder("алу").remotePastTense(firstPerson, singular, negativeType, false))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("і").negC("ме").tenseAffix(null).persAffix()
        .example("есту", new VerbBuilder("есту").remotePastTense(firstPerson, singular, negativeType, false))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("ы").negC("ма").tenseAffix(null).persAffix()
        .example("оқу", new VerbBuilder("оқу").remotePastTense(firstPerson, singular, negativeType, false))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("й").neg().tenseAffix(null).persAffix()
        .example("сүю", new VerbBuilder("сүю").remotePastTense(firstPerson, singular, negativeType, false))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("к").negC("пе").tenseAffix("ген").persAffix()
        .example("кешігу", new VerbBuilder("кешігу").remotePastTense(firstPerson, singular, negativeType, false))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("қ").negC("па").tenseAffix("ған").persAffix()
        .example("шығу", new VerbBuilder("шығу").remotePastTense(firstPerson, singular, negativeType, false))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("п").neg().tenseAffix(null).persAffix()
        .example("жабу", new VerbBuilder("жабу").remotePastTense(firstPerson, singular, negativeType, false))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("ік").negC("пе").tenseAffix("ген").persAffix()
        .example("ірку", new VerbBuilder("ірку").remotePastTense(firstPerson, singular, negativeType, false))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("ық").negC("па").tenseAffix("ған").persAffix()
        .example("қорқу", new VerbBuilder("қорқу").remotePastTense(firstPerson, singular, negativeType, false))
        .build());

    const links = [
        new TopicLink("Казахский язык. Просто о сложном", "Давнопрошедшее очевидное время глагола", "https://www.kaz-tili.kz/glag9.htm"),
    ];

    return new Cheatsheet(statement, negative, [], links);
}

function buildPastUncertainCheatsheet() {
    const firstPerson = GRAMMAR_PERSONS[0];
    const singular = GRAMMAR_NUMBERS[0];

    const statementType = SENTENCE_TYPES[0];
    let statement = [];
    statement.push(newFormStructureBuilder()
        .base().tenseAffix("ып").persAffix()
        .example("алу", new VerbBuilder("алу").pastUncertainTense(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().tenseAffix("іп").persAffix()
        .example("беру", new VerbBuilder("беру").pastUncertainTense(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().tenseAffix("п").persAffix()
        .example("қарау", new VerbBuilder("қарау").pastUncertainTense(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().baseExt("і").tenseAffix("п").persAffix()
        .example("есту", new VerbBuilder("есту").pastUncertainTense(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().baseExt("ы").tenseAffix("п").persAffix()
        .example("оқу", new VerbBuilder("оқу").pastUncertainTense(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().baseExt("й").tenseAffix(null).persAffix()
        .example("сүю", new VerbBuilder("сүю").pastUncertainTense(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().baseExt("у").tenseAffix(null).persAffix()
        .example("жабу", new VerbBuilder("жабу").pastUncertainTense(firstPerson, singular, statementType))
        .build());

    const negativeType = SENTENCE_TYPES[1];
    let negative = [];
    negative.push(newFormStructureBuilder()
        .base().neg().tenseAffix("п").persAffix()
        .example("алу", new VerbBuilder("алу").pastUncertainTense(firstPerson, singular, negativeType))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("і").negC("ме").tenseAffix("п").persAffix()
        .example("есту", new VerbBuilder("есту").pastUncertainTense(firstPerson, singular, negativeType))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("ы").negC("ма").tenseAffix("п").persAffix()
        .example("оқу", new VerbBuilder("оқу").pastUncertainTense(firstPerson, singular, negativeType))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("й").neg().tenseAffix("п").persAffix()
        .example("сүю", new VerbBuilder("сүю").pastUncertainTense(firstPerson, singular, negativeType))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("к").negC("пе").tenseAffix("п").persAffix()
        .example("кешігу", new VerbBuilder("кешігу").pastUncertainTense(firstPerson, singular, negativeType))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("қ").negC("па").tenseAffix("п").persAffix()
        .example("шығу", new VerbBuilder("шығу").pastUncertainTense(firstPerson, singular, negativeType))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("п").neg().tenseAffix(null).persAffix()
        .example("жабу", new VerbBuilder("жабу").pastUncertainTense(firstPerson, singular, negativeType))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("ік").negC("пе").tenseAffix("п").persAffix()
        .example("ірку", new VerbBuilder("ірку").pastUncertainTense(firstPerson, singular, negativeType))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("ық").negC("па").tenseAffix("п").persAffix()
        .example("қорқу", new VerbBuilder("қорқу").pastUncertainTense(firstPerson, singular, negativeType))
        .build());

    let links = [
        new TopicLink("Казахский язык. Просто о сложном", "Давнопрошедшее неочевидное время глагола", "https://www.kaz-tili.kz/glag10.htm"),
    ];

    return new Cheatsheet(statement, negative, [], links);
}

function buildPastTransitive() {
    const firstPerson = GRAMMAR_PERSONS[0];
    const singular = GRAMMAR_NUMBERS[0];

    const statementType = SENTENCE_TYPES[0];
    let statement = [];
    statement.push(newFormStructureBuilder()
        .base().tenseAffix("атын").persAffix()
        .example("алу", new VerbBuilder("алу").pastTransitiveTense(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().tenseAffix("етін").persAffix()
        .example("беру", new VerbBuilder("беру").pastTransitiveTense(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().tenseAffix("йтын").persAffix()
        .example("қарау", new VerbBuilder("қарау").pastTransitiveTense(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().tenseAffix("йтін").persAffix()
        .example("істеу", new VerbBuilder("істеу").pastTransitiveTense(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().tenseAffix("итін").persAffix()
        .example("есту", new VerbBuilder("есту").pastTransitiveTense(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().tenseAffix("итын").persAffix()
        .example("оқу", new VerbBuilder("оқу").pastTransitiveTense(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().baseExt("й").tenseAffix("етін").persAffix()
        .example("сүю", new VerbBuilder("сүю").pastTransitiveTense(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().tenseAffix("ятын").persAffix()
        .example("шаю", new VerbBuilder("шаю").pastTransitiveTense(firstPerson, singular, statementType))
        .build());

    const negativeType = SENTENCE_TYPES[1];
    let negative = [];
    negative.push(newFormStructureBuilder()
        .base().neg().tenseAffix(null).persAffix()
        .example("алу", new VerbBuilder("алу").pastTransitiveTense(firstPerson, singular, negativeType))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("і").negC("ме").tenseAffix("йтін").persAffix()
        .example("есту", new VerbBuilder("есту").pastTransitiveTense(firstPerson, singular, negativeType))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("ы").negC("ма").tenseAffix("йтын").persAffix()
        .example("оқу", new VerbBuilder("оқу").pastTransitiveTense(firstPerson, singular, negativeType))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("й").neg().tenseAffix(null).persAffix()
        .example("сүю", new VerbBuilder("сүю").pastTransitiveTense(firstPerson, singular, negativeType))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("к").negC("пе").tenseAffix("йтін").persAffix()
        .example("кешігу", new VerbBuilder("кешігу").pastTransitiveTense(firstPerson, singular, negativeType))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("п").neg().tenseAffix(null).persAffix()
        .example("жабу", new VerbBuilder("жабу").pastTransitiveTense(firstPerson, singular, negativeType))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("қ").negC("па").tenseAffix("йтын").persAffix()
        .example("шығу", new VerbBuilder("шығу").pastTransitiveTense(firstPerson, singular, negativeType))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("ік").negC("пе").tenseAffix("йтін").persAffix()
        .example("ірку", new VerbBuilder("ірку").pastTransitiveTense(firstPerson, singular, negativeType))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("ық").negC("па").tenseAffix("йтын").persAffix()
        .example("қорқу", new VerbBuilder("қорқу").pastTransitiveTense(firstPerson, singular, negativeType))
        .build());

    let links = [
        new TopicLink("Казахский язык. Просто о сложном", "Переходное прошедшее время глагола", "https://www.kaz-tili.kz/glag11.htm"),
    ];

    return new Cheatsheet(statement, negative, [], links);
}

function buildPossibleFutureCheatsheet() {
    const firstPerson = GRAMMAR_PERSONS[0];
    const singular = GRAMMAR_NUMBERS[0];

    const statementType = SENTENCE_TYPES[0];
    let statement = [];
    statement.push(newFormStructureBuilder()
        .base().tenseAffix("ар").persAffix()
        .example("алу", new VerbBuilder("алу").possibleFutureForm(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().tenseAffix("ер").persAffix()
        .example("беру", new VerbBuilder("беру").possibleFutureForm(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().tenseAffix("р").persAffix()
        .example("қарау", new VerbBuilder("қарау").possibleFutureForm(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().baseExt("і").tenseAffix("р").persAffix()
        .example("есту", new VerbBuilder("есту").possibleFutureForm(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().baseExt("ы").tenseAffix("р").persAffix()
        .example("оқу", new VerbBuilder("оқу").possibleFutureForm(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().baseExt("й").tenseAffix("ер").persAffix()
        .example("сүю", new VerbBuilder("сүю").possibleFutureForm(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().tenseAffix("яр").persAffix()
        .example("шаю", new VerbBuilder("шаю").possibleFutureForm(firstPerson, singular, statementType))
        .build());

    const negativeType = SENTENCE_TYPES[1];
    let negative = [];
    negative.push(newFormStructureBuilder()
        .base().neg().tenseAffix("с").persAffix()
        .example("алу", new VerbBuilder("алу").possibleFutureForm(firstPerson, singular, negativeType))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("і").negC("ме").tenseAffix("с").persAffix()
        .example("есту", new VerbBuilder("есту").possibleFutureForm(firstPerson, singular, negativeType))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("ы").negC("ма").tenseAffix("с").persAffix()
        .example("оқу", new VerbBuilder("оқу").possibleFutureForm(firstPerson, singular, negativeType))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("й").neg().tenseAffix("с").persAffix()
        .example("сүю", new VerbBuilder("сүю").possibleFutureForm(firstPerson, singular, negativeType))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("к").negC("пе").tenseAffix("с").persAffix()
        .example("кешігу", new VerbBuilder("кешігу").possibleFutureForm(firstPerson, singular, negativeType))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("п").neg().tenseAffix("с").persAffix()
        .example("жабу", new VerbBuilder("жабу").possibleFutureForm(firstPerson, singular, negativeType))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("қ").negC("па").tenseAffix("с").persAffix()
        .example("шығу", new VerbBuilder("шығу").possibleFutureForm(firstPerson, singular, negativeType))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("ік").negC("пе").tenseAffix("с").persAffix()
        .example("ірку", new VerbBuilder("ірку").possibleFutureForm(firstPerson, singular, negativeType))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt("ық").negC("па").tenseAffix("с").persAffix()
        .example("қорқу", new VerbBuilder("қорқу").possibleFutureForm(firstPerson, singular, negativeType))
        .build());

    let links = [
        new TopicLink("Казахский язык. Просто о сложном", "Будущее предположительное время глагола", "https://www.kaz-tili.kz/glag7.htm"),
    ];

    return new Cheatsheet(statement, negative, [], links);
}

function buildIntentionFutureCheatsheet() {
    const firstPerson = GRAMMAR_PERSONS[0];
    const singular = GRAMMAR_NUMBERS[0];

    const statementType = SENTENCE_TYPES[0];
    let statement = [];
    statement.push(newFormStructureBuilder()
        .base().tenseAffix("бақ").persAffix()
        .example("жазу", new VerbBuilder("жазу").intentionFutureForm(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().tenseAffix("бек").persAffix()
        .example("үйрену", new VerbBuilder("үйрену").intentionFutureForm(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().tenseAffix("пақ").persAffix()
        .example("айту", new VerbBuilder("айту").intentionFutureForm(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().tenseAffix("пек").persAffix()
        .example("көрсету", new VerbBuilder("көрсету").intentionFutureForm(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().tenseAffix("мақ").persAffix()
        .example("алу", new VerbBuilder("алу").intentionFutureForm(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().tenseAffix("мек").persAffix()
        .example("беру", new VerbBuilder("беру").intentionFutureForm(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().baseExt("і").tenseAffix("мек").persAffix()
        .example("есту", new VerbBuilder("есту").intentionFutureForm(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().baseExt("ы").tenseAffix("мақ").persAffix()
        .example("оқу", new VerbBuilder("оқу").intentionFutureForm(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().baseExt("й").tenseAffix(null).persAffix()
        .example("сүю", new VerbBuilder("сүю").intentionFutureForm(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().baseExt("к").tenseAffix("пек").persAffix()
        .example("кешігу", new VerbBuilder("кешігу").intentionFutureForm(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().baseExt("п").tenseAffix(null).persAffix()
        .example("жабу", new VerbBuilder("жабу").intentionFutureForm(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().baseExt("қ").tenseAffix("пақ").persAffix()
        .example("шығу", new VerbBuilder("шығу").intentionFutureForm(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().baseExt("ік").tenseAffix("пек").persAffix()
        .example("ірку", new VerbBuilder("ірку").intentionFutureForm(firstPerson, singular, statementType))
        .build());
    statement.push(newFormStructureBuilder()
        .base().baseExt("ық").tenseAffix("пақ").persAffix()
        .example("қорқу", new VerbBuilder("қорқу").intentionFutureForm(firstPerson, singular, statementType))
        .build());

    const negativeType = SENTENCE_TYPES[1];
    let negative = [];
    negative.push(newFormStructureBuilder()
        .base().tenseAffix(null).space().negWord("емес").persAffix()
        .example("алу", new VerbBuilder("алу").intentionFutureForm(firstPerson, singular, negativeType))
        .build());
    negative.push(newFormStructureBuilder()
        .base().baseExt(null).tenseAffix(null).space().negWord("емес").persAffix()
        .example("есту", new VerbBuilder("есту").intentionFutureForm(firstPerson, singular, negativeType))
        .build());

    let links = [
        new TopicLink("Казахский язык. Просто о сложном", "Будущее время намерения", "https://www.kaz-tili.kz/glag8.htm"),
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
    } else if (levelKey == "pastUncertain") {
        return buildPastUncertainCheatsheet();
    } else if (levelKey == "pastTransitive") {
        return buildPastTransitive();
    } else if (levelKey == "possibleFuture") {
        return buildPossibleFutureCheatsheet();
    } else if (levelKey == "intentionFuture") {
        return buildIntentionFutureCheatsheet();
    } else {
        console.log(`generateCheatsheetByLevelKey: unsupported level key: ${levelKey}`);
        return null;
    }
}

export {
    generateCheatsheetByLevelKey,
};