import { GRAMMAR_NUMBERS, GRAMMAR_PERSONS, NounBuilder, SEPTIKS } from "./aspan";

class DeclensionForm {
    constructor(septik, phrasal) {
        this.septik = septik;
        this.phrasal = phrasal;
    }
}

class DeclensionTable {
    constructor(tableNameKey, groupNameKey, icons, forms) {
        if (!(typeof groupNameKey == "string")) {
            throw Error("unexpected type of groupNameKey: " + typeof groupNameKey);
        }
        this.tableNameKey = tableNameKey;
        this.groupNameKey = groupNameKey;
        this.icons = icons;
        this.forms = forms;
    }
}

function createForms(tableNameKey, groupNameKey, icons, septikFn) {
    let forms = [];
    for (const septik in SEPTIKS) {
        const phrasal = septikFn(septik);
        forms.push(new DeclensionForm(septik, phrasal));
    }
    return new DeclensionTable(tableNameKey, groupNameKey, icons, forms);
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
    const ic1 = "/one_to_one.png";
    const ic2 = "/one_to_many.png";
    const ic3 = "/many_to_one.png";
    const ic4 = "/many_to_many.png";

    const firstPossGroup = "possessive_First";
    tables.push(createForms(
        null,
        firstPossGroup,
        [ic1],
        septik => nounBuilder.possessiveSeptikForm("First", "Singular", septik),
    ));
    tables.push(createForms(
        null,
        firstPossGroup,
        [ic2],
        septik => nounBuilder.pluralPossessiveSeptikForm("First", "Singular", septik),
    ));
    tables.push(createForms(
        null,
        firstPossGroup,
        [ic3],
        septik => nounBuilder.possessiveSeptikForm("First", "Plural", septik),
    ));
    tables.push(createForms(
        null,
        firstPossGroup,
        [ic4],
        septik => nounBuilder.pluralPossessiveSeptikForm("First", "Plural", septik),
    ));

    for (const person of GRAMMAR_PERSONS) {
        if (person == "First") continue;

        const groupNameKey = `possessive_${person}`;
        tables.push(createForms(
            null,
            groupNameKey,
            [ic1],
            septik => nounBuilder.possessiveSeptikForm(person, "Singular", septik),
        ));
        tables.push(createForms(
            null,
            groupNameKey,
            [ic2, ic3, ic4],
            septik => nounBuilder.pluralPossessiveSeptikForm(person, "Plural", septik),
        ));
    }
    return tables;
}