import React from "react";
import { i18n } from "../lib/i18n";
import { FSPT_BASE, FSPT_BASE_EXT, FSPT_NEG, FSPT_PERS_AFFIX, FSPT_Q, FSPT_QM, FSPT_SPACE, FSPT_TENSE_AFFIX } from "../lib/cheatsheet";
import { SENTENCE_TYPES } from "../lib/sentence";
import { generateCheatsheetByLevelKey } from "../lib/cheatsheet_gen";
import { closeButton } from "./close_button";

function highlightFormStructure(structure, lang) {
    let htmlItems = [];
    for (let i = 0; i < structure.parts.length; i++) {
        const part = structure.parts[i];
        const partType = part.partType;
        const content = part.content;
        if (partType == FSPT_SPACE) {
            htmlItems.push(<span key={i} className="px-4 py-2 m-2 bg-blue-800 text-white rounded">_</span>);
        } else if (partType == FSPT_BASE) {
            htmlItems.push(<span key={i} className="p-2 bg-teal-400 text-white rounded">{i18n(partType, lang)}</span>);
        } else if (partType == FSPT_BASE_EXT) {
            htmlItems.push(<span key={i} className="bg-teal-600">{content}</span>);
        } else if (partType == FSPT_TENSE_AFFIX) {
            htmlItems.push(<span key={i} className="p-2 ml-2 bg-orange-400 text-white rounded">{content}</span>);
        } else if (partType == FSPT_PERS_AFFIX) {
            htmlItems.push(<span key={i} className="p-2 ml-2 bg-indigo-500 text-white rounded">{i18n(partType, lang)}</span>);
        } else if (partType == FSPT_NEG) {
            htmlItems.push(<span key={i} className="p-2 ml-2 bg-red-400 text-white rounded">{i18n(partType, lang)}</span>);
        } else if (partType == FSPT_Q) {
            htmlItems.push(<span key={i} className="p-2 ml-2 bg-red-400 text-white rounded">{i18n(partType, lang)}</span>);
        } else if (partType == FSPT_QM) {
            htmlItems.push(<span key={i} className="px-4 py-2 ml-2 bg-blue-800 text-white rounded">?</span>);
        } else {
            htmlItems.push(<span key={i}>UNSUPPORTED_PART_TYPE</span>);
        }
    }
    return htmlItems;
}

/**
 * props:
 * - lang
 * - levelKey
 * - backCallback
 * - forwardCallback
 */
class GymCheatsheet extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            cheatsheet: generateCheatsheetByLevelKey(this.props.levelKey),
        };
    }

    i18n(key) {
        return i18n(key, this.props.lang);
    }

    renderStructures(structures, sentenceType) {
        let tableRows = [];
        for (let i = 0; i < structures.length; i++) {
            const s = structures[i];
            tableRows.push(
                <tr key={i}>
                    <td className="px-6 py-4 border-2 w-12">{i + 1}</td>
                    <td className="px-6 py-4 border-2 text-left">{highlightFormStructure(s, this.props.lang)}</td>
                </tr>
            );
        }
        return (
            <div className="flex flex-col">
                <h2 className="text-4xl lg:text-2xl text-center text-gray-600 my-10">
                    {this.i18n(sentenceType)}
                </h2>
                <table className="text-4xl lg:text-2xl">
                    <tbody>
                        {tableRows}
                    </tbody>
                </table>
            </div>
        );
    }

    render() {
        const levelKey = this.props.levelKey;
        const cheatsheet = this.state.cheatsheet;
        // TODO add links
        return (
            <div className="flex flex-col">
                <div className="flex flex-row justify-between bg-gray-200 p-4">
                    <h1 className="text-5xl lg:text-3xl text-center text-gray-600 my-2">
                        {this.i18n(levelKey)}
                    </h1>
                    {closeButton({ onClick: this.props.backCallback })}
                </div>
                {this.renderStructures(cheatsheet.statement, SENTENCE_TYPES[0])}
                {this.renderStructures(cheatsheet.negative, SENTENCE_TYPES[1])}
                {this.renderStructures(cheatsheet.question, SENTENCE_TYPES[2])}
                <div className="flex flex-row justify-end">
                    <button
                        type="submit"
                        onClick={this.props.forwardCallback}
                        className="text-white font-bold mt-6 px-2 text-5xl lg:text-3xl rounded focus:outline-none focus:shadow-outline bg-blue-500 hover:bg-blue-700">
                        →
                    </button>
                </div>
            </div>
        );
    }
}

export {
    GymCheatsheet,
};