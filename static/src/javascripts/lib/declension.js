import { GRAMMAR_NUMBERS, GRAMMAR_PERSONS, NounBuilder, SEPTIKS } from "./aspan";

class DeclensionForm {
    constructor(septik, phrasal) {
        this.septik = septik;
        this.phrasal = phrasal;
    }
}

class DeclensionTable {
    constructor(tableNameKey, groupNameKey, forms) {
        if (!(typeof groupNameKey == "string")) {
            throw Error("unexpected type of groupNameKey: " + typeof groupNameKey);
        }
        this.tableNameKey = tableNameKey;
        this.groupNameKey = groupNameKey;
        this.forms = forms;
    }
}

function createForms(tableNameKey, groupNameKey, septikFn) {
    let forms = [];
    for (const septik in SEPTIKS) {
        const phrasal = septikFn(septik);
        forms.push(new DeclensionForm(septik, phrasal));
    }
    return new DeclensionTable(tableNameKey, groupNameKey, forms);
}

export function generateDeclensionTables(subject) {
    let tables = [];
    let nounBuilder = new NounBuilder(subject);
    tables.push(createForms(
        "singularSubject",
        "",
        septik => nounBuilder.septikForm(septik),
    ));
    tables.push(createForms(
        "pluralSubject",
        "",
        septik => nounBuilder.pluralSeptikForm(septik),
    ));
    for (const person of GRAMMAR_PERSONS) {
        for (const number of GRAMMAR_NUMBERS) {
            tables.push(createForms(
                `possessive_${number}`,
                `possessive_${person}`,
                septik => nounBuilder.possessiveSeptikForm(person, number, septik),
            ));
        }
    }
    return tables;
}