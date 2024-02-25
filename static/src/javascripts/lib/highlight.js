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
            addPartClasses("text-teal-800", "text-teal-600", part.aux, partClasses);
        } else if (pt == PHRASAL_PART_TYPE.VerbTenseAffix) {
            addPartClasses("text-orange-800", "text-orange-600", part.aux, partClasses);
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