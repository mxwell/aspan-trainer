import {
    PART_EXPLANATION_TYPE,
    PHRASAL_PART_TYPE,
} from "./aspan";

export const PARAGRAPH_PLAIN = "PARAGRAPH_PLAIN";
export const PARAGRAPH_TITLE = "PARAGRAPH_TITLE";
export const PARAGRAPH_CODE = "PARAGRAPH_CODE";
export const PARAGRAPH_SELECT = "PARAGRAPH_SELECT";
export const PARAGRAPH_PROGRESSION = "PARAGRAPH_PROGRESSION";

class ExplanationParagraph {
    /**
     * Provide 'item' if the paragraph contains only a single string.
     * Or provide 'items' if the paragraph includes many strings.
     *
     * Provide only one of them and leave another 'null'.
     */
    constructor(paragraphType, item, items) {
        this.paragraphType = paragraphType;
        this.item = item;
        this.items = items;
    }
}

function buildPlain(text) {
    return new ExplanationParagraph(PARAGRAPH_PLAIN, text, null);
}

function buildTitle(text) {
    return new ExplanationParagraph(PARAGRAPH_TITLE, text, null);
}

function buildProgression(items) {
    return new ExplanationParagraph(PARAGRAPH_PROGRESSION, null, items);
}

function explainVerbBase(verbDictForm, part, output) {
    let explanation = part.explanation;
    if (explanation == null) {
        return;
    }
    const explanationType = explanation.explanationType;
    const base = part.content;
    console.log(`explaining base: expl type ${explanationType}`)
    if (explanationType == PART_EXPLANATION_TYPE.VerbBaseStripU) {
        output.push(buildTitle("Основа"));
        output.push(buildProgression([verbDictForm, base]));
    } else if (explanationType == PART_EXPLANATION_TYPE.VerbBaseLostIShort) {
        output.push(buildTitle("Основа"));
        let lost = "й";
        output.push(buildProgression([verbDictForm, `${base}${lost}`, base]));
        output.push(buildPlain(`Основа теряет '${lost}' из-за слияния с аффиксом`));
    } else if (explanationType == PART_EXPLANATION_TYPE.VerbBaseLostY) {
        output.push(buildTitle("Основа"));
        let lost = explanation.soft ? "і" : "ы";
        output.push(buildProgression([verbDictForm, `${base}${lost}`, base]));
        output.push(buildPlain(`Основа теряет '${lost}' из-за слияния с аффиксом`));
    }
}

export function explainVerbPhrasal(verbDictForm, phrasal) {
    let output = [];
    let parts = phrasal.parts;
    console.log(`explaining ${parts.length} parts`);
    for (let i = 0; i < parts.length; ++i) {
        let part = parts[i];
        let pt = part.partType;
        console.log(`explaining: i ${i}, pt ${pt}`);
        if (pt == PHRASAL_PART_TYPE.VerbBase) {
            explainVerbBase(verbDictForm, part, output);
        }
    }
    return output;
}