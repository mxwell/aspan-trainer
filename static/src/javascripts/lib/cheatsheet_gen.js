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

function generateCheatsheetByLevelKey(levelKey) {
    if (levelKey == "presentTransitive") {
        return buildPresentTransitiveCheatsheet();
    } else {
        throw new Error(`generateCheatsheetByLevelKey: unsupported level key: ${levelKey}`);
    }
}

export {
    generateCheatsheetByLevelKey,
};