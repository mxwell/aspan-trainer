import React from 'react';
import {
    PART_EXPLANATION_TYPE,
    PHRASAL_PART_TYPE,
    Phrasal,
} from "./aspan";
import { highlightPhrasal } from './highlight';
import {
    I18N_LANG_RU,
    i18n
} from './i18n';

class Progression {
    constructor(states) {
        this.states = states;
    }
    totalStates() {
        return this.states.length;
    }
    getState(index, htmlParts) {
        let items = this.states.slice(0, index);
        htmlParts.push(
            <p
                key={`p${htmlParts.length}`}>
                {items.join(" → ")}
            </p>
        );
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
                let cellClass = (pos == highlight) ? highlightColor : "";
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
}

class PhrasalExplanation {
    constructor(phrasal) {
        this.phrasal = phrasal;
        this.parts = [];
    }
}

class PhrasalAnimationState {
    constructor(phrasal) {
        this.partIndex = 0;
        this.paragraphIndex = 0;
        this.stateIndex = 0;
    }
}

function addTitleParagraph(text, htmlParts) {
    htmlParts.push(
        <p
            className="text-3xl"
            key={`p${htmlParts.length}`}>
            {text}
        </p>
    );
}

function addProgressionParagraph(items, htmlParts) {
    htmlParts.push(
        <p
            key={`p${htmlParts.length}`}>
            {items.join(" → ")}
        </p>
    );
}

function addPlainParagraph(text, htmlParts) {
    htmlParts.push(
        <p
            key={`p${htmlParts.length}`}>
            {text}
        </p>
    );
}

function addVariantsTable(variants, highlight, highlightColor, htmlParts) {
    let tableRows = [];
    for (let i = 0; i < variants.length; ++i) {
        let row = variants[i];
        let cells = [];
        for (let j = 0; j < row.length; ++j) {
            let v = row[j];
            let cellClass = (v == highlight) ? highlightColor : "";
            cells.push(
                <td
                    className={`p-2 border-2 ${cellClass}`}
                    key={j}>
                    {row[j]}
                </td>
            );
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

function renderVerbBaseExplanation(verbDictForm, part, htmlParts) {
    let lang = I18N_LANG_RU;
    let explanation = part.explanation;
    if (explanation == null) {
        return;
    }
    const explanationType = explanation.explanationType;
    if (explanationType == null || explanationType.length == 0) {
        return;
    }
    const base = part.content;
    console.log(`explaining base: expl type ${explanationType}`)
    addTitleParagraph(i18n("title_base", lang), htmlParts);
    if (explanationType == PART_EXPLANATION_TYPE.VerbBaseStripU) {
        const items = [verbDictForm, base];
        addProgressionParagraph(items, htmlParts);
        addPlainParagraph(i18n("base_strip_u", lang), htmlParts);
    } else if (explanationType == PART_EXPLANATION_TYPE.VerbBaseLostIShort) {
        let loss = "й";
        const items = [verbDictForm, `${base}${loss}`, base];
        addProgressionParagraph(items, htmlParts);
        const text = i18n("base_loss_templ", lang)(loss);
        addPlainParagraph(text, htmlParts);
    } else if (explanationType == PART_EXPLANATION_TYPE.VerbBaseLostY) {
        let loss = explanation.soft ? "і" : "ы";
        const items = [verbDictForm, `${base}${loss}`, base];
        addProgressionParagraph(items, htmlParts);
        const text = i18n("base_loss_templ", lang)(loss);
        addPlainParagraph(text, htmlParts);
    } else if (explanationType == PART_EXPLANATION_TYPE.VerbBaseGainedY) {
        let gain = explanation.soft ? "і" : "ы";
        const items = [verbDictForm, base];
        addProgressionParagraph(items, htmlParts);
        const text = i18n("base_gain_templ", lang)(gain);
        addPlainParagraph(text, htmlParts);
    } else if (explanationType == PART_EXPLANATION_TYPE.VerbBaseGainedIShort) {
        let gain = "й";
        const items = [verbDictForm, base];
        addProgressionParagraph(items, htmlParts);
        const text = i18n("base_gain_templ", lang)(gain);
        addPlainParagraph(text, htmlParts);
    } else if (explanationType == PART_EXPLANATION_TYPE.VerbBaseGainIShortLoseY) {
        let gain1 = "й";
        let gain2 = explanation.soft ? "і" : "ы";
        addProgressionParagraph([verbDictForm, `${base}${gain2}`, base], htmlParts);
        addPlainParagraph(i18n("base_gain_and_loss_templ", lang)(`${gain1}${gain2}`, gain2), htmlParts);
    } else if (explanationType == PART_EXPLANATION_TYPE.VerbBaseGainedIShortY) {
        let gain = explanation.soft ? "йі" : "йы";
        const items = [verbDictForm, base];
        addProgressionParagraph(items, htmlParts);
        const text = i18n("base_gain_templ", lang)(gain);
        addPlainParagraph(text, htmlParts);
    } else if (explanationType == PART_EXPLANATION_TYPE.VerbBaseGainedYInsidePriorCons) {
        let gain = explanation.soft ? "і" : "ы";
        const items = [verbDictForm, base];
        addProgressionParagraph(items, htmlParts);
        const text = i18n("base_gain_inside_templ", lang)(gain);
        addPlainParagraph(text, htmlParts);
    } else if (explanationType == PART_EXPLANATION_TYPE.VerbBaseReplaceB2U) {
        const items = [verbDictForm, base];
        addProgressionParagraph(items, htmlParts);
        const text = i18n("base_replace_b_to_u", lang);
        addPlainParagraph(text, htmlParts);
    } else if (explanationType == PART_EXPLANATION_TYPE.VerbBaseReplaceLastCons) {
        const items = [verbDictForm, base];
        addProgressionParagraph(items, htmlParts);
        const text = i18n("base_replace_last_cons", lang);
        addPlainParagraph(text, htmlParts);
    }
}

const NEGATION_OR_QUESTION_PARTICLES = [
    ["ба", "ма", "па"],
    ["бе", "ме", "пе"],
];

function renderVerbNegationExplanation(part, htmlParts) {
    let lang = I18N_LANG_RU;
    let explanation = part.explanation;
    if (explanation == null) {
        return;
    }
    const explanationType = explanation.explanationType;
    if (explanationType == null || explanationType.length == 0) {
        return;
    }
    const negation = part.content;
    console.log(`explaining negation: expl type ${explanationType}`);
    addTitleParagraph(i18n("title_negation_particle", lang), htmlParts);
    if (explanationType == PART_EXPLANATION_TYPE.VerbNegationPostBase) {
        const highlightColor = "underline text-red-600";
        addVariantsTable(NEGATION_OR_QUESTION_PARTICLES, negation, highlightColor, htmlParts);
    }
}

const PRES_TRANSITIVE_AFFIXES = [["а", "е", "й"]];

function renderVerbTenseAffixExplanation(part, htmlParts) {
    let lang = I18N_LANG_RU;
    let explanation = part.explanation;
    if (explanation == null) {
        return;
    }
    const explanationType = explanation.explanationType;
    if (explanationType == null || explanationType.length == 0) {
        return;
    }
    const affix = part.content;
    console.log(`explaining tense affix: expl type ${explanationType}`);
    addTitleParagraph(i18n("title_tense_affix", lang), htmlParts);
    const highlightColor = "underline text-orange-600";
    if (explanationType == PART_EXPLANATION_TYPE.VerbTenseAffixPresentTransitive) {
        addVariantsTable(PRES_TRANSITIVE_AFFIXES, affix, highlightColor, htmlParts);
    } else if (explanationType == PART_EXPLANATION_TYPE.VerbTenseAffixPresentTransitiveToYa) {
        addVariantsTable(PRES_TRANSITIVE_AFFIXES, "а", highlightColor, htmlParts);
        const text = i18n("affix_merge_with_base", lang);
        addPlainParagraph(text, htmlParts);
        addProgressionParagraph(["а", affix], htmlParts);
    } else if (explanationType == PART_EXPLANATION_TYPE.VerbTenseAffixPresentTransitiveToYi) {
        addVariantsTable(PRES_TRANSITIVE_AFFIXES, "й", highlightColor, htmlParts);
        const text = i18n("affix_merge_with_base", lang);
        addPlainParagraph(text, htmlParts);
        addProgressionParagraph(["й", affix], htmlParts);
    }
}

const PERS_AFFIXES = [
    ["мын", "мыз", "сың", "сыңдар", "сыз", "сыздар", "ды"],
    ["мін", "міз", "сің", "сіңдер", "сіз", "сіздер", "ді"],
];

function renderVerbPersonalAffixExplanation(part, htmlParts) {
    let lang = I18N_LANG_RU;
    let explanation = part.explanation;
    if (explanation == null) {
        return;
    }
    const explanationType = explanation.explanationType;
    if (explanationType == null || explanationType.length == 0) {
        return;
    }
    const affix = part.content;
    console.log(`explaining pers affix: expl type ${explanationType}`);
    addTitleParagraph(i18n("title_pers_affix", lang), htmlParts);
    if (explanationType == PART_EXPLANATION_TYPE.VerbPersonalAffixPresentTransitive) {
        addVariantsTable(PERS_AFFIXES, affix, "underline text-indigo-600", htmlParts);
    } else if (explanationType == PART_EXPLANATION_TYPE.VerbPersonalAffixPresentTransitiveQuestionSkip) {
        addPlainParagraph(i18n("pers_affix_question_skip", lang), htmlParts);
    }
}

function renderQuestionParticleExplanation(part, htmlParts) {
    let lang = I18N_LANG_RU;
    let explanation = part.explanation;
    if (explanation == null) {
        return;
    }
    const explanationType = explanation.explanationType;
    if (explanationType == null || explanationType.length == 0) {
        return;
    }
    const particle = part.content;
    console.log(`explaining question particle: expl type ${explanationType}`);
    addTitleParagraph(i18n("title_question_particle", lang), htmlParts);
    addVariantsTable(NEGATION_OR_QUESTION_PARTICLES, particle, "underline", htmlParts);
}

export function renderVerbPhrasalExplanation(verbDictForm, phrasal) {
    let parts = phrasal.parts;
    console.log(`Rendering explanation paragraphs for ${parts.length} part(s).`);
    let htmlParts = [];
    for (let i = 0; i < parts.length; ++i) {
        let part = parts[i];
        let pt = part.partType;
        console.log(`explaining: i ${i}, pt ${pt}`);
        if (pt == PHRASAL_PART_TYPE.VerbBase) {
            renderVerbBaseExplanation(verbDictForm, part, htmlParts);
        } else if (pt == PHRASAL_PART_TYPE.VerbNegation) {
            renderVerbNegationExplanation(part, htmlParts);
        } else if (pt == PHRASAL_PART_TYPE.VerbTenseAffix) {
            renderVerbTenseAffixExplanation(part, htmlParts);
        } else if (pt == PHRASAL_PART_TYPE.VerbPersonalAffix) {
            renderVerbPersonalAffixExplanation(part, htmlParts);
        } else if (pt == PHRASAL_PART_TYPE.QuestionParticle) {
            renderQuestionParticleExplanation(part, htmlParts);
        }
    }
    return (
        <div>
            <p>{highlightPhrasal(phrasal)}</p>
            {htmlParts}
        </div>
    );
}