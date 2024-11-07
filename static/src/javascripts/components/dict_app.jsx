import React from "react";
import { i18n } from "../lib/i18n";
import { buildDictUrl, buildGcLandingUrl, buildViewerUrl2, parseParams } from "../lib/url";
import { makeDetectRequest } from "../lib/requests";
import { unpackDetectResponseWithPos } from "../lib/detector";
import { SENTENCE_TYPES } from "../lib/sentence";
import { highlightDeclensionPhrasal, highlightPhrasal } from "../lib/highlight";
import { reproduceNoun, reproduceVerb } from "../lib/analyzer";
import { generatePreviewVerbForms } from "../lib/verb_forms";
import { trimAndLowercase } from "../lib/input_validation";
import { catCompletion } from "../lib/suggest";
import { backspaceTextInput, insertIntoTextInput, Keyboard } from "./keyboard";

const DEFAULT_SUGGESTIONS = [];
const DEFAULT_SUGGESTION_POS = -1;

/**
 * props:
 * - lang: string
 */
class DictApp extends React.Component {
    constructor(props) {
        super(props);

        this.handleDetectResponse = this.handleDetectResponse.bind(this);
        this.handleDetectError = this.handleDetectError.bind(this);
        this.onChange = this.onChange.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onBgClick = this.onBgClick.bind(this);
        this.onInsert = this.onInsert.bind(this);
        this.onBackspace = this.onBackspace.bind(this);
        this.onKeyboardClick = this.onKeyboardClick.bind(this);
        this.onSubmit = this.onSubmit.bind(this);

        const urlState = this.readUrlState();
        if (urlState != null) {
            this.state = urlState;
            this.lookup(urlState.word);
        } else {
            this.state = this.defaultState();
        }
    }

    makeState(word) {
        return {
            word: word,
            lastEntered: word,
            keyboard: false,
            suggestions: DEFAULT_SUGGESTIONS,
            currentFocus: DEFAULT_SUGGESTION_POS,
            loading: false,
            error: false,
            detectedForms: [],
        };
    }

    defaultState() {
        return this.makeState(
            /* word */ "",
        );
    }

    readUrlState() {
        const params = parseParams();
        const word = params.w;
        if (word == null || word.length == 0) {
            return null;
        }
        return this.makeState(word);
    }

    i18n(key) {
        return i18n(key, this.props.lang);
    }

    async handleDetectResponse(context, responseJsonPromise) {
        let response = await responseJsonPromise;
        const word = this.state.word;
        if (word != context.word) {
            console.log("Lookup results are out of date");
            return;
        }
        let detectedForms = [];
        if (response.words) {
            const candidates = unpackDetectResponseWithPos(response.words);
            /**
             * Some tenses are problematic, hence the filtering.
             */
            for (const candidate of candidates) {
                if (candidate.tense != "presentContinuous") {
                    detectedForms.push(candidate);
                }
            }
        }
        const loading = false;
        let suggestions = [];
        const currentFocus = DEFAULT_SUGGESTION_POS;
        const inSuggestions = response.suggestions;
        if (inSuggestions && inSuggestions.length > 0) {
            for (let i = 0; i < inSuggestions.length; ++i) {
                suggestions.push({
                    completion: inSuggestions[i].completion,
                    raw: catCompletion(inSuggestions[i]),
                });
            }
            if (suggestions.length == 1 && suggestions[0].raw == word) {
                suggestions = [];
            }
        }
        this.setState({ loading, detectedForms, suggestions, currentFocus });
    }

    async handleDetectError(context, responseTextPromise) {
        let responseText = await responseTextPromise;
        console.log(`Got error from detect: ${responseText}`);
        this.setState({ loading: false, error: true });
    }

    lookup(word, suggest) {
        const onlyVerbs = false;
        makeDetectRequest(
            word,
            suggest,
            onlyVerbs,
            this.handleDetectResponse,
            this.handleDetectError,
            { word }
        );
    }

    changeInputText(lastEntered, suggest) {
        const word = trimAndLowercase(lastEntered);
        if (word.length > 0) {
            this.lookup(word, suggest);
        }
        this.setState({ word, lastEntered });
    }

    onKeyboardClick(e) {
        e.preventDefault();
        const keyboard = !this.state.keyboard;
        this.setState({ keyboard });
    }

    updateText(change) {
        this.setState(
            { lastEntered: change.newText },
            () => {
                const wi = this.refs.wordInput;
                wi.selectionStart = change.newSelectionStart;
                wi.selectionEnd = change.newSelectionStart;
                wi.focus();
            }
        );
    }

    onInsert(fragment) {
        const textInput = this.refs.wordInput;
        const change = insertIntoTextInput(textInput, fragment);
        this.updateText(change);
    }

    onBackspace() {
        const textInput = this.refs.wordInput;
        const change = backspaceTextInput(textInput);
        this.updateText(change);
    }

    onChange(event) {
        let lastEntered = event.target.value;
        this.changeInputText(lastEntered, /* suggest */ true);
    }

    moveActiveSuggestion(posChange) {
        if (posChange == 0) return;
        let suggestions = this.state.suggestions;
        let prevFocus = this.state.currentFocus;
        let currentFocus = prevFocus + posChange;
        if (currentFocus >= suggestions.length || suggestions.length == 0) {
            currentFocus = 0;
        } else if (currentFocus < 0) {
            currentFocus = suggestions.length - 1;
        }
        this.setState({ currentFocus });
    }

    clearSuggestions() {
        this.setState({
            suggestions: DEFAULT_SUGGESTIONS,
        });
    }

    activateSuggestion(lastEntered) {
        this.changeInputText(lastEntered, /* suggest */ false);
    }

    onKeyDown(e) {
        if (e.keyCode == 40) {  // arrow down
            this.moveActiveSuggestion(1);
        } else if (e.keyCode == 38) { // arrow up
            this.moveActiveSuggestion(-1);
        } else if (e.keyCode == 27) { // esc
            this.clearSuggestions();
        } else if (e.keyCode == 13) { // enter
            let suggestions = this.state.suggestions;
            let currentFocus = this.state.currentFocus;
            if (0 <= currentFocus && currentFocus < suggestions.length) {
                e.preventDefault();
                let lastEntered = suggestions[currentFocus].raw;
                this.activateSuggestion(lastEntered);
            }
        }
    }

    onSuggestionClick(word, e) {
        e.stopPropagation();
        this.activateSuggestion(word);
    }

    onBgClick(e) {
        this.clearSuggestions();
    }

    renderSuggestions() {
        let suggestions = this.state.suggestions;
        if (suggestions.length == 0 || this.state.keyboard) {
            return null;
        }

        let currentFocus = this.state.currentFocus;

        let items = [];
        for (let i = 0; i < suggestions.length; ++i) {
            let completion = suggestions[i].completion;
            let parts = [];
            for (let j = 0; j < completion.length; ++j) {
                let item = completion[j];
                if (item.hl) {
                    parts.push(<strong key={j}>{item.text}</strong>);
                } else {
                    parts.push(<span key={j}>{item.text}</span>);
                }
            }
            let word = suggestions[i].raw;
            let divClasses = "p-2 border-b-2 border-gray-300 text-2xl lg:text-xl";
            if (i == currentFocus) {
                divClasses += " bg-blue-500 text-white";
            } else {
                divClasses += " bg-white text-gray-700";
            }
            items.push(
                <div
                    onClick={(e) => { this.onSuggestionClick(word, e) }}
                    key={i}
                    className={divClasses} >
                    {parts}
                </div>
            );
        }
        return (
            <div className="absolute z-50 left-0 right-0 border-l-2 border-r-2 border-gray-300 mx-2">
                {items}
            </div>
        );
    }

    renderKeyboard() {
        const keyboard = this.state.keyboard;
        if (!keyboard) {
            return null;
        }
        return (
            <div className="mx-6 py-2 bg-gray-200">
                <Keyboard
                    insertCallback={this.onInsert}
                    backspaceCallback={this.onBackspace} />
            </div>
        );
    }

    onSubmit(event) {
        event.preventDefault();
        const word = trimAndLowercase(this.state.lastEntered);
        if (word.length == 0) {
            console.log("empty input");
            return;
        }
        this.setState({ word });
        const newUrl = buildDictUrl(word, this.props.lang);
        window.history.pushState(null, "", newUrl);
        this.lookup(word, /* suggest */ false);
    }

    renderSubmitButton() {
        if (this.state.loading) {
            return (
                <button
                    type="submit"
                    disabled
                    className="mx-2 bg-gray-500 hover:bg-gray-500 text-white text-4xl font-bold px-4 rounded focus:outline-none">
                    ⋯
                </button>
            );
        } else {
            return (
                <button
                    type="submit"
                    className="mx-2 bg-yellow-700 hover:bg-yellow-800 text-white text-4xl font-bold px-4 rounded focus:outline-none focus:shadow-outline">
                    →
                </button>
            );
        }
    }

    renderForm() {
        const keyboardClass = (
            this.state.keyboard
            ? "px-2 bg-blue-600 hover:bg-blue-700 focus:outline-none"
            : "px-2 bg-gray-400 hover:bg-gray-600 focus:outline-none"
        );
        return (
            <form onSubmit={this.onSubmit} className="p-3 flex flex-row justify-center">
                <div className="relative">
                    <input
                        ref="wordInput"
                        type="text"
                        size="20"
                        maxLength="100"
                        autoFocus
                        autoCapitalize="none"
                        onChange={this.onChange}
                        onKeyDown={this.onKeyDown}
                        value={this.state.lastEntered}
                        required
                        className="shadow appearance-none border rounded p-2 text-4xl lg:text-2xl text-gray-700 focus:outline-none focus:shadow-outline"
                        placeholder={this.i18n("hintEnterWordForm")}
                        />
                    {this.renderSuggestions()}
                </div>
                <button
                    type="button"
                    onClick={this.onKeyboardClick}
                    className={keyboardClass}>
                    <img src="/keyboard.svg" alt="keyboard show or hide" className="h-12" />
                </button>
                {this.renderSubmitButton()}
            </form>
        );
    }

    renderInvite() {
        return (
            <div className="m-4 text-center text-xl text-gray-800">
                <p className="">{this.i18n("inviteToDict")}</p>
                <p>
                    {this.i18n("dictSource")}&nbsp;
                    <span>[<a href={buildGcLandingUrl(this.props.lang)}>↗</a>]</span>
                </p>
            </div>
        );
    }

    renderConjugation(detectedForm) {
        if (detectedForm.pos != "v") {
            return null;
        }
        const forms = generatePreviewVerbForms(detectedForm.base, detectedForm.excVerb);
        if (forms.length == 0) {
            return null;
        }
        const url = buildViewerUrl2(
            detectedForm.base,
            /* sentenceType */ SENTENCE_TYPES[0],
            detectedForm.excVerb,
            /* abKey */ null,
            this.props.lang,
            /* auxVerb */ null,
            /* auxNeg */ false
        );
        return (
            <div className="flex flex-row p-4 bg-yellow-100">
                <span>{this.i18n("titleConjugation")}:&nbsp;</span>
                <span className="italic">{forms.join(", ")}</span>
                <span>&nbsp;[<a href={url}>↗</a>]</span>
            </div>
        );
    }

    renderFormDetails(detectedForm) {
        let featureHtmls = [];
        let pos = detectedForm.pos;
        if (pos == "n") {
            const septik = detectedForm.septik;
            if (septik != null && septik != 0) {
                featureHtmls.push(
                    <li className="list-disc ml-4" key={featureHtmls.length}>
                        {this.i18n(`analyzerSeptik_${septik}`)}
                    </li>
                );
            }
            if (detectedForm.grammarPerson) {
                featureHtmls.push(
                    <li className="list-disc ml-4" key={featureHtmls.length}>
                        {this.i18n(`analyzerPoss_${detectedForm.grammarPerson}`)}
                    </li>
                );
            }
        } else if (pos == "v") {
            const tense = detectedForm.tense;
            if (tense != null && tense != "infinitive") {
                featureHtmls.push(
                    <li className="list-disc ml-4" key={featureHtmls.length}>
                        {this.i18n(`analyzerTense_${tense}`)}
                    </li>
                );
            }
            if (detectedForm.sentenceType == SENTENCE_TYPES[1]) {
                featureHtmls.push(
                    <li className="list-disc ml-4" key={featureHtmls.length}>
                        {this.i18n("analyzerNegation")}
                    </li>
                );
            }
            if (detectedForm.grammarPerson) {
                featureHtmls.push(
                    <li className="list-disc ml-4" key={featureHtmls.length}>
                        {this.i18n(`analyzer_${detectedForm.grammarPerson}`)}
                    </li>
                );
            }
        }
        if (detectedForm.grammarNumber == "Plural") {
            featureHtmls.push(
                <li className="list-disc ml-4" key={featureHtmls.length}>
                    {this.i18n("analyzer_Plural")}
                </li>
            );
        }
        if (featureHtmls.length == 0) {
            return (<div></div>);
        }
        return (
            <div className="p-4 bg-gradient-to-br from-gray-100 to-gray-500">
                <h3>{this.i18n("titleForm")} {this.highlightDetectedForm(detectedForm)}</h3>
                <ul>
                    {featureHtmls}
                </ul>
            </div>
        );
    }

    renderTranslations(detectedForm) {
        let glossHtmls = [];
        for (const gloss of detectedForm.ruGlosses) {
            glossHtmls.push(
                <li
                    className="list-disc ml-4 text-xl"
                    key={glossHtmls.length}>
                    {gloss}
                </li>
            );
        }
        if (glossHtmls.length == 0) {
            glossHtmls.push(<li className="h-10" key={glossHtmls.length}></li>);
        }

        return (
            <div className="p-2 bg-gradient-to-tr from-blue-500 to-blue-800 text-white">
                <h3 className="text-sm text-right">{this.i18n("translationTo_ru")}</h3>
                <ul className="ml-2">
                    {glossHtmls}
                </ul>
            </div>
        );
    }

    highlightDetectedForm(detectedForm) {
        const pos = detectedForm.pos;
        if (pos == "n") {
            const phrasal = reproduceNoun(detectedForm);
            return highlightDeclensionPhrasal(phrasal);
        } else if (pos == "v" && detectedForm.tense != "infinitive") {
            const phrasal = reproduceVerb(detectedForm);
            return highlightPhrasal(phrasal, -1);
        } else {
            return [
                <span>{detectedForm.base}</span>
            ];
        }
    }

    renderContribInvite() {
        return (
            <div className="mx-4 my-20 flex flex-row justify-center">
                <p className="max-w-md text-center text-xl text-gray-800">
                    {this.i18n("inviteToContrib")}&nbsp;
                    <span>[<a href={buildGcLandingUrl(this.props.lang)}>↗</a>]</span>
                </p>
            </div>
        );
    }

    renderPos(pos) {
        return (<span className="text-blue-500 text-xs italic pl-2">
            &nbsp;{pos}
        </span>);
    }

    renderFormTransition(word, detectedForm) {
        if (word == detectedForm.base) {
            return null;
        }

        return (<span className="mx-4">
            ⇠&nbsp;{this.highlightDetectedForm(detectedForm)}
        </span>);
    }

    renderTranslationRows(word, detectedForms) {
        let rows = [];
        for (let detectedForm of detectedForms) {
            for (const gloss of detectedForm.ruGlosses) {
                rows.push(
                    <tr
                        className="border-t-2 text-base"
                        key={rows.length}>
                        <td className="bg-gray-200 pl-4 py-2">
                            {gloss}
                        </td>
                        <td className="border-l-2 bg-gray-100 pl-4 py-2">
                            {detectedForm.base}
                            <span className="text-blue-500 text-xs italic pl-2">
                                {this.i18n(`pos_${detectedForm.pos}`)}
                            </span>
                            {this.renderFormTransition(word, detectedForm)}
                        </td>
                    </tr>
                );
            }
        }
        return rows;
    }

    renderDetectedForms() {
        if (this.state.error || this.state.loading) {
            return;
        }
        const word = this.state.word;
        if (word.length == 0) {
            return this.renderInvite();
        }

        const detectedForms = this.state.detectedForms;

        return (
            <div className="flex flex-col">
                <p className="pl-4 text-sm text-gray-600">
                    {this.i18n("kkRuTranslationFor")}&nbsp;{word}
                </p>
                <table className="my-4 w-full">
                    <tbody>
                        <tr className="bg-gray-600 text-white">
                            <th className="w-1/2 py-2">{this.i18n("ru")}</th>
                            <th className="w-1/2 py-2 border-l-2">{this.i18n("kk")}</th>
                        </tr>
                        {this.renderTranslationRows(word, detectedForms)}
                    </tbody>
                </table>
                {this.renderContribInvite()}
            </div>
        );
    }

    renderStatus() {
        if (this.state.error) {
            return (
                <p className="text-center text-2xl text-red-600">{this.i18n("gotError")}</p>
            );
        } else if (this.state.loading) {
            return (
                <p className="text-center text-2xl text-gray-600">
                    {this.i18n("isLoading")}
                </p>
            );
        } else {
            return null;
        }
    }

    render() {
        return (
            <div onClick={this.onBgClick} className="flex flex-row justify-center">
                <div className="flex flex-col">
                    <h1 className="text-center text-4xl italic text-gray-600">
                        <a href={buildDictUrl("", this.props.lang)}>
                            {this.i18n("titleDictKkRu")}
                        </a>
                    </h1>
                    {this.renderForm()}
                    {this.renderKeyboard()}
                    {this.renderDetectedForms()}
                    {this.renderStatus()}
                </div>
            </div>
        );

    }
}

export default DictApp;