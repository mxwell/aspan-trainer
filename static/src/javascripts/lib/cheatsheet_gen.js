import { Cheatsheet, newFormStructureBuilder } from "./cheatsheet";

function buildPresentTransitiveCheatsheet() {
    let statement = [];
    // TODO add examples
    statement.push(newFormStructureBuilder().base().tenseAffix("а").persAffix().build());
    statement.push(newFormStructureBuilder().base().tenseAffix("е").persAffix().build());
    statement.push(newFormStructureBuilder().base().tenseAffix("й").persAffix().build());
    // TODO add more structures

    let negative = [];
    negative.push(newFormStructureBuilder().base().neg().tenseAffix("й").persAffix().build());
    // TODO add more structures

    let question = [];
    question.push(newFormStructureBuilder().base().tenseAffix("а").persAffix().space().q().qM().build());
    // TODO add more structures

    // TODO add links
    let links = [];

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