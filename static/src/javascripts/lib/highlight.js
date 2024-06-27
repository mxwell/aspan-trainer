import React from 'react';
import {
    PHRASAL_PART_TYPE
} from '../lib/aspan';

function addPartClasses(auxColorPrefix, colorPrefix, aux, partClasses) {
    if (aux) {
        partClasses.push(auxColorPrefix);
        partClasses.push("font-medium");
    } else {
        partClasses.push(colorPrefix);
        partClasses.push("font-bold");
    }
}

export function partBackgroundColor(partType) {
    if (partType == PHRASAL_PART_TYPE.VerbBase) {
        return "bg-teal-200";
    } else if (partType == PHRASAL_PART_TYPE.VerbTenseAffix) {
        return "bg-orange-200";
    } else if (partType == PHRASAL_PART_TYPE.VerbPersonalAffix) {
        return "bg-indigo-200";
    } else if (partType == PHRASAL_PART_TYPE.VerbNegation) {
        return "bg-red-100";
    }
    return "bg-gray-200";
}

export const VERB_BASE_COLOR = "text-teal-800";
export const VERB_TENSE_AFFIX_COLOR = "text-orange-800";

export function highlightPhrasal(phrasal, shownParts = -1) {
    let htmlParts = [];
    let parts = phrasal.parts;
    var firstRegular = true;
    var firstAux = true;
    const maxParts = shownParts == -1 ? parts.length : shownParts;
    for (let i = 0; i < maxParts; ++i) {
        let part = parts[i];
        let pt = part.partType;
        let partClasses = [];
        if (!part.aux && firstRegular) {
            partClasses.push("pl-1");
            firstRegular = false;
        }
        if (part.aux && firstAux) {
            partClasses.push("pl-2");
            firstAux = false;
        }
        if (pt == PHRASAL_PART_TYPE.VerbBase) {
            addPartClasses(VERB_BASE_COLOR, "text-teal-600", part.aux, partClasses);
        } else if (pt == PHRASAL_PART_TYPE.VerbTenseAffix) {
            addPartClasses(VERB_TENSE_AFFIX_COLOR, "text-orange-600", part.aux, partClasses);
        } else if (pt == PHRASAL_PART_TYPE.VerbPersonalAffix) {
            addPartClasses("text-indigo-800", "text-indigo-600", part.aux, partClasses);
        } else if (pt == PHRASAL_PART_TYPE.VerbNegation) {
            addPartClasses("text-red-800", "text-red-600", part.aux, partClasses);
        }
        htmlParts.push(
            <span
                className={partClasses.join(" ")}
                key={`part${htmlParts.length}`}>
                {part.content}
            </span>
        );
    }
    return htmlParts;
}

export function highlightDeclensionPhrasal(phrasal) {
    let htmlParts = [];
    let parts = phrasal.parts;
    for (let i = 0; i < parts.length; ++i) {
        let part = parts[i];
        let pt = part.partType;
        let partClasses = "";
        if (pt == PHRASAL_PART_TYPE.NounBase) {
            partClasses = "text-teal-600 font-bold";
        } else if (pt == PHRASAL_PART_TYPE.PluralAffix) {
            partClasses = "text-pink-600 font-bold";
        } else if (pt == PHRASAL_PART_TYPE.PossessiveAffix) {
            partClasses = "text-indigo-600 font-bold";
        } else if (pt == PHRASAL_PART_TYPE.SeptikAffix) {
            partClasses = "text-orange-600 font-bold";
        } else if (pt == PHRASAL_PART_TYPE.VerbBase) {
            partClasses = "text-teal-600 font-bold";
        } else if (pt == PHRASAL_PART_TYPE.VerbTenseAffix) {
            partClasses = "text-orange-800 font-bold";
        } else if (pt == PHRASAL_PART_TYPE.VerbNegation) {
            partClasses = "text-red-600 font-bold";
        }
        htmlParts.push(
            <span
                className={partClasses}
                key={htmlParts.length}>
                {part.content}
            </span>
        );
    }
    return htmlParts;
}