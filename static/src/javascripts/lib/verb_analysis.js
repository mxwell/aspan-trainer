import React from 'react';
import {
    PART_EXPLANATION_TYPE,
    PHRASAL_PART_TYPE,
    Phrasal,
} from "./aspan";
import {
    VERB_BASE_COLOR,
    VERB_TENSE_AFFIX_COLOR,
    highlightPhrasal,
    partBackgroundColor,
} from './highlight';
import {
    I18N_LANG_RU,
    i18n
} from './i18n';

export const SPEED_SLOW = 0.8;
export const SPEED_NORMAL = 0.5;
export const SPEED_FAST = 0.2;

class Title {
    constructor(text) {
        this.text = text;
    }
    totalStates() {
        return 1;
    }
    getState(index, htmlParts) {
        htmlParts.push(
            <h2
                className="text-3xl text-gray-600"
                key={`p${htmlParts.length}`}>
                {this.text}
            </h2>
        );
    }
    getSpeed(index) {
        return SPEED_NORMAL;
    }
}

class PlainParagraph {
    constructor(text) {
        this.text = text;
    }
    totalStates() {
        return 1;
    }
    getState(index, htmlParts) {
        htmlParts.push(
            <p
                key={`p${htmlParts.length}`}>
                {this.text}
            </p>
        );
    }
    getSpeed(index) {
        return SPEED_NORMAL;
    }
}

class Progression {
    constructor(states, highlightColor) {
        this.states = states;
        this.highlightColor = highlightColor;
    }
    totalStates() {
        /**
         * Show states one by one and then highlight the last one.
         */
        return this.states.length + 1;
    }
    getState(index, htmlParts) {
        let items = this.states.slice(0, index + 1);
        let spans = [];
        const highlightIndex = (
            (index >= this.states.length)
            ? (this.states.length - 1)
            : -1
        );
        for (let i = 0; i < items.length; ++i) {
            if (i > 0) {
                spans.push(<span key={spans.length}> → </span>);
            }
            const spanClass = (
                (i == highlightIndex)
                ? `text-xl ${this.highlightColor}`
                : ""
            );
            spans.push(
                <span
                    className={spanClass}
                    key={spans.length}>
                    {items[i]}
                </span>
            );
        }
        htmlParts.push(
            <p
                key={`p${htmlParts.length}`}>
                {spans}
            </p>
        );
    }
    getSpeed(index) {
        return SPEED_NORMAL;
    }
}

function findItemInTable(table, item) {
    for (let i = 0; i < table.length; ++i) {
        let row = table[i];
        for (let j = 0; j < row.length; ++j) {
            if (row[j] == item) {
                return i * row.length + j;
            }
        }
    }
    return -1;
}

class VariantsTable {
    constructor(table, highlightPos, highlightColor) {
        this.table = table;
        this.highlightPos = highlightPos;
        this.highlightColor = highlightColor;
    }
    totalStates() {
        /**
         * The first step is to show the whole table.
         * Then iterate through the table and highlight the selected item.
         * Stop at the chosen highlight position.
         */
        return 2 + this.highlightPos;
    }
    getState(index, htmlParts) {
        let highlight = Math.min(this.highlightPos, index - 1);
        let tableRows = [];
        let pos = 0;
        for (let i = 0; i < this.table.length; ++i) {
            let row = this.table[i];
            let cells = [];
            for (let j = 0; j < row.length; ++j) {
                let cellClass = (pos == highlight) ? this.highlightColor : "";
                cells.push(
                    <td
                        className={`p-2 border-2 ${cellClass}`}
                        key={j}>
                        {row[j]}
                    </td>
                );
                pos += 1;
            }
            tableRows.push(<tr key={i}>{cells}</tr>);
        }
        htmlParts.push(
            <table
                key={`t${htmlParts.length}`}>
                <tbody>{tableRows}</tbody>
            </table>
        );
    }
    getSpeed(index) {
        if (0 < index && index < this.highlightPos + 1) {
            return SPEED_FAST;
        }
        return SPEED_NORMAL;
    }
}

class PhrasalExplanation {
    constructor(phrasal) {
        this.phrasal = phrasal;
        /* parts is a list of lists of Paragraphs, where each Paragraph has a number of states */
        this.parts = [];
    }
    addPart() {
        this.parts.push([]);
    }
    addParagraph(part) {
        console.log(`Adding part of type: ${typeof part}`);
        console.log(`with states ${part.totalStates()}`);
        this.parts[this.parts.length - 1].push(part);
    }
    addTitle(text) {
        this.addParagraph(new Title(text));
    }
    addPlainParagraph(text) {
        this.addParagraph(new PlainParagraph(text));
    }
    addProgression(states, highlightColor) {
        if (!highlightColor) {
            throw new Error("highlightColor is required for Progression");
        }
        this.addParagraph(new Progression(states, highlightColor));
    }
    addVariantsTable(table, highlight, highlightColor) {
        let highlightPos = findItemInTable(table, highlight);
        this.addParagraph(new VariantsTable(table, highlightPos, highlightColor));
    }
}

export class PhrasalAnimationState {
    constructor() {
        this.partIndex = 0;
        this.paragraphIndex = 0;
        this.stateIndex = 0;
    }
    nextPart(explanation) {
        this.partIndex += 1;
        this.paragraphIndex = 0;
        this.stateIndex = 0;
        if (this.partIndex >= explanation.parts.length) {
            return null;
        }
        return this;
    }
    nextParagraph(explanation) {
        this.paragraphIndex += 1;
        this.stateIndex = 0;
        if (this.paragraphIndex >= explanation.parts[this.partIndex].length) {
            return this.nextPart(explanation);
        }
        return this;
    }
    valid(explanation) {
        return this.partIndex < explanation.parts.length;
    }
    advance(explanation) {
        if (this.partIndex >= explanation.parts.length) {
            return null;
        }
        let paragraphs = explanation.parts[this.partIndex];
        if (this.paragraphIndex >= paragraphs.length) {
            return this.nextPart(explanation);
        }
        let paragraph = paragraphs[this.paragraphIndex];
        if (this.stateIndex >= paragraph.totalStates()) {
            return this.nextParagraph(explanation);
        }
        this.stateIndex += 1;
        if (this.stateIndex >= paragraph.totalStates()) {
            return this.nextParagraph(explanation);
        }
        return this;
    }
    getSpeed(explanation) {
        if (!this.valid(explanation)) {
            return SPEED_NORMAL;
        }
        let paragraphs = explanation.parts[this.partIndex];
        if (this.paragraphIndex >= paragraphs.length) {
            return SPEED_NORMAL;
        }
        let paragraph = paragraphs[this.paragraphIndex];
        return paragraph.getSpeed(this.stateIndex);
    }
}

function makeFinalState(explanation) {
    let state = new PhrasalAnimationState();
    state.partIndex = explanation.parts.length - 1;
    const paragraphs = explanation.parts[state.partIndex];
    state.paragraphIndex = paragraphs.length - 1;
    const paragraph = paragraphs[state.paragraphIndex];
    state.stateIndex = paragraph.totalStates() - 1;
    return state;
}

export function makeAnimationState(explanation, animationFlag) {
    if (explanation == null) {
        return null;
    }
    if (animationFlag) {
        return new PhrasalAnimationState();
    }
    return makeFinalState(explanation);
}

export function renderPhrasalExplanation(explanation, state) {
    let htmlParts = [];
    const partsCount = explanation.parts.length;
    const shownParts = Math.min(state.partIndex + 1, partsCount);
    let complete = false;
    for (let partIndex = 0; partIndex < shownParts; ++partIndex) {
        let htmlParagraphs = [];
        const paragraphsCount = explanation.parts[partIndex].length;
        let shownParagraphs = (partIndex < state.partIndex) ? paragraphsCount : (state.paragraphIndex + 1);
        for (let paragraphIndex = 0; paragraphIndex < shownParagraphs; ++paragraphIndex) {
            // console.log(`render part ${partIndex}/${explanation.phrasal.parts.length}, paragraph ${paragraphIndex}`);
            let paragraph = explanation.parts[partIndex][paragraphIndex];
            let stateIndex = (
                (partIndex < state.partIndex || paragraphIndex + 1 < shownParagraphs)
                ? (paragraph.totalStates() - 1)
                : state.stateIndex
            );
            // console.log(`render part ${partIndex}, paragraph ${paragraphIndex}, state ${stateIndex}`);
            paragraph.getState(stateIndex, htmlParagraphs);
            if (partIndex + 1 == partsCount && paragraphIndex + 1 == paragraphsCount && stateIndex + 1 == paragraph.totalStates()) {
                complete = true;
            }
        }
        let blockClasses = ["m-4", "p-4", "rounded-2xl"];
        blockClasses.push(partBackgroundColor(explanation.phrasal.parts[partIndex].partType));
        htmlParts.push(
            <div
                className={blockClasses.join(" ")}
                key={htmlParts.length}
                >
                {htmlParagraphs}
            </div>
        );
    }
    let highlightShownParts = -1;
    let phrasalContinuation = null;
    if (!complete) {
        highlightShownParts = shownParts - 1;
        phrasalContinuation = <span>...</span>;
        htmlParts.push(
            <p
                className="text-center"
                key={`p${htmlParts.length}`}>
                ...
            </p>
        );

    }
    return (
        <div>
            <h2 className="text-5xl text-center">
                {highlightPhrasal(explanation.phrasal, highlightShownParts)}
                {phrasalContinuation}
            </h2>
            {htmlParts}
        </div>
    );
}

function buildVerbBaseExplanation(verbDictForm, part, explanation) {
    let lang = I18N_LANG_RU;
    let meta = part.explanation;
    if (meta == null) {
        return;
    }
    const explanationType = meta.explanationType;
    if (explanationType == null || explanationType.length == 0) {
        return;
    }
    const base = part.content;
    console.log(`explaining base: expl type ${explanationType}`)
    explanation.addPart();
    explanation.addTitle(i18n("title_base", lang));
    if (explanationType == PART_EXPLANATION_TYPE.VerbBaseStripU) {
        const items = [verbDictForm, base];
        explanation.addProgression(items, VERB_BASE_COLOR);
        explanation.addPlainParagraph(i18n("base_strip_u", lang));
    } else if (explanationType == PART_EXPLANATION_TYPE.VerbBaseLostIShort) {
        let loss = "й";
        const items = [verbDictForm, `${base}${loss}`, base];
        explanation.addProgression(items, VERB_BASE_COLOR);
        const text = i18n("base_loss_templ", lang)(loss);
        explanation.addPlainParagraph(text);
    } else if (explanationType == PART_EXPLANATION_TYPE.VerbBaseLostY) {
        let loss = meta.soft ? "і" : "ы";
        const items = [verbDictForm, `${base}${loss}`, base];
        explanation.addProgression(items, VERB_BASE_COLOR);
        const text = i18n("base_loss_templ", lang)(loss);
        explanation.addPlainParagraph(text);
    } else if (explanationType == PART_EXPLANATION_TYPE.VerbBaseGainedY) {
        let gain = meta.soft ? "і" : "ы";
        const items = [verbDictForm, base];
        explanation.addProgression(items, VERB_BASE_COLOR);
        const text = i18n("base_gain_templ", lang)(gain);
        explanation.addPlainParagraph(text);
    } else if (explanationType == PART_EXPLANATION_TYPE.VerbBaseGainedIShort) {
        let gain = "й";
        const items = [verbDictForm, base];
        explanation.addProgression(items, VERB_BASE_COLOR);
        const text = i18n("base_gain_templ", lang)(gain);
        explanation.addPlainParagraph(text);
    } else if (explanationType == PART_EXPLANATION_TYPE.VerbBaseGainIShortLoseY) {
        let gain1 = "й";
        let gain2 = meta.soft ? "і" : "ы";
        explanation.addProgression([verbDictForm, `${base}${gain2}`, base], VERB_BASE_COLOR);
        explanation.addPlainParagraph(i18n("base_gain_and_loss_templ", lang)(`${gain1}${gain2}`, gain2));
    } else if (explanationType == PART_EXPLANATION_TYPE.VerbBaseGainedIShortY) {
        let gain = meta.soft ? "йі" : "йы";
        const items = [verbDictForm, base];
        explanation.addProgression(items, VERB_BASE_COLOR);
        const text = i18n("base_gain_templ", lang)(gain);
        explanation.addPlainParagraph(text);
    } else if (explanationType == PART_EXPLANATION_TYPE.VerbBaseGainedYInsidePriorCons) {
        let gain = meta.soft ? "і" : "ы";
        const items = [verbDictForm, base];
        explanation.addProgression(items, VERB_BASE_COLOR);
        const text = i18n("base_gain_inside_templ", lang)(gain);
        explanation.addPlainParagraph(text);
    } else if (explanationType == PART_EXPLANATION_TYPE.VerbBaseReplaceB2U) {
        const items = [verbDictForm, base];
        explanation.addProgression(items, VERB_BASE_COLOR);
        const text = i18n("base_replace_b_to_u", lang);
        explanation.addPlainParagraph(text);
    } else if (explanationType == PART_EXPLANATION_TYPE.VerbBaseReplaceLastCons) {
        const items = [verbDictForm, base];
        explanation.addProgression(items, VERB_BASE_COLOR);
        const text = i18n("base_replace_last_cons", lang);
        explanation.addPlainParagraph(text);
    }
}

const NEGATION_OR_QUESTION_PARTICLES = [
    ["ба", "ма", "па"],
    ["бе", "ме", "пе"],
];

function buildVerbNegationExplanation(part, explanation) {
    let lang = I18N_LANG_RU;
    let meta = part.explanation;
    if (meta == null) {
        return;
    }
    const explanationType = meta.explanationType;
    if (explanationType == null || explanationType.length == 0) {
        return;
    }
    const negation = part.content;
    console.log(`explaining negation: expl type ${explanationType}`);
    explanation.addPart();
    explanation.addTitle(i18n("title_negation_particle", lang));
    if (explanationType == PART_EXPLANATION_TYPE.VerbNegationPostBase) {
        explanation.addVariantsTable(NEGATION_OR_QUESTION_PARTICLES, negation, "underline text-red-600");
    }
}

const PRES_TRANSITIVE_AFFIXES = [["а", "е", "й"]];

function buildVerbTenseAffixExplanation(part, explanation) {
    let lang = I18N_LANG_RU;
    let meta = part.explanation;
    if (meta == null) {
        return;
    }
    const explanationType = meta.explanationType;
    if (explanationType == null || explanationType.length == 0) {
        return;
    }
    const affix = part.content;
    console.log(`explaining tense affix: expl type ${explanationType}`);
    explanation.addPart();
    explanation.addTitle(i18n("title_tense_affix", lang));
    const highlightColor = "underline text-orange-600";
    if (explanationType == PART_EXPLANATION_TYPE.VerbTenseAffixPresentTransitive) {
        explanation.addVariantsTable(PRES_TRANSITIVE_AFFIXES, affix, highlightColor);
    } else if (explanationType == PART_EXPLANATION_TYPE.VerbTenseAffixPresentTransitiveToYa) {
        explanation.addVariantsTable(PRES_TRANSITIVE_AFFIXES, "а", highlightColor);
        explanation.addPlainParagraph(i18n("affix_merge_with_base", lang));
        explanation.addProgression(["а", affix], VERB_TENSE_AFFIX_COLOR);
    } else if (explanationType == PART_EXPLANATION_TYPE.VerbTenseAffixPresentTransitiveToYi) {
        explanation.addVariantsTable(PRES_TRANSITIVE_AFFIXES, "й", highlightColor);
        explanation.addPlainParagraph(i18n("affix_merge_with_base", lang));
        explanation.addProgression(["й", affix], VERB_TENSE_AFFIX_COLOR);
    }
}

const PERS_AFFIXES = [
    ["мын", "мыз", "сың", "сыңдар", "сыз", "сыздар", "ды"],
    ["мін", "міз", "сің", "сіңдер", "сіз", "сіздер", "ді"],
];

function buildVerbPersonalAffixExplanation(part, explanation) {
    let lang = I18N_LANG_RU;
    let meta = part.explanation;
    if (meta == null) {
        return;
    }
    const explanationType = meta.explanationType;
    if (explanationType == null || explanationType.length == 0) {
        return;
    }
    const affix = part.content;
    console.log(`explaining pers affix: expl type ${explanationType}`);
    explanation.addPart();
    explanation.addTitle(i18n("title_pers_affix", lang));
    if (explanationType == PART_EXPLANATION_TYPE.VerbPersonalAffixPresentTransitive) {
        explanation.addVariantsTable(PERS_AFFIXES, affix, "underline text-indigo-600");
    } else if (explanationType == PART_EXPLANATION_TYPE.VerbPersonalAffixPresentTransitiveQuestionSkip) {
        explanation.addPlainParagraph(i18n("pers_affix_question_skip", lang));
    }
}

function buildQuestionParticleExplanation(part, explanation) {
    let lang = I18N_LANG_RU;
    let meta = part.explanation;
    if (meta == null) {
        return;
    }
    const explanationType = meta.explanationType;
    if (explanationType == null || explanationType.length == 0) {
        return;
    }
    const particle = part.content;
    console.log(`explaining question particle: expl type ${explanationType}`);
    explanation.addPart();
    explanation.addTitle(i18n("title_question_particle", lang));
    explanation.addVariantsTable(NEGATION_OR_QUESTION_PARTICLES, particle, "underline");
}

export function buildVerbPhrasalExplanation(verbDictForm, phrasal) {
    let explanation = new PhrasalExplanation(phrasal);
    let parts = phrasal.parts;
    for (let i = 0; i < parts.length; ++i) {
        let part = parts[i];
        let pt = part.partType;
        console.log(`explaining: i ${i}, pt ${pt}`);
        if (pt == PHRASAL_PART_TYPE.VerbBase) {
            buildVerbBaseExplanation(verbDictForm, part, explanation);
        } else if (pt == PHRASAL_PART_TYPE.VerbNegation) {
            buildVerbNegationExplanation(part, explanation);
        } else if (pt == PHRASAL_PART_TYPE.VerbTenseAffix) {
            buildVerbTenseAffixExplanation(part, explanation);
        } else if (pt == PHRASAL_PART_TYPE.VerbPersonalAffix) {
            buildVerbPersonalAffixExplanation(part, explanation);
        } else if (pt == PHRASAL_PART_TYPE.QuestionParticle) {
            buildQuestionParticleExplanation(part, explanation);
        }
    }
    return explanation;
}