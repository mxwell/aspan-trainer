import { GRAMMAR_NUMBERS, GRAMMAR_PERSONS, NounBuilder, SEPTIKS } from "./aspan";

class DeclensionForm {
    constructor(septik, phrasal) {
        this.septik = septik;
        this.phrasal = phrasal;
    }
}

class DeclensionTable {
    constructor(tableNameKey, groupNameKey, icon, forms) {
        if (!(typeof groupNameKey == "string")) {
            throw Error("unexpected type of groupNameKey: " + typeof groupNameKey);
        }
        this.tableNameKey = tableNameKey;
        this.groupNameKey = groupNameKey;
        this.icon = icon;
        this.forms = forms;
    }
}

function createForms(tableNameKey, groupNameKey, icon, septikFn) {
    let forms = [];
    for (const septik in SEPTIKS) {
        const phrasal = septikFn(septik);
        forms.push(new DeclensionForm(septik, phrasal));
    }
    return new DeclensionTable(tableNameKey, groupNameKey, icon, forms);
}

export function generateDeclensionTables(subject) {
    let tables = [];
    let nounBuilder = new NounBuilder(subject);
    tables.push(createForms(
        "singularSubject",
        "",
        null,
        septik => nounBuilder.septikForm(septik),
    ));
    tables.push(createForms(
        "pluralSubject",
        "",
        null,
        septik => nounBuilder.pluralSeptikForm(septik),
    ));
    for (const person of GRAMMAR_PERSONS) {
        for (const number of GRAMMAR_NUMBERS) {
            const icon = (
                number == "Singular"
                ? "/one_to_one.png"
                : "/many_to_one.png"
            );
            tables.push(createForms(
                null,
                `possessive_${person}`,
                icon,
                septik => nounBuilder.possessiveSeptikForm(person, number, septik),
            ));
        }
    }
    return tables;
}