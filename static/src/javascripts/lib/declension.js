import { GRAMMAR_PERSONS, NounBuilder, SEPTIKS, getDeclAltInfo } from "./aspan";

export function declensionAlternativeInfo(subject) {
    return getDeclAltInfo(subject);
}

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

function extractPhrasal(phrasal, forceAlternative) {
    if (forceAlternative && phrasal.alternative != null) {
        return phrasal.alternative;
    }
    return phrasal;
}

function createForms(tableNameKey, groupNameKey, icons, forceAlternative, septikFn) {
    let forms = [];
    for (const septik in SEPTIKS) {
        const origPhrasal = septikFn(septik);
        const phrasal = extractPhrasal(origPhrasal, forceAlternative);
        forms.push(new DeclensionForm(septik, phrasal));
    }
    return new DeclensionTable(tableNameKey, groupNameKey, icons, forms);
}

export function generateDeclensionTables(subject, forceAlternative) {
    let tables = [];
    let nounBuilder = new NounBuilder(subject);
    tables.push(createForms(
        "singularSubject",
        "",
        null,
        forceAlternative,
        septik => nounBuilder.septikForm(septik),
    ));
    tables.push(createForms(
        "pluralSubject",
        "",
        null,
        forceAlternative,
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
        forceAlternative,
        septik => nounBuilder.possessiveSeptikForm("First", "Singular", septik),
    ));
    tables.push(createForms(
        null,
        firstPossGroup,
        [ic2],
        forceAlternative,
        septik => nounBuilder.pluralPossessiveSeptikForm("First", "Singular", septik),
    ));
    tables.push(createForms(
        null,
        firstPossGroup,
        [ic3],
        forceAlternative,
        septik => nounBuilder.possessiveSeptikForm("First", "Plural", septik),
    ));
    tables.push(createForms(
        null,
        firstPossGroup,
        [ic4],
        forceAlternative,
        septik => nounBuilder.pluralPossessiveSeptikForm("First", "Plural", septik),
    ));

    for (const person of GRAMMAR_PERSONS) {
        if (person == "First") continue;

        const groupNameKey = `possessive_${person}`;
        tables.push(createForms(
            null,
            groupNameKey,
            [ic1],
            forceAlternative,
            septik => nounBuilder.possessiveSeptikForm(person, "Singular", septik),
        ));
        tables.push(createForms(
            null,
            groupNameKey,
            [ic2, ic3, ic4],
            forceAlternative,
            septik => nounBuilder.pluralPossessiveSeptikForm(person, "Plural", septik),
        ));
    }
    return tables;
}