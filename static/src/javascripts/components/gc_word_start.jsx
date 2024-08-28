import React from "react";
import { i18n } from "../lib/i18n";
import { editButton } from "./edit_button";
import KeyboardInput from "./keyboard_input";
import { gcGetLlmTranslations } from "../lib/gc_api";


/**
 * props:
 * - lang
 * - wordLang
 * - lastEntered
 * - word
 * - srcWordId
 * - changeCallback
 * - submitCallback
 * - resetCallback
 */
class GcWordStart extends React.Component {
    constructor(props) {
        super(props);

        this.handleGetLlmTranslationsResponse = this.handleGetLlmTranslationsResponse.bind(this);
        this.handleGetLlmTranslationsError = this.handleGetLlmTranslationsError.bind(this);

        this.onWordChange = this.onWordChange.bind(this);
        this.state = {
            translations: null,
        };
        this.startGetLlmTranslations();
    }

    i18n(key) {
        return i18n(key, this.props.lang);
    }

    async handleGetLlmTranslationsResponse(context, responseJsonPromise) {
        const response = await responseJsonPromise;
        const message = response.message;
        if (message != "ok") {
            console.log(`handleGetLlmTranslationsResponse: error message: ${message}`);
            return;
        }
        const translations = response.translations;
        this.setState({ translations });
    }

    async handleGetLlmTranslationsError(context, responseTextPromise) {
        let responseText = await responseTextPromise;
        console.log(`Got error from get_llm_translations: ${responseText}`);
    }

    startGetLlmTranslations() {
        const srcWordId = this.props.srcWordId;
        if (this.props.wordLang != "ru" || srcWordId == null) {
            return;
        }
        gcGetLlmTranslations(
            srcWordId,
            "gpt-4o-mini",
            this.handleGetLlmTranslationsResponse,
            this.handleGetLlmTranslationsError,
            {}
        );

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
                className="flex flex-row w-full">
                <span className="w-1/2 px-4 py-4 text-2xl">
                    {title}:
                </span>
                <input
                    type="text"
                    size="20"
                    maxLength="64"
                    value={this.props.lastEntered}
                    onChange={this.onWordChange}
                    placeholder={placeholder}
                    className="w-full shadow appearance-none border rounded mx-2 p-2 text-4xl lg:text-2xl text-gray-700 focus:outline-none focus:shadow-outline"
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

    renderTranslations() {
        const translations = this.state.translations;
        if (translations == null || translations.length == 0) {
            return null;
        }
        let translationRows = [];
        const colors = ["text-indigo-600", "text-pink-600", "text-teal-600"];
        for (let index in translations) {
            translationRows.push(
                <li
                    className={`my-2 ${colors[index % colors.length]}`}
                    key={index}>
                    <code>{translations[index]}</code>
                </li>
            );
        }
        return (
            <div className="p-4 text-gray-800">
                <h3 className="text-xl">{this.i18n("llmSuggestions")}:</h3>
                <ul className="mx-6">
                    {translationRows}
                </ul>
                <p className="italic my-2">
                    {this.i18n("noteOnHallucinations")}
                </p>
            </div>
        );
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
            return (
                <div className="my-2 w-full bg-gray-200 rounded flex flex-col">
                    {this.renderForm(wordLang, titleKey)}
                    {this.renderTranslations()}
                </div>
            );
        } else {
            return this.renderResult(word, titleKey);
        }
    }
}

export default GcWordStart;