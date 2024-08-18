import React from "react";
import { i18n } from "../lib/i18n";
import { renderComment } from "./gc_common";
import { editButton } from "./edit_button";

/**
 * props:
 * - lang
 * - foundWords
 * - selectedWordId
 * - usedWordIds
 * - selectCallback
 * - submitCallback
 * - resetCallback
 */
class GcWordSelection extends React.Component {
    constructor(props) {
        super(props);
    }

    i18n(key) {
        return i18n(key, this.props.lang);
    }

    renderPos(pos, excVerb) {
        if (pos) {
            const spanClass = "text-blue-500 text-xs italic";
            if (excVerb > 0) {
                return (<span className={spanClass}>
                    {pos},&nbsp;{this.i18n("feVerb")}
                </span>);
            }
            return (<span className={spanClass}>
                {pos}
            </span>);
        }
        return null;
    }

    checkIfUsed(wordId) {
        for (let usedWordId of this.props.usedWordIds) {
            if (usedWordId == wordId) {
                return true;
            }
        }
        return false;
    }

    renderWordSelector(foundWords) {
        let radios = [];
        const commentClass = "py-2 px-4 text-gray-700 italic";
        let focused = false;
        for (let index in foundWords) {
            const entry = foundWords[index];
            const used = this.checkIfUsed(entry.word_id);
            const labelClass = (
                used
                ? "px-2 py-2 text-gray-600"
                : "px-2 py-2"
            );
            const autoFocus = (
                (!used && !focused)
                ? "autoFocus"
                : null
            );
            if (autoFocus != null) {
                focused = true;
            }
            radios.push(
                <div
                    className=""
                    key={radios.length} >
                    <input
                        type="radio"
                        id={index}
                        onChange={(e) => { this.props.selectCallback(index) }}
                        className="focus:shadow-outline"
                        disabled={used ? "disabled" : null}
                        autoFocus={autoFocus}
                        name="wordSelector" />
                    <label
                        className={labelClass}
                        htmlFor={index} >
                        {entry.word}&nbsp;{this.renderPos(entry.pos, entry.exc_verb)}{renderComment(entry.comment, commentClass, 128)}
                    </label>
                </div>
            );
        }
        const createNewIndex = foundWords.length;
        radios.push(
            <div
                className=""
                key={radios.length} >
                <input
                    type="radio"
                    id={createNewIndex}
                    onChange={(e) => { this.props.selectCallback(createNewIndex) }}
                    name="wordSelector" />
                <label
                    className="px-2 py-2 italic text-green-900"
                    htmlFor={createNewIndex} >
                    {this.i18n("createNewWord")}
                </label>
            </div>
        );
        return (
            <form
                onSubmit={this.props.submitCallback}
                className="my-2 p-2 w-full bg-gray-200 rounded">
                <fieldset className="m-2 flex flex-col border-2 border-gray-600 p-2 rounded text-xl">
                    <legend className="px-2 text-base">{this.i18n("selectExistingOrCreateNew")}</legend>
                    {radios}
                </fieldset>
                <div className="flex flex-row justify-end">
                    <button
                        type="submit"
                        className="bg-blue-500 hover:bg-blue-700 text-white text-4xl font-bold mx-2 px-4 rounded focus:outline-none focus:shadow-outline">
                        →
                    </button>
                </div>
            </form>
        );
    }

    renderSelectedWord(foundWords, selectedWordId) {
        const index = Number(selectedWordId);
        if (index >= foundWords.length) {
            return (
                <span
                    className="italic text-green-900" >
                    {this.i18n("createNewWord")}
                </span>
            );
        }
        const entry = foundWords[index];
        const commentClass = "py-2 px-4 text-gray-700 italic";
        return (
            <span>
                {entry.word}&nbsp;{this.renderPos(entry.pos, entry.exc_verb)}{renderComment(entry.comment, commentClass, 12)}
            </span>
        );
    }

    render() {
        const foundWords = this.props.foundWords;
        if (foundWords == null) {
            return (
                <div className="my-2 border-2 border-gray-400 w-full rounded">
                    <p className="px-4 py-4 text-2xl italic text-center">{this.i18n("loadingWords")}</p>
                </div>
            );
        }
        const selectedWordId = this.props.selectedWordId;
        if (selectedWordId == null) {
            return this.renderWordSelector(foundWords);
        } else {
            return (
                <div className="my-2 flex flex-row justify-between w-full bg-gray-200 rounded">
                    <span className="px-4 py-4 text-2xl">
                        {this.renderSelectedWord(foundWords, selectedWordId)}
                    </span>
                    {editButton({ onClick: this.props.resetCallback })}
                </div>
            );
        }
    }
}

export default GcWordSelection;