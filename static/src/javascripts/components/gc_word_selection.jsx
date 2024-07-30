import React from "react";
import { i18n } from "../lib/i18n";
import { closeButton } from "./close_button";


/**
 * props:
 * - lang
 * - foundWords
 * - selectedWordId
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

    renderWordSelector(foundWords) {
        let radios = [];
        for (let index in foundWords) {
            const entry = foundWords[index];
            radios.push(
                <div
                    className="my-2"
                    key={radios.length} >
                    <input
                        type="radio"
                        id={index}
                        onChange={(e) => { this.props.selectCallback(index) }}
                        name="wordSelector" />
                    <label
                        className="mx-2"
                        htmlFor={index} >
                        {entry.word}&nbsp;{this.renderPos(entry.pos, entry.exc_verb)}
                    </label>
                </div>
            );
        }
        radios.push(
            <div
                className="my-2"
                key={radios.length} >
                <input
                    type="radio"
                    id={foundWords.length}
                    onChange={(e) => { this.props.selectCallback(foundWords.length) }}
                    name="wordSelector" />
                <label
                    className="mx-2 italic text-green-900"
                    htmlFor={foundWords.length} >
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
        return (
            <span>
                {entry.word}&nbsp;{this.renderPos(entry.pos, entry.exc_verb)}
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
                    {closeButton({ onClick: this.props.resetCallback })}
                </div>
            );
        }
    }
}

export default GcWordSelection;