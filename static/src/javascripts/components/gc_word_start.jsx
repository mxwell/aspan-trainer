import React from "react";
import { i18n } from "../lib/i18n";
import { editButton } from "./edit_button";
import KeyboardInput from "./keyboard_input";


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

        this.onWordChange = this.onWordChange.bind(this);
    }

    i18n(key) {
        return i18n(key, this.props.lang);
    }

    onWordChange(event) {
        event.preventDefault();
        const lastEnteredWord = event.target.value;
        this.props.changeCallback(lastEnteredWord);
    }

    renderKeyboardForm(title, placeholder) {
        return (
            <KeyboardInput
                title={title}
                placeholder={placeholder}
                lastEntered={this.props.lastEntered}
                changeCallback={this.props.changeCallback}
                submitCallback={this.props.submitCallback} />
        );
    }

    renderPlainForm(title, placeholder) {
        return (
            <form
                onSubmit={this.props.submitCallback}
                className="my-2 flex flex-row w-full bg-gray-200 rounded">
                <span className="px-4 py-4 text-2xl">
                    {title}:
                </span>
                <input
                    type="text"
                    size="20"
                    maxLength="64"
                    value={this.props.lastEntered}
                    onChange={this.onWordChange}
                    placeholder={placeholder}
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

    renderForm(wordLang, titleKey) {
        const placeHolderKey = `enterLangWord_${wordLang}`;
        const placeholder = this.i18n(placeHolderKey);
        const title = this.i18n(titleKey);
        if (wordLang == "kk") {
            return this.renderKeyboardForm(title, placeholder);
        } else {
            return this.renderPlainForm(title, placeholder);
        }
    }

    renderResult(word, titleKey) {
        return (
            <div className="my-2 flex flex-row justify-between w-full bg-gray-200 rounded">
                <span className="px-4 py-4 text-2xl">
                {this.i18n(titleKey)}:&nbsp;<strong>{word}</strong>
                </span>
                {editButton({ onClick: this.props.resetCallback })}
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