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
                className="text-center text-4xl lg:text-xl text-gray-800"
                key={htmlParts.length}>
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
                key={`p${htmlParts.length}`}
                className="text-2xl lg:text-base">
                {this.text}
            </p>
        );
    }
    getSpeed(index) {
        return SPEED_NORMAL;
    }
}

class Progression {
    constructor(states, highlightColors) {
        this.states = states;
        this.highlightColors = highlightColors;
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
                spans.push(<span key={spans.length} className="text-2xl lg:text-base"> → </span>);
            }
            const toHighlight = i == highlightIndex;
            for (let j = 0; j < items[i].length; ++j) {
                const spanClass = (
                    toHighlight
                    ? `text-3xl lg:text-xl ${this.highlightColors[j]}`
                    : "text-2xl lg:text-base"
                );
                spans.push(
                    <span
                        className={spanClass}
                        key={spans.length}>
                        {items[i][j]}
                    </span>
                );
            }
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

function findItemInAnnotatedTable(table, item) {
    for (let i = 0; i < table.length; ++i) {
        let row = table[i];
        if (row.length != 2) {
            throw new Error("Annotated table row must have 2 items");
        }
        if (row[1] == item) {
            return i;
        }
    }
    return -1;
}

/**
 * A table of the following structure:
 *
 * | Annotation 1 | variant_1 |
 * | Annotation 2 | variant_2 |
 */
class AnnotatedVariantsTable {
    constructor(table, lang, highlightRow, highlightColor) {
        this.table = table;
        this.lang = lang;
        this.highlightRow = highlightRow;
        this.highlightColor = highlightColor;
    }
    totalStates() {
        return this.table.length + this.highlightRow + 1;
    }
    getState(index, htmlParts) {
        const rowsToShow = Math.min(this.table.length, index + 1);
        let tableRows = [];
        const highlightRow = index - this.table.length;
        for (let i = 0; i < rowsToShow; ++i) {
            let row = this.table[i];
            let rowClass = (i == highlightRow) ? "text-black" : "text-gray-600";
            let cellClass = (i == highlightRow) ? this.highlightColor : "";
            tableRows.push(
                <tr
                    className={rowClass}
                    key={tableRows.length}>
                    <td
                        className="px-1 lg:px-6 py-1 border-2 border-gray-600">
                        {i18n(row[0], this.lang)}
                    </td>
                    <td
                        className={`px-2 lg:px-6 py-1 border-2 border-gray-600 ${cellClass}`}>
                        {row[1]}
                    </td>
                </tr>
            );
        }
        htmlParts.push(
            <table
                className="my-2 bg-white text-2xl lg:text-base"
                key={`t${htmlParts.length}`}>
                <tbody>{tableRows}</tbody>
            </table>
        );
    }
    getSpeed(index) {
        if (index > this.table.length) {
            return SPEED_FAST;
        }
        return SPEED_NORMAL;
    }
}

/**
 * Table layout adapted for mobile:
 *
 *  Table annotation 0
 *  | column annotation 0 | column annotation 1 |
 *  | variant_0_0         | variant_0_1         |
 *
 *  Table annotation 1
 *  | column annotation 0 | column annotation 1 |
 *  | variant_1_0         | variant_1_1         |
 */
class AnnotatedSplitTable {
    constructor(annotations, tables, lang, i18nTopRow, highlightTable, highlightColumn, highlightColor) {
        if (annotations.length != tables.length) {
            throw new Error(`Number of annotations must be equal to the number of tables: ${annotations.length} != ${tables.length}`);
        }
        if (highlightTable < 0 || highlightTable >= tables.length) {
            throw new Error(`highlightTable must be a valid index: ${highlightTable}`);
        }
        if (highlightColumn < 0 || highlightColumn >= tables[highlightTable][1].length) {
            throw new Error(`highlightColumn must be a valid index: ${highlightColumn}`);
        }

        this.annotations = annotations;
        this.tables = tables;
        this.lang = lang;
        this.i18nTopRow = i18nTopRow;
        this.highlightTable = highlightTable;
        this.highlightColumn = highlightColumn;
        this.highlightColor = highlightColor;

        let totalRows = 0;
        for (let i = 0; i < tables.length; ++i) {
            totalRows += tables[i].length;
        }
        this.totalRows = totalRows;

        this.preColumnSteps = this.tables.length + this.totalRows + this.highlightTable + 1;
    }
    totalStates() {
        return this.annotations.length + this.totalRows + (1 + this.highlightTable) + (1 + this.highlightColumn);
    }
    getState(index, htmlParts) {
        /**
         * Example sequence:
         *
         * 0 - table annotation 0
         * 1 - annotation row of table 0
         * 2 - variant row of table 0
         * 3 - table annotation 1
         * 4 - annotation row of table 1
         * 5 - variant row of table 1
         * 6 - highlight table annotation 0
         * 7 - highlight table annotation 1 (matches highlightTable => keep highlighted)
         * 8 - highlight column 0
         * 9 - highlight column 1 (matches highlightColumn => keep highlighted)
         */
        const T = this.tables.length;
        const TR = this.totalRows;
        const HT = this.highlightTable;
        const HC = this.highlightColumn;
        const highlightTable = (
            (index < T + TR)
            ? -1
            : (
                (index < T + TR + HT)
                ? (index - T - TR)
                : HT
            )
        );
        const highlightColumn = (
            (index < this.preColumnSteps)
            ? -1
            : (
                (index < this.preColumnSteps + HC)
                ? (index - this.preColumnSteps)
                : HC
            )
        );
        let drawnRows = 0;
        for (let t = 0; t < T; ++t) {
            if (drawnRows < index) {
                let annotationClass = (
                    t == highlightTable
                    ? "text-black"
                    : "text-gray-600"
                );
                htmlParts.push(
                    <h3
                        key={htmlParts.length}
                        className={`text-2xl lg:text-base ${annotationClass}`}>
                        {i18n(this.annotations[t], this.lang)}
                    </h3>
                );
                drawnRows += 1;
            } else {
                break;
            }
            const rowsToShow = Math.min(this.tables[t].length, index - drawnRows + 1);
            const table = this.tables[t];
            let tableRows = [];
            for (let i = 0; i < rowsToShow; ++i) {
                let row = table[i];
                let cells = [];
                for (let j = 0; j < row.length; ++j) {
                    let cellClass = "text-gray-600";
                    let cellText = row[j];
                    if (t == highlightTable && j == highlightColumn) {
                        if (i == 0) {
                            cellClass = "text-black";
                        } else {
                            cellClass = this.highlightColor;
                        }
                    }
                    if (i == 0 && this.i18nTopRow) {
                        cellText = i18n(cellText, this.lang);
                    }
                    cells.push(
                        <td
                            className={`px-1 lg:px-6 py-1 border-2 border-gray-600 ${cellClass}`}
                            key={cells.length}>
                            {cellText}
                        </td>
                    );
                }
                tableRows.push(
                    <tr
                        key={tableRows.length}>
                        {cells}
                    </tr>
                );
            }
            htmlParts.push(
                <table
                    className="my-2 bg-white text-2xl lg:text-base text-center"
                    key={htmlParts.length}>
                    <tbody>{tableRows}</tbody>
                </table>
            );
            drawnRows += rowsToShow;
        }
    }
    getSpeed(index) {
        if (index >= this.preColumnSteps) {
            return SPEED_FAST;
        }
        return SPEED_NORMAL;
    }
}

class PartExplanation {
    constructor(bgColor) {
        this.bgColor = bgColor;
        this.paragraphs = [];
    }
    addParagraph(paragraph) {
        this.paragraphs.push(paragraph);
    }
}

class PhrasalExplanation {
    constructor(phrasal) {
        this.phrasal = phrasal;
        /* parts is a list of lists of Paragraphs, where each Paragraph has a number of states */
        this.parts = [];
    }
    addPart(bgColor) {
        this.parts.push(new PartExplanation(bgColor));
    }
    addParagraph(part) {
        // console.log(`Adding part of type: ${typeof part}`);
        // console.log(`with states ${part.totalStates()}`);
        this.parts[this.parts.length - 1].addParagraph(part);
    }
    addTitle(text) {
        this.addParagraph(new Title(text));
    }
    addPlainParagraph(text) {
        this.addParagraph(new PlainParagraph(text));
    }
    addProgression(states, highlightColors) {
        if (!highlightColors) {
            throw new Error("highlightColors is required for Progression");
        }
        this.addParagraph(new Progression(states, highlightColors));
    }
    addVariantsTable(table, highlight, highlightColor) {
        let highlightPos = findItemInTable(table, highlight);
        this.addParagraph(new VariantsTable(table, highlightPos, highlightColor));
    }
    addAnnotatedVariantsTable(table, lang, highlight, highlightColor) {
        const highlightRow = findItemInAnnotatedTable(table, highlight);
        if (highlightRow < 0) {
            throw new Error(`Item ${highlight} not found in annotated table`);
        }
        this.addParagraph(new AnnotatedVariantsTable(table, lang, highlightRow, highlightColor));
    }
    addAnnotatedSplitTable(annotations, tables, lang, i18nTopRow, highlight, highlightColor) {
        let highlightTable = -1;
        let highlightColumn = -1;
        for (let t = 0; t < tables.length; ++t) {
            if (tables[t].length != 2) {
                throw new Error(`Annotated split table must have 2 rows: ${tables[t].length}`);
            }
            let row = tables[t][1];
            for (let j = 0; j < row.length; ++j) {
                if (row[j] == highlight) {
                    if (highlightTable >= 0) {
                        throw new Error(`Item ${highlight} found more than once in annotated split table`);
                    }
                    highlightTable = t;
                    highlightColumn = j;
                }
            }
        }
        if (highlightTable < 0) {
            throw new Error(`Item ${highlight} not found in annotated split table`);
        }
        this.addParagraph(new AnnotatedSplitTable(annotations, tables, lang, i18nTopRow, highlightTable, highlightColumn, highlightColor));
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
        if (this.paragraphIndex >= explanation.parts[this.partIndex].paragraphs.length) {
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
        let paragraphs = explanation.parts[this.partIndex].paragraphs;
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
        let paragraphs = explanation.parts[this.partIndex].paragraphs;
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
    const paragraphs = explanation.parts[state.partIndex].paragraphs;
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

export function renderPhrasalExplanation(explanation, state, phrasalFirst) {
    let htmlParts = [];
    const partsCount = explanation.parts.length;
    const shownParts = Math.min(state.partIndex + 1, partsCount);
    let complete = false;
    for (let partIndex = 0; partIndex < shownParts; ++partIndex) {
        let htmlParagraphs = [];
        const partExplanation = explanation.parts[partIndex];
        const paragraphsCount = partExplanation.paragraphs.length;
        let shownParagraphs = (partIndex < state.partIndex) ? paragraphsCount : (state.paragraphIndex + 1);
        for (let paragraphIndex = 0; paragraphIndex < shownParagraphs; ++paragraphIndex) {
            // console.log(`render part ${partIndex}/${explanation.phrasal.parts.length}, paragraph ${paragraphIndex}`);
            let paragraph = partExplanation.paragraphs[paragraphIndex];
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
        let blockClasses = ["m-4", "p-4", "rounded-2xl", partExplanation.bgColor];
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
    const phrasalHtml = (
        <h2 className="text-5xl text-center">
            {highlightPhrasal(explanation.phrasal, highlightShownParts)}
            {phrasalContinuation}
        </h2>
    );
    const phrasalAbove = phrasalFirst ? phrasalHtml : null;
    const phrasalBelow = phrasalFirst ? null : phrasalHtml;
    return (
        <div>
            {phrasalAbove}
            {htmlParts}
            {phrasalBelow}
        </div>
    );
}

function buildVerbBaseExplanation(verbDictForm, part, lang, explanation) {
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
    explanation.addPart(partBackgroundColor(part.partType));
    explanation.addTitle(i18n("title_base", lang));
    if (explanationType == PART_EXPLANATION_TYPE.VerbBaseStripU) {
        const items = [[verbDictForm], [base]];
        explanation.addProgression(items, [VERB_BASE_COLOR]);
        explanation.addPlainParagraph(i18n("base_strip_u", lang));
    } else if (explanationType == PART_EXPLANATION_TYPE.VerbBaseLostIShort) {
        let loss = "й";
        const items = [[verbDictForm], [`${base}${loss}`], [base]];
        explanation.addProgression(items, [VERB_BASE_COLOR]);
        const text = i18n("base_loss_templ", lang)(loss);
        explanation.addPlainParagraph(text);
    } else if (explanationType == PART_EXPLANATION_TYPE.VerbBaseLostY) {
        let loss = meta.soft ? "і" : "ы";
        const items = [[verbDictForm], [`${base}${loss}`], [base]];
        explanation.addProgression(items, [VERB_BASE_COLOR]);
        const text = i18n("base_loss_templ", lang)(loss);
        explanation.addPlainParagraph(text);
    } else if (explanationType == PART_EXPLANATION_TYPE.VerbBaseGainedY) {
        let gain = meta.soft ? "і" : "ы";
        const items = [[verbDictForm], [base]];
        explanation.addProgression(items, [VERB_BASE_COLOR]);
        const text = i18n("base_gain_templ", lang)(gain);
        explanation.addPlainParagraph(text);
    } else if (explanationType == PART_EXPLANATION_TYPE.VerbBaseGainedIShort) {
        let gain = "й";
        const items = [[verbDictForm], [base]];
        explanation.addProgression(items, [VERB_BASE_COLOR]);
        const text = i18n("base_gain_templ", lang)(gain);
        explanation.addPlainParagraph(text);
    } else if (explanationType == PART_EXPLANATION_TYPE.VerbBaseGainIShortLoseY) {
        let gain1 = "й";
        let gain2 = meta.soft ? "і" : "ы";
        explanation.addProgression([[verbDictForm], [`${base}${gain2}`], [base]], [VERB_BASE_COLOR]);
        explanation.addPlainParagraph(i18n("base_gain_and_loss_templ", lang)(`${gain1}${gain2}`, gain2));
    } else if (explanationType == PART_EXPLANATION_TYPE.VerbBaseGainedIShortY) {
        let gain = meta.soft ? "йі" : "йы";
        const items = [[verbDictForm], [base]];
        explanation.addProgression(items, [VERB_BASE_COLOR]);
        const text = i18n("base_gain_templ", lang)(gain);
        explanation.addPlainParagraph(text);
    } else if (explanationType == PART_EXPLANATION_TYPE.VerbBaseGainedYInsidePriorCons) {
        let gain = meta.soft ? "і" : "ы";
        const items = [[verbDictForm], [base]];
        explanation.addProgression(items, [VERB_BASE_COLOR]);
        const text = i18n("base_gain_inside_templ", lang)(gain);
        explanation.addPlainParagraph(text);
    } else if (explanationType == PART_EXPLANATION_TYPE.VerbBaseReplaceB2U) {
        const items = [[verbDictForm], [base]];
        explanation.addProgression(items, [VERB_BASE_COLOR]);
        const text = i18n("base_replace_b_to_u", lang);
        explanation.addPlainParagraph(text);
    } else if (explanationType == PART_EXPLANATION_TYPE.VerbBaseReplaceLastCons) {
        const items = [[verbDictForm], [base]];
        explanation.addProgression(items, [VERB_BASE_COLOR]);
        const text = i18n("base_replace_last_cons", lang);
        explanation.addPlainParagraph(text);
    }
}

const QUESTION_PARTICLES_ANNOTATIONS = [
    "after_hard",
    "after_soft",
];

const QUESTION_PARTICLES_SPLIT_TABLES = [
    [
        ["after_mnnzhz", "after_unvoiced_bvgd", "after_vowels_lruy"],
        ["ба", "па", "ма"],
    ],
    [
        ["after_mnnzhz", "after_unvoiced_bvgd", "after_vowels_lruy"],
        ["бе", "пе", "ме"],
    ],
];

function buildVerbNegationExplanation(part, lang, explanation) {
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
    explanation.addPart(partBackgroundColor(part.partType));
    explanation.addTitle(i18n("title_negation_particle", lang));
    if (explanationType == PART_EXPLANATION_TYPE.VerbNegationPostBase) {
        explanation.addAnnotatedSplitTable(QUESTION_PARTICLES_ANNOTATIONS, QUESTION_PARTICLES_SPLIT_TABLES, lang, true, negation, "underline text-red-600");
    }
}

const ANNOTATED_PRES_TRANS_AFFIXES = [
    ["after_consonant_hard", "а"],
    ["after_consonant_soft", "е"],
    ["after_vowel", "й"],
];

function buildVerbTenseAffixExplanation(part, lang, explanation) {
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
    explanation.addPart(partBackgroundColor(part.partType));
    explanation.addTitle(i18n("title_tense_affix", lang));
    const highlightColor = "underline text-orange-600";
    if (explanationType == PART_EXPLANATION_TYPE.VerbTenseAffixPresentTransitive) {
        explanation.addAnnotatedVariantsTable(ANNOTATED_PRES_TRANS_AFFIXES, lang, affix, highlightColor);
    } else if (explanationType == PART_EXPLANATION_TYPE.VerbTenseAffixPresentTransitiveToYa) {
        explanation.addAnnotatedVariantsTable(ANNOTATED_PRES_TRANS_AFFIXES, lang, "а", highlightColor);
        explanation.addPlainParagraph(i18n("affix_merge_with_base", lang));
        explanation.addProgression([["а"], [affix]], [VERB_TENSE_AFFIX_COLOR]);
    } else if (explanationType == PART_EXPLANATION_TYPE.VerbTenseAffixPresentTransitiveToYi) {
        explanation.addAnnotatedVariantsTable(ANNOTATED_PRES_TRANS_AFFIXES, lang, "й", highlightColor);
        explanation.addPlainParagraph(i18n("affix_merge_with_base", lang));
        explanation.addProgression([["й"], [affix]], [VERB_TENSE_AFFIX_COLOR]);
    }
}

const PERS_AFFIXES_ANNOTATIONS = [
    "after_hard",
    "after_soft",
];

const PERS_AFFIXES_SPLIT_TABLES = [
    [
        ["мен", "біз", "сен", "сендер", "Сіз", "Сіздер", "ол / олар"],
        ["мын", "мыз", "сың", "сыңдар", "сыз", "сыздар", "ды"],
    ],
    [
        ["мен", "біз", "сен", "сендер", "Сіз", "Сіздер", "ол / олар"],
        ["мін", "міз", "сің", "сіңдер", "сіз", "сіздер", "ді"],
    ]
];

function buildVerbPersonalAffixExplanation(part, lang, explanation) {
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
    explanation.addPart(partBackgroundColor(part.partType));
    explanation.addTitle(i18n("title_pers_affix", lang));
    if (explanationType == PART_EXPLANATION_TYPE.VerbPersonalAffixPresentTransitive) {
        explanation.addAnnotatedSplitTable(PERS_AFFIXES_ANNOTATIONS, PERS_AFFIXES_SPLIT_TABLES, lang, false, affix, "underline text-indigo-600");
    } else if (explanationType == PART_EXPLANATION_TYPE.VerbPersonalAffixPresentTransitiveQuestionSkip) {
        explanation.addPlainParagraph(i18n("pers_affix_question_skip", lang));
    }
}

function buildVerbBaseAndAffixJunctionExplanation(base, affix, lang, explanation) {
    let baseMeta = base.explanation;
    if (baseMeta == null) {
        return;
    }
    const baseType = baseMeta.explanationType;

    let affixMeta = affix.explanation;
    if (affixMeta == null) {
        return;
    }
    const affixType = affixMeta.explanationType;

    if (baseType == PART_EXPLANATION_TYPE.VerbBaseLostY && affixType == PART_EXPLANATION_TYPE.VerbTenseAffixPresentTransitiveToYi) {
        explanation.addPart(partBackgroundColor(null));
        explanation.addTitle(i18n("title_base_affix_junction", lang));
        explanation.addPlainParagraph(i18n("affix_merge_with_base", lang));
        const baseContent = base.content;
        let baseLoss = baseMeta.soft ? "і" : "ы";
        const origAffix = "й";
        const affixContent = affix.content;
        const items = [[`${baseContent}${baseLoss}${origAffix}`], [baseContent, affixContent]]
        explanation.addProgression(items, [VERB_BASE_COLOR, VERB_TENSE_AFFIX_COLOR]);
    }
    // TODO handle other cases
}

function buildQuestionParticleExplanation(part, lang, explanation) {
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
    explanation.addPart(partBackgroundColor(part.partType));
    explanation.addTitle(i18n("title_question_particle", lang));
    explanation.addAnnotatedSplitTable(QUESTION_PARTICLES_ANNOTATIONS, QUESTION_PARTICLES_SPLIT_TABLES, lang, true, particle, "underline");
}

export function buildVerbPhrasalExplanation(verbDictForm, phrasal, lang) {
    let explanation = new PhrasalExplanation(phrasal);
    let parts = phrasal.parts;
    let savedBase = null;
    for (let i = 0; i < parts.length; ++i) {
        let part = parts[i];
        let pt = part.partType;
        // console.log(`explaining: i ${i}, pt ${pt}`);
        if (pt == PHRASAL_PART_TYPE.VerbBase) {
            buildVerbBaseExplanation(verbDictForm, part, lang, explanation);
            savedBase = part;
        } else if (pt == PHRASAL_PART_TYPE.VerbNegation) {
            buildVerbNegationExplanation(part, lang, explanation);
        } else if (pt == PHRASAL_PART_TYPE.VerbTenseAffix) {
            buildVerbTenseAffixExplanation(part, lang, explanation);
            buildVerbBaseAndAffixJunctionExplanation(savedBase, part, lang, explanation);
        } else if (pt == PHRASAL_PART_TYPE.VerbPersonalAffix) {
            buildVerbPersonalAffixExplanation(part, lang, explanation);
        } else if (pt == PHRASAL_PART_TYPE.QuestionParticle) {
            buildQuestionParticleExplanation(part, lang, explanation);
        }
    }
    return explanation;
}