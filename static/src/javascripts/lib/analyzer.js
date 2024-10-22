import { NounBuilder, VerbBuilder } from "./aspan";
import { PersonNumber } from "./grammar_utils";
import { createFormByParams } from "./verb_forms";

class Token {
    constructor(content, isWord) {
        this.content = content;
        this.isWord = isWord;
    }
}

function tokenize(input) {
    const regex = /[А-Яа-я-ЁӘІҢҒҮҰҚӨҺёәіңғүұқөһ]+/g;
    const tokens = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(input)) !== null) {
        if (match.index > lastIndex) {
            const content = input.slice(lastIndex, match.index);
            tokens.push(new Token(content, false));
        }
        tokens.push(new Token(match[0], true));
        lastIndex = regex.lastIndex;
    }

    if (lastIndex < input.length) {
        tokens.push(new Token(input.slice(lastIndex), false));
    }
    /*
    console.log(`tokenized into ${tokens.length} tokens`);
    for (const t of tokens) {
        const label = t.isWord ? "word: " : "";
        console.log(`- ${label}[${t.content}]`)
    }
    */
    return tokens;
}

class AnalyzedPart {
    constructor(token, detectedForms) {
        this.token = token;
        this.detectedForms = detectedForms;
    }
}

function reproduceNoun(dw) {
    let nb = new NounBuilder(dw.base);
    if (dw.grammarPerson) {
        return nb.possessiveSeptikForm(
            dw.grammarPerson,
            dw.grammarNumber,
            dw.septik
        );
    }
    if (dw.grammarNumber == "Plural") {
        return nb.pluralSeptikForm(dw.septik);
    }
    return nb.septikForm(dw.septik);
}

function reproduceVerb(dw) {
    let vb = new VerbBuilder(dw.base, dw.excVerb);
    const st = dw.sentenceType;
    if (dw.tense == "pastParticiple") {
        return vb.pastParticiple(st);
    } else if (dw.tense == "presentParticiple") {
        return vb.presentParticiple(st);
    } else if (dw.tense == "futureParticiple") {
        return vb.futureParticiple(st);
    } else if (dw.tense == "perfectGerund") {
        return vb.perfectGerund(st);
    } else if (dw.tense == "continuousGerund") {
        return vb.continuousGerund(st);
    } else if (dw.tense == "intentionGerund") {
        return vb.intentionGerund(st);
    }

    const personNumber = new PersonNumber(dw.grammarPerson, dw.grammarNumber, null);
    return createFormByParams(
        dw.base,
        dw.excVerb,
        st,
        dw.tense,
        personNumber
    );
}

export {
    tokenize,
    AnalyzedPart,
    reproduceNoun,
    reproduceVerb,
};