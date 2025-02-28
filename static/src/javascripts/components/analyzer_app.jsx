import React from "react";
import { i18n } from "../lib/i18n";
import { makeAnalyzeRequest, makeDetectRequest } from "../lib/requests";
import { AnalyzedPart, parseAnalyzeResponse } from "../lib/analyzer";
import { AnalyzedPartView } from "./analyzed_part_view";
import { pickRandom } from "../lib/random";
import { buildTextAnalyzerUrl, buildTextAnalyzerBookUrl, parseParams } from "../lib/url";
import { catCompletion } from "../lib/suggest";
import { backspaceTextInput, insertIntoTextInput, Keyboard } from "./keyboard";
import { checkForEmulation } from "../lib/layout";
import { copyToClipboard } from "../lib/clipboard";
import { ShareButton } from "./share_button";
import { grammarHelp } from "../lib/grammar_help";
import { gcGetBookChunks } from "../lib/gc_api";

const DEMO_POOL = [
    "Парижден оралған спортшылардан коронавирус анықталған",
    "Аумағы жөнінен Каспий, Арал теңіздерінен кейінгі үшінші орында, әлемдегі ең үлкен көлдер тізімінде он төртінші орында",
    "Морфологиялық құрамы жағынан етістіктер дара етістіктер мен күрделі етістіктер деп аталатын екі салаға бөлінеді",
    "Сені мен жұма күні құтқардым, сондықтан сенің атың Жұма болады деп түсіндірдім",
    "Құдай тағала әрбір ақылы бар кісіге иман парыз, әрбір иманы бар кісіге ғибадат парыз деген екен",
];

function pickDemoSentence(cur) {
    for (let i = 0; i < 3; ++i) {
        const pick = pickRandom(DEMO_POOL);
        if (pick != cur) {
            return pick;
        }
    }
    return pickRandom(DEMO_POOL);
}

const BOOK101_LEN = 187;
const BOOK_TITLE = "Ер Төстік";

/**
 * props:
 * - lang: string
 */
class AnalyzerApp extends React.Component {
    constructor(props) {
        super(props);

        this.handleSuggestResponse = this.handleSuggestResponse.bind(this);
        this.handleSuggestError = this.handleSuggestError.bind(this);
        this.handleAnalyzeResponse = this.handleAnalyzeResponse.bind(this);
        this.handleAnalyzeError = this.handleAnalyzeError.bind(this);
        this.handleBookChunkResponse = this.handleBookChunkResponse.bind(this);
        this.handleBookChunkError = this.handleBookChunkError.bind(this);
        this.onPageNumberChange = this.onPageNumberChange.bind(this);
        this.onPageNumberSubmit = this.onPageNumberSubmit.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onInsert = this.onInsert.bind(this);
        this.onBackspace = this.onBackspace.bind(this);
        this.onKeyboardClick = this.onKeyboardClick.bind(this);
        this.onChange = this.onChange.bind(this);
        this.onDemo = this.onDemo.bind(this);
        this.onGrammarToggle = this.onGrammarToggle.bind(this);
        this.onTranslationsToggle = this.onTranslationsToggle.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.onHintClick = this.onHintClick.bind(this);

        const state = this.readUrlState();
        this.state = state;
        if (state.text.length > 0) {
            this.startAnalysis(state.text);
        } else if (state.bookId > 0) {
            this.startBookLoad(state.bookId, state.offset, state.count);
        }
    }

    makeState(text, analyzing, bookId, bookChunkLoading, offset, count) {
        return {
            text: text,
            lastEntered: text,
            enableDemo: text.length == 0 && !analyzing,
            suggestions: [],
            tab: false,
            grammar: true,
            translations: false,
            keyboard: false,
            analyzing: analyzing,
            error: false,
            breakdown: [],
            popupCue: null,
            bookId: bookId,
            bookChunkLoading: bookChunkLoading,
            offset: offset,
            lastEnteredPage: String(offset + 1),
            count: count,
        };
    }

    defaultState() {
        return this.makeState(
            /* text */ "",
            /* analyzing */ false,
            /* bookId */ null,
            /* bookChunkLoading */ false,
            /* offset */ 0,
            /* count */ 1,
        );
    }

    readUrlState() {
        const params = parseParams();
        const text = params.text;
        if (text != null && text.length > 0) {
            return this.makeState(
                text,
                /* analyzing */ true,
                /* bookId */ null,
                /* bookChunkLoading */ false,
                /* offset */ 0,
                /* count */ 1,
            );
        }
        const bookIdStr = params.book_id;
        if (bookIdStr != null && Number(bookIdStr) > 0) {
            const bookId = Number(bookIdStr);
            const offsetStr = params.offset || "0";
            const countStr = params.count || "1";
            const offset = Number(offsetStr);
            const count = Number(countStr);
            return this.makeState(
                /* text */ "",
                /* analyzing */ true,
                bookId,
                /* bookChunkLoading */ true,
                offset,
                count,
            );
        }
        return this.defaultState();
    }

    i18n(key) {
        return i18n(key, this.props.lang);
    }

    async handleSuggestResponse(context, responseJsonPromise) {
        let response = await responseJsonPromise;
        const fragment = context.fragment;

        const textArea = this.refs.textInput;
        const selectionStart = textArea.selectionStart;

        if (selectionStart < fragment.length) {
            console.log("handleSuggestResponse: expected fragment doesn't fit");
            return;
        }

        const lastEntered = this.state.lastEntered;
        const actual = lastEntered.substr(selectionStart - fragment.length, fragment.length).toLowerCase();
        if (actual != fragment) {
            console.log(`handleSuggestResponse: actual text [${actual}] doesn't match expected [${fragment}]`);
            return;
        }

        let suggestions = [];
        const inSuggestions = response.suggestions;
        if (inSuggestions && inSuggestions.length > 0) {
            for (let i = 0; i < inSuggestions.length; ++i) {
                const raw = catCompletion(inSuggestions[i]);
                if (raw.length == fragment.length) {
                    continue;
                }
                suggestions.push({
                    completion: inSuggestions[i].completion,
                    raw: raw,
                });
            }
        }
        this.setState({ suggestions });
    }

    async handleSuggestError(context, responseTextPromise) {
        let responseText = await responseTextPromise;
        console.log(`Got error from suggest: ${responseText}, fragment ${context.fragment}`);
    }

    startSuggest(fragmentRaw) {
        const fragment = fragmentRaw.toLowerCase();
        makeDetectRequest(
            fragment,
            /* suggest */ true,
            /* onlyVerbs */ false,
            this.handleSuggestResponse,
            this.handleSuggestError,
            { fragment }
        );
    }

    suggest(lastEntered) {
        const limit = 32;
        const textArea = this.refs.textInput;
        const selectionStart = textArea.selectionStart;
        const position = selectionStart < lastEntered.length ? selectionStart : lastEntered.length;

        const start = Math.max(position - limit, 0);
        // find the last preceding whitespace symbol to request suggestions using the fragment that goes after
        for (let i = position - 1; i >= start; --i) {
            if (/\s/.test(lastEntered[i])) {
                if (i == position - 1) {
                    return;
                }
                const fragment = lastEntered.substr(i + 1, position - i - 1);
                this.startSuggest(fragment);
                return;
            }
        }
        if (0 < position && position <= limit) {
            const fragment = lastEntered.substr(0, position);
            this.startSuggest(fragment);
        }
    }

    checkToSuggest(lastEntered, prevEntered) {
        const diff = lastEntered.length - prevEntered.length;
        if (lastEntered.length > 0 && (diff == -1 || diff == 1)) {
            this.suggest(lastEntered);
        }
    }

    async handleAnalyzeResponse(context, responseJsonPromise) {
        let response = await responseJsonPromise;
        let analyzedParts = parseAnalyzeResponse(response);
        let filteredParts = [];
        for (const part of analyzedParts) {
            let filteredForms = [];
            for (const candidate of part.detectedForms) {
                if (candidate.tense != "infinitive") {
                    filteredForms.push(candidate);
                }
            }
            if (filteredForms.length > 0) {
                filteredParts.push(new AnalyzedPart(part.token, filteredForms));
            } else {
                /*
                 * Split unrecognized content into lines and insert parts with "\n" in-between,
                 * so that we can split the breakdown into flex-rows during rendering.
                 */
                const lines = part.token.split("\n");
                filteredParts.push(new AnalyzedPart(lines[0], []));
                for (let i = 1; i < lines.length; ++i) {
                    filteredParts.push(new AnalyzedPart("\n", []));
                    filteredParts.push(new AnalyzedPart(lines[i], []));
                }
            }
        }
        this.setState({ analyzing: false, error: false, breakdown: filteredParts });
    }

    async handleAnalyzeError(context, responseTextPromise) {
        let responseText = await responseTextPromise;
        console.log(`Got error from /analyze: ${responseText}, text was ${context.text}.`);
        this.setState({ analyzing: false, error: true });
    }

    startAnalysis(text) {
        if (text.length == 0) {
            return;
        }
        makeAnalyzeRequest(
            text,
            this.handleAnalyzeResponse,
            this.handleAnalyzeError,
            {
                text: text,
            }
        );
    }

    async handleBookChunkResponse(context, responseJsonPromise) {
        const response = await responseJsonPromise;
        const chunks = response.chunks;
        let textParts = [];
        for (const chunk of chunks) {
            textParts.push(chunk.content);
        }
        const text = textParts.join("\n");
        const lastEntered = text;
        const bookChunkLoading = false;
        this.setState(
            { text, lastEntered, bookChunkLoading },
            () => {
                window.scrollTo(0, 0);
            }
        );
        this.startAnalysis(text);
    }

    async handleBookChunkError(context, responseTextPromise) {
        let responseText = await responseTextPromise;
        console.log(`Got error from /get_book_chunks: ${responseText}, bookId was ${context.bookId}.`);
        this.setState({ analyzing: false, bookChunkLoading: false, error: true });
    }

    startBookLoad(bookId, offset, count) {
        gcGetBookChunks(
            bookId,
            offset,
            count,
            this.handleBookChunkResponse,
            this.handleBookChunkError,
            { bookId }
        );
    }

    updateText(change) {
        const prevEntered = this.state.lastEntered;
        this.setState(
            { lastEntered: change.newText, enableDemo: false },
            () => {
                const wi = this.refs.textInput;
                wi.selectionStart = change.newSelectionStart;
                wi.selectionEnd = change.newSelectionStart;
                wi.focus();

                this.checkToSuggest(change.newText, prevEntered);
            }
        );
    }

    onInsert(fragment) {
        const textInput = this.refs.textInput;
        const change = insertIntoTextInput(textInput, fragment);
        this.updateText(change);
    }

    onBackspace() {
        const textInput = this.refs.textInput;
        const change = backspaceTextInput(textInput);
        this.updateText(change);
    }

    onChange(event) {
        let lastEntered = event.target.value;
        const enableDemo = false;
        this.setState({ lastEntered, enableDemo });
        this.checkToSuggest(lastEntered, this.state.lastEntered);
    }

    /**
     * If TAB press is followed by a digit I press,
     * it indicates that I-th suggestion should be applied
     */
    checkToComplete(e) {
        const code = e.nativeEvent.code;
        if (!code.startsWith("Digit")) {
            return false;
        }
        const digit = Number(code.substr(5));
        if (!digit) {
            return false;
        }
        const suggestion = this.state.suggestions[digit - 1];
        if (!suggestion) {
            return false;
        }
        const completion = suggestion.completion;
        this.completeWith(completion);
        return true;
    }

    onKeyDown(e) {
        if (e.key === "Enter" && e.ctrlKey) {
            this.onSubmit(e);
            return;
        }
        const tab = this.state.tab;
        if (e.key === "Tab") {
            if (this.state.suggestions.length == 1) {
                e.preventDefault();
                this.completeWith(this.state.suggestions[0].completion);
                return;
            } else if (tab) {
                this.setState({ tab: false });
            } else {
                e.preventDefault();
                this.setState({ tab: true });
                return;
            }
        } else if (tab && this.checkToComplete(e)) {
            e.preventDefault();
            return;
        }
        const replace = checkForEmulation(e);
        if (replace == null) {
            return;
        }
        e.preventDefault();
        this.onInsert(replace);
    }

    completeWith(completion) {
        let lastEntered = this.state.lastEntered;
        const textArea = this.refs.textInput;
        const selectionStart = textArea.selectionStart;
        const selectionEnd = textArea.selectionEnd;
        let matches = false;
        let newPosition = -1;
        for (let j = 0; j < completion.length; ++j) {
            if (!completion[j].hl) {
                if (matches) {
                    const prefix = lastEntered.substr(0, selectionStart);
                    const insertion = completion[j].text;
                    const suffix = lastEntered.substr(selectionEnd);
                    lastEntered = `${prefix}${insertion}${suffix}`;
                    newPosition = prefix.length + insertion.length;
                } else {
                    console.log("completeWith: no match with expected part");
                    break;
                }
                break;
            } else {
                const text = completion[j].text;
                if (selectionStart < text.length) {
                    console.log("completeWith: expected text is too long to fit");
                    break;
                }
                const actual = lastEntered.substr(selectionStart - text.length, text.length).toLowerCase();
                if (actual != text) {
                    console.log(`completeWith: actual text [${actual}] doesn't match expected [${text}]`);
                    break;
                }
                matches = true;
            }
        }
        const tab = false;
        const suggestions = [];
        this.setState(
            { lastEntered, tab, suggestions },
            () => {
                if (newPosition >= 0) {
                    const wi = this.refs.textInput;
                    wi.selectionStart = newPosition;
                    wi.selectionEnd = newPosition;
                    wi.focus();
                }
            }
        );
    }

    renderSuggestions() {
        const suggestions = this.state.suggestions;
        let htmlParts = [];
        let keyCounter = 0;
        for (let i = 0; i < 5 && i < suggestions.length; ++i) {
            const completion = suggestions[i].completion;
            let completionParts = [];
            for (let j = 0; j < completion.length; ++j) {
                const spanClass = completion[j].hl ? "text-blue-500" : "text-blue-300";
                completionParts.push(
                    <span key={keyCounter} className={spanClass}>
                        {completion[j].text}
                    </span>
                );
                keyCounter += 1;
            }
            const tabDigit = (
                (suggestions.length > 1)
                ? (<span className="border-2 border-gray-600 px-2 mx-2">{i + 1}</span>)
                : null
            );
            htmlParts.push(
                <div key={keyCounter}
                    className="mx-2 cursor-pointer flex flex-col"
                    onClick={(e) => this.completeWith(completion)}>
                    <div>
                        {completionParts}
                    </div>
                    <div className="my-2 flex flex-row justify-center text-gray-600 text-xs">
                        <span className="border-2 border-gray-600 px-2">Tab</span>
                        {tabDigit}
                    </div>
                </div>
            );
            keyCounter += 1;
        }
        if (htmlParts.length == 0) {
            htmlParts.push(<span key={keyCounter} className="invisible">placeholder</span>);
            keyCounter += 1;
        }
        return (
            <div className="mx-2 text-3xl flex flex-row flex-wrap justify-evenly bg-gray-100">
                {htmlParts}
            </div>
        );
    }

    onDemo(event) {
        event.preventDefault();

        if (this.state.analyzing) {
            console.log("already analyzing");
            return;
        }

        const text = pickDemoSentence(this.state.lastEntered);
        const lastEntered = text;
        const analyzing = true;
        const suggestions = [];
        this.setState({ text, lastEntered, suggestions, analyzing });
        const newUrl = buildTextAnalyzerUrl(lastEntered, this.props.lang);
        window.history.pushState(null, "", newUrl);
        this.startAnalysis(text);
    }

    renderLeftControls() {
        let htmlParts = [];
        if (this.state.enableDemo) {
            htmlParts.push(
                <button
                    key="demo"
                    onClick={this.onDemo}
                    className="bg-indigo-500 hover:bg-indigo-700 text-white text-lg font-bold px-4 rounded focus:outline-none focus:shadow-outline">
                    DEMO
                </button>
            );
        }
        if (this.state.lastEntered.length > 0) {
            const urlPart = buildTextAnalyzerUrl(this.state.lastEntered, this.props.lang);
            const url = `${window.location.protocol}//${window.location.host}${urlPart}`;
            htmlParts.push(
                <img
                    key="copy"
                    className="mx-2 h-12 w-12"
                    onClick={(e) => { copyToClipboard(this.state.lastEntered); }}
                    src={"/copy.svg"} />
            );
            htmlParts.push(
                <ShareButton key="share" url={url} imgSize="h-12" />
            );
        }
        return (<div className="flex flex-row">
            {htmlParts}
        </div>);
    }

    onSubmit(event) {
        event.preventDefault();
        const lastEntered = this.state.lastEntered;
        if (lastEntered.length == 0) {
            console.log("empty input");
            return;
        }
        if (this.state.analyzing) {
            console.log("already analyzing");
            return;
        }
        const newUrl = buildTextAnalyzerUrl(lastEntered, this.props.lang);
        window.history.pushState(null, "", newUrl);

        const text = lastEntered;
        const suggestions = [];
        const analyzing = true;
        this.setState({ text, suggestions, analyzing });
        this.startAnalysis(lastEntered);
    }

    onGrammarToggle(event) {
        const grammar = !this.state.grammar;
        this.setState({ grammar });
    }

    onTranslationsToggle(event) {
        const translations = !this.state.translations;
        this.setState({ translations });
    }

    renderToggler(on, handler, labelKey) {
        return (
            <div
                className="mx-4 rounded flex flex-row cursor-pointer select-none"
                onClick={handler}>
                <img
                    className="mx-2 h-8"
                    src={on ? "/toggle_on.svg" : "/toggle_off.svg"}
                />
                <span className="text-xl">{this.i18n(labelKey)}</span>
            </div>
        );
    }

    onKeyboardClick(e) {
        e.preventDefault();
        const keyboard = !this.state.keyboard;
        this.setState({ keyboard });
    }

    renderControls() {
        const keyboardClass = (
            this.state.keyboard
            ? "mx-2 px-2 bg-blue-600 hover:bg-blue-700 focus:outline-none rounded"
            : "mx-2 px-2 bg-gray-400 hover:bg-gray-600 focus:outline-none rounded"
        );
        return (
            <div className="flex flex-row">
                {this.renderToggler(this.state.grammar, this.onGrammarToggle, "toggleGrammar")}
                {this.renderToggler(this.state.translations, this.onTranslationsToggle, "toggleTranslations")}
                <button
                    type="button"
                    onClick={this.onKeyboardClick}
                    className={keyboardClass}>
                    <img src="/keyboard.svg" alt="keyboard show or hide" className="h-12" />
                </button>
                {this.renderSubmitButton()}
            </div>
        );
    }

    renderSubmitButton() {
        if (this.state.analyzing) {
            return (
                <button
                    type="submit"
                    disabled
                    className="bg-gray-500 hover:bg-gray-500 text-white text-4xl font-bold px-4 rounded focus:outline-none">
                    ⋯
                </button>
            );
        } else {
            return (
                <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-700 text-white text-4xl font-bold px-4 rounded focus:outline-none focus:shadow-outline">
                    →
                </button>
            );
        }
    }

    renderForm() {
        return (
            <form onSubmit={this.onSubmit} className="px-3 py-2 flex flex-col">
                <textarea
                    ref="textInput"
                    rows="3"
                    cols="32"
                    autoFocus
                    onChange={this.onChange}
                    onKeyDown={this.onKeyDown}
                    value={this.state.lastEntered}
                    maxLength="2048"
                    required
                    className="shadow appearance-none border rounded mx-2 p-2 text-4xl lg:text-2xl text-gray-700 focus:outline-none focus:shadow-outline"
                    placeholder={this.i18n("hintEnterTextForAnalysis")}
                    />
                {this.renderSuggestions()}
                <div className="p-2 flex flex-row justify-between">
                    {this.renderLeftControls()}
                    {this.renderControls()}
                </div>
            </form>
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
                    backspaceCallback={this.onBackspace}
                    enterCallback={this.onSubmit}
                />
            </div>
        );
    }

    renderIntro() {
        if (this.state.error || this.state.analyzing || this.state.popupCue != null) {
            return null;
        }
        let msg1 = null;
        let msg2 = null;
        if (this.state.breakdown.length == 0) {
            msg1 = "analyzerIntro";
            msg2 = (Math.random() < 0.5) ? "demoHint" : "ctrEnterHint";
        } else {
            msg1 = "clipboardHint";
            msg2 = "clearHint";
        }
        return (
            <div className="flex flex-row justify-center">
                <div className="lg:w-1/5">
                    <p className="m-2 p-4 border-2 rounded-2xl bg-blue-100 text-gray-700">{this.i18n(msg1)}</p>
                    <p className="m-2 p-4 border-2 rounded-2xl bg-indigo-100 text-gray-700">{this.i18n(msg2)}</p>
                </div>
            </div>
        );
    }

    renderLibEntry() {
        if (this.state.error || this.state.analyzing || this.state.text.length > 0) {
            return null;
        }
        return (
            <div className="flex flex-row justify-center my-10">
                <div className="lg:w-1/3">
                    <h3 className="m-4 text-2xl text-gray-700">{this.i18n("libTitle")}</h3>
                    <ul>
                        <li className="list-inside">
                            <a href={buildTextAnalyzerBookUrl(1001, 0, 1, this.props.lang)}>
                                <div className="flex flex-row">
                                    <img className="mx-2 h-12 w-12" src="/book.svg" />
                                    <div className="flex flex-col">
                                        <div className="text-lg font-bold">{BOOK_TITLE}</div>
                                        <div className="italic text-gray-700">{this.i18n("heroicTale")}</div>
                                    </div>
                                </div>
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        );
    }

    renderAppStatus() {
        if (this.state.error) {
            return (
                <p className="text-center text-2xl text-red-600">{this.i18n("gotError")}</p>
            );
        } else if (this.state.bookChunkLoading) {
            return (
                <p className="text-center text-2xl text-gray-600">
                    {this.i18n("bookLoading")}
                </p>
            );
        } else if (this.state.analyzing) {
            return (
                <p className="text-center text-2xl text-gray-600">
                    {this.i18n("analyzing")}
                </p>
            );
        } else {
            return null;
        }
    }

    closePopup() {
        const popupCue = null;
        this.setState({ popupCue });
    }

    renderPopup(popupCue) {
        if (popupCue == null) {
            return null;
        }

        let help = grammarHelp(popupCue, this.props.lang);
        let shortDescription = null;
        let references = null;
        if (help != null) {
            if (help[0].length > 0) {
                shortDescription = (
                    <p className="p-2 text-xl text-gray-600">{help[0]}</p>
                );
            }
            if (help[1].length > 0) {
                let htmlParts = [];
                for (const reference of help[1]) {
                    const title = reference[0];
                    const href = reference[1];
                    htmlParts.push(
                        <li className="" key={htmlParts.length}>
                            <a className="text-blue-500" href={href}>{title}</a>
                        </li>
                    );
                }
                references = (
                    <ol className="p-2 list-decimal list-inside text-gray-600 text-xl">
                        {htmlParts}
                    </ol>
                );
            }
        }


        return (
            <div className="absolute z-60 w-full flex flex-row justify-center">
                <div className="bg-blue-100 w-1/3 border-2 rounded-2xl">
                    <div className="flex flex-row justify-between border-b-2 text-gray-500">
                        <h3 className="p-2 text-sm">{this.i18n("grammarTip")}</h3>
                        <span
                            className="p-2 text-sm border-l-2 cursor-pointer"
                            onClick={(e) => this.closePopup()}>X</span>
                    </div>
                    <h4 className="text-3xl text-gray-600 text-center">{this.i18n(popupCue)}</h4>
                    {shortDescription}
                    {references}
                </div>
            </div>
        );
    }

    moveBookToOffset(offset) {
        if (!(0 <= offset && offset < BOOK101_LEN)) {
            console.log(`move to offset ${offset} not possible`);
            return;
        }
        const bookChunkLoading = true;
        const analyzing = true;
        const lastEnteredPage = String(offset + 1);
        this.setState({ analyzing, bookChunkLoading, offset, lastEnteredPage });
        const newUrl = buildTextAnalyzerBookUrl(1001, offset, 1, this.props.lang);
        window.history.pushState(null, "", newUrl);
        this.startBookLoad(this.state.bookId, offset, 1);
    }

    bookPage(move) {
        const offset = this.state.offset + move;
        this.moveBookToOffset(offset);
    }

    onPageNumberChange(event) {
        const lastEnteredPage = event.target.value;
        this.setState({ lastEnteredPage });
    }

    onPageNumberSubmit(event) {
        event.preventDefault();
        const number = Number(this.state.lastEnteredPage);
        const offset = number - 1;
        this.moveBookToOffset(offset);
    }

    onHintClick(popupCue) {
        this.setState({ popupCue });
    }

    renderBreakdown() {
        let rows = [];
        let row = [];

        const popupCue = this.state.popupCue;
        const rowVisibility = popupCue != null ? "invisible" : "";
        const rowClass = `flex flex-row flex-wrap ${rowVisibility}`;

        const flushRow = function() {
            if (row.length > 0) {
                rows.push(
                    <div key={rows.length} className={rowClass}>
                        {row}
                    </div>
                );
                row = [];
            }
        }

        const addBookTitle = function() {
            row.push(
                <div key="only" className="w-full my-2 text-4xl italic text-gray-500 text-center">
                    {BOOK_TITLE}
                </div>
            );
            flushRow();
        };

        const addPagination = function(app) {
            const offset = app.state.offset;
            const prevColor = (
                offset > 0
                ? "text-gray-500 cursor-pointer hover:bg-gray-200"
                : "text-gray-300"
            );
            const nextColor = (
                (offset + 1 < BOOK101_LEN)
                ? "text-gray-500 cursor-pointer hover:bg-gray-200"
                : "text-gray-300"
            );
            row.push(
                <div key="only" className={`my-4 flex flex-row text-5xl w-full ${rowVisibility}`}>
                    <div
                        onClick={ (e) => app.bookPage(-1) }
                        className={`text-right px-10 bg-gradient-to-l from-gray-100 w-1/2 select-none ${prevColor}`}>←</div>
                    <form
                        onSubmit={app.onPageNumberSubmit}
                        className="flex flex-row text-2xl bg-gray-100 p-3">
                        <input type="text" size="4" maxLength="5" pattern="\d{1,5}" value={app.state.lastEnteredPage}
                            onChange={app.onPageNumberChange}
                            className="shadow appearance-none border rounded px-2 text-center focus:outline-none focus:shadow-outline" />
                        <span className="p-2">
                            {app.i18n("ofTotal")}&nbsp;{BOOK101_LEN}
                        </span>
                    </form>
                    <div
                        onClick={ (e) => app.bookPage(1) }
                        className={`px-10 bg-gradient-to-r from-gray-100 w-1/2 select-none ${nextColor}`}>→</div>
                </div>
            );
            flushRow();
        }

        const bookId = this.state.bookId;
        const grammar = this.state.grammar;
        const translations = this.state.translations;

        if (bookId > 0) {
            addBookTitle();
            addPagination(this);
        }

        for (const part of this.state.breakdown) {
            if (part.detectedForms.length == 0 && part.token == "\n") {
                flushRow();
                continue;
            }
            row.push(
                <AnalyzedPartView
                    key={row.length}
                    analyzedPart={part}
                    grammar={grammar}
                    translations={translations}
                    hintCallback={this.onHintClick}
                    lang={this.props.lang}
                />
            );
        }
        flushRow();
        if (bookId > 0) {
            addPagination(this);
        }
        return (
            <div className="m-4 flex flex-col">
                {rows}
                {this.renderPopup(popupCue)}
            </div>
        );
    }

    render() {
        return (
            <div className="flex flex-col w-full">
                <h1 className="text-center text-4xl italic text-gray-600">
                    <a href={buildTextAnalyzerUrl("", this.props.lang)}>
                        {this.i18n("titleTextAnalyzer")}
                    </a>
                </h1>
                {this.renderForm()}
                {this.renderKeyboard()}
                {this.renderBreakdown()}
                {this.renderAppStatus()}
                {this.renderLibEntry()}
            </div>
        );
    }
}

export default AnalyzerApp;