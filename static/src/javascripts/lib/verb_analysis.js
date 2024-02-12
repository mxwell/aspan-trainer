import React from 'react';
import {
    PART_EXPLANATION_TYPE,
    PHRASAL_PART_TYPE,
} from "./aspan";
import { highlightPhrasal } from './highlight';
import {
    I18N_LANG_RU,
    i18n
} from './i18n';

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
    }
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
        }
    }
    return (
        <div>
            <p>{highlightPhrasal(phrasal)}</p>
            {htmlParts}
        </div>
    );
}