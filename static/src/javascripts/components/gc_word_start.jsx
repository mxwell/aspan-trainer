import React from "react";
import { i18n } from "../lib/i18n";
import { closeButton } from "./close_button";


/**
 * props:
 * - lang
 * - wordLang
 * - lastEntered
 * - word
 * - changeCallback
 * - submitCallback
 * - resetCallback
 */
class GcWordStart extends React.Component {
    constructor(props) {
        super(props);
    }

    i18n(key) {
        return i18n(key, this.props.lang);
    }

    renderForm(wordLang, titleKey) {
        const placeHolderKey = `enterLangWord_${wordLang}`
        return (
            <form
                onSubmit={this.props.submitCallback}
                className="my-2 flex flex-row w-full bg-gray-200 rounded">
                <span className="px-4 py-4 text-2xl">
                    {this.i18n(titleKey)}:
                </span>
                <input
                    type="text"
                    size="20"
                    maxLength="64"
                    value={this.props.lastEntered}
                    onChange={this.props.changeCallback}
                    placeholder={this.i18n(placeHolderKey)}
                    className="shadow appearance-none border rounded mx-2 p-2 text-4xl lg:text-2xl text-gray-700 focus:outline-none focus:shadow-outline"
                    autoFocus />
                <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-700 text-white text-4xl font-bold mx-2 px-4 rounded focus:outline-none focus:shadow-outline">
                    →
                </button>
            </form>
        );
    }

    renderResult(word, titleKey) {
        return (
            <div className="my-2 flex flex-row justify-between w-full bg-gray-200 rounded">
                <span className="px-4 py-4 text-2xl">
                {this.i18n(titleKey)}:&nbsp;<strong>{word}</strong>
                </span>
                {closeButton({ onClick: this.props.resetCallback })}
            </div>
        );
    }

    render() {
        const word = this.props.word;
        const wordLang = this.props.wordLang;
        const titleKey = `langWord_${wordLang}`;
        if (word == null) {
            return this.renderForm(wordLang, titleKey);
        } else {
            return this.renderResult(word, titleKey);
        }
    }
}

export default GcWordStart;