import { NounBuilder, PronounBuilder, VerbBuilder } from "./aspan";
import { unpackDetectResponseWithPos } from "./detector";
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

/**
 * @returns array of AnalyzedPart
 */
function parseAnalyzeResponse(responseJson) {
    const parts = responseJson.parts;
    let result = [];
    for (const part of parts) {
        let detectedForms = unpackDetectResponseWithPos(part.forms);
        result.push(new AnalyzedPart(part.text, detectedForms));
    }
    return result;
}

function reproduceNoun(dw) {
    let nb = new NounBuilder(dw.base);
    if (dw.possPerson != null && dw.possNumber != null) {
        if (dw.grammarNumber == "Plural") {
            return nb.pluralPossessiveSeptikForm(dw.possPerson, dw.possNumber, dw.septik);
        } else {
            return nb.possessiveSeptikForm(dw.possPerson, dw.possNumber, dw.septik);
        }
    }
    if (dw.grammarNumber == "Plural") {
        return nb.pluralSeptikForm(dw.septik);
    }
    if (dw.wordgen == "dagy") {
        return nb.relatedAdj();
    }
    return nb.septikForm(dw.septik);
}

function reproducePronoun(dw) {
    if (dw.septik != null) {
        let pb = new PronounBuilder(dw.grammarPerson, dw.grammarNumber);
        return pb.septikForm(dw.septik);
    }
    return null;
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
    parseAnalyzeResponse,
    reproduceNoun,
    reproducePronoun,
    reproduceVerb,
};