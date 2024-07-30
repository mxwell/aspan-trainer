import React from "react";
import { closeButton } from "./close_button";
import { PARTS_OF_SPEECH, TransDirection, buildDirectionByKeyMap } from "../lib/gc";
import { i18n } from "../lib/i18n";
import { trimAndLowercase } from "../lib/input_validation";
import { gcGetWords } from "../lib/gc_api";
import GcWordStart from "./gc_word_start";

const DIRECTIONS = [
    new TransDirection("kk", "ru"),
    new TransDirection("kk", "en"),
];

const DIRECTION_BY_KEY = buildDirectionByKeyMap(DIRECTIONS);

/**
 * props:
 * - lang
 */
class GcCreateApp extends React.Component {
    constructor(props) {
        super(props);

        this.onDirectionChange = this.onDirectionChange.bind(this);
        this.onDirectionReset = this.onDirectionReset.bind(this);
        this.onWordChange = this.onWordChange.bind(this);
        this.handleGetWordsResponse = this.handleGetWordsResponse.bind(this);
        this.handleGetWordsError = this.handleGetWordsError.bind(this);
        this.onWordSubmit = this.onWordSubmit.bind(this);
        this.onWordReset = this.onWordReset.bind(this);
        this.onWordSelect = this.onWordSelect.bind(this);
        this.onWordSelectionSubmit = this.onWordSelectionSubmit.bind(this);
        this.onWordSelectionReset = this.onWordSelectionReset.bind(this);
        this.onExcVerbChange = this.onExcVerbChange.bind(this);
        this.onNewWordSubmit = this.onNewWordSubmit.bind(this);
        this.onNewWordDetailsReset = this.onNewWordDetailsReset.bind(this);

        this.onTranslationChange = this.onTranslationChange.bind(this);
        this.onTranslationSubmit = this.onTranslationSubmit.bind(this);
        this.onTranslationReset = this.onTranslationReset.bind(this);

        this.state = this.defaultState();
    }

    makeState(direction) {
        return {
            direction: direction,
            word: null,
            lastEnteredWord: "",
            foundWords: null,
            preselectedWordId: null,
            selectedWordId: null,
            preselectedPos: null,
            selectedPos: null,
            preExcVerb: false,
            excVerb: null,
            translation: null,
            lastEnteredTranslation: "",
            foundTranslations: null,
            error: false,
        };
    }

    defaultState() {
        return this.makeState(
            /* direction */ null,
        );
    }

    i18n(key) {
        return i18n(key, this.props.lang);
    }

    onDirectionChange(event) {
        let key = event.target.value;
        console.log(`onDirectionChange: key ${key}`);
        let direction = DIRECTION_BY_KEY[key];
        if (direction) {
            this.setState({ direction });
        }
    }

    onDirectionReset(event) {
        event.preventDefault();
        this.setState(this.defaultState());
    }

    onWordChange(event) {
        let lastEnteredWord = event.target.value;
        this.setState({ lastEnteredWord });
    }

    async handleGetWordsResponse(context, responseJsonPromise) {
        const response = await responseJsonPromise;
        const words = response.words;
        console.log(`Got words: ${JSON.stringify(words)}`);
        if (context.isTranslation == true) {
            this.setState({ foundTranslations: words })
        } else {
            this.setState({ foundWords: words });
        }
    }

    async handleGetWordsError(context, responseTextPromise) {
        let responseText = await responseTextPromise;
        console.log(`Got error from get_words: ${responseText}, params were: ${context.w}, ${context.word}, ${context.lang}, ${context.isTranslation}`);
        const error = true;
        this.setState({ error });
    }

    startGetWords(word, lang, isTranslation) {
        gcGetWords(
            word,
            lang,
            this.handleGetWordsResponse,
            this.handleGetWordsError,
            {
                word,
                lang,
                isTranslation,
            }
        );
    }

    onWordSubmit(event) {
        event.preventDefault();
        const lastEntered = this.state.lastEnteredWord;
        const word = trimAndLowercase(lastEntered);
        if (word.length == 0) {
            console.log(`onWordSubmit: empty input [${lastEntered}]`)
            return;
        }
        this.startGetWords(word, this.state.direction.src, false);
        this.setState({ word });
    }

    onWordReset(event) {
        event.preventDefault();
        this.setState({
            word: null,
            foundWords: null,
            preselectedWordId: null,
            selectedWordId: null,
            preselectedPos: null,
            selectedPos: null,
            preExcVerb: null,
            excVerb: null,
            error: null,
        });
    }

    onWordSelect(index) {
        const preselectedWordId = index;
        this.setState({ preselectedWordId });
    }

    onWordSelectionSubmit(event) {
        event.preventDefault();
        const selectedWordId = this.state.preselectedWordId;
        this.setState({ selectedWordId });
    }

    onWordSelectionReset(event) {
        event.preventDefault();
        this.setState({
            selectedWordId: null,
            preselectedPos: null,
            selectedPos: null,
            preExcVerb: null,
            excVerb: null,
        });
    }

    onNewWordPosSelect(pos) {
        const preselectedPos = pos;
        this.setState({ preselectedPos });
    }

    onExcVerbChange(event) {
        const preExcVerb = event.target.checked;
        this.setState({ preExcVerb });
    }

    onNewWordSubmit(event) {
        event.preventDefault();
        const selectedPos = this.state.preselectedPos;
        const excVerb = selectedPos == "VERB" && this.state.preExcVerb;
        this.setState({ selectedPos, excVerb });
    }

    onNewWordDetailsReset(event) {
        event.preventDefault();
        this.setState({
            preselectedPos: null,
            selectedPos: null,
            preExcVerb: null,
            excVerb: null,
        });
    }

    onTranslationChange(event) {
        let lastEnteredTranslation = event.target.value;
        this.setState({ lastEnteredTranslation });
    }

    onTranslationSubmit(event) {
        event.preventDefault();
        const lastEntered = this.state.lastEnteredTranslation;
        const translation = trimAndLowercase(lastEntered);
        if (translation.length == 0) {
            console.log(`onTranslationSubmit: empty input [${lastEntered}]`)
            return;
        }
        this.startGetWords(translation, this.state.direction.dst, true);
        this.setState({ translation });
    }

    onTranslationReset(event) {
        event.preventDefault();
        this.setState({
            translation: null,
            foundTranslations: null,
            error: null,
        });
    }

    renderDirectionPart(direction) {
        if (direction == null) {
            let selectOptions = [
                <option key="start" value="">{this.i18n("select")}</option>
            ];
            for (let d of DIRECTIONS) {
                const key = d.toKey();
                selectOptions.push(
                    <option key={key} value={key}>
                        {this.i18n(key)}
                    </option>
                );
            }
            return (
                <form className="my-2 flex flex-row w-full bg-gray-200 rounded">
                    <p className="px-4 py-4 text-2xl">
                        {this.i18n("transDirection")}:
                    </p>
                    <select
                        required
                        onChange={this.onDirectionChange}
                        value=""
                        className="text-gray-800 text-2xl mx-2 px-4 py-2">
                        {selectOptions}
                    </select>
                </form>
            );
        } else {
            const key = direction.toKey();
            return (
                <div className="my-2 flex flex-row justify-between w-full bg-gray-200 rounded">
                    <span className="px-4 py-4 text-2xl">
                        {this.i18n("transDirection")}:
                    </span>
                    <span className="py-4 text-2xl">
                        {this.i18n(key)}
                    </span>
                    {closeButton({ onClick: this.onDirectionReset })}
                </div>
            );
        }
    }

    renderWordPart(direction, word) {
        if (direction == null) {
            return null;
        }
        return (
            <GcWordStart
                lang={this.props.lang}
                wordLang={direction.src}
                lastEntered={this.state.lastEnteredWord}
                word={word}
                changeCallback={this.onWordChange}
                submitCallback={this.onWordSubmit}
                resetCallback={this.onWordReset} />
        );
    }

    renderPos(pos, excVerb, textSize) {
        if (pos) {
            const spanClass = `text-blue-500 ${textSize} italic`
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
                        onChange={(e) => { this.onWordSelect(index) }}
                        name="wordSelector" />
                    <label
                        className="mx-2"
                        htmlFor={index} >
                        {entry.word}&nbsp;{this.renderPos(entry.pos, entry.exc_verb, "text-xs")}
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
                    onChange={(e) => { this.onWordSelect(foundWords.length) }}
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
                onSubmit={this.onWordSelectionSubmit}
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
                {entry.word}&nbsp;{this.renderPos(entry.pos, entry.exc_verb, "text-xs")}
            </span>
        );
    }

    renderWordSelection(word, foundWords, selectedWordId) {
        if (word == null) {
            return null;
        }
        if (foundWords == null) {
            return (
                <div className="my-2 border-2 border-gray-400 w-full rounded">
                    <p className="px-4 py-4 text-2xl italic text-center">{this.i18n("loadingWords")}</p>
                </div>
            );
        }
        if (selectedWordId == null) {
            return this.renderWordSelector(foundWords);
        } else {
            return (
                <div className="my-2 flex flex-row justify-between w-full bg-gray-200 rounded">
                    <span className="px-4 py-4 text-2xl">
                        {this.renderSelectedWord(foundWords, selectedWordId)}
                    </span>
                    {closeButton({ onClick: this.onWordSelectionReset })}
                </div>
            );
        }
    }

    renderNewWordForm(direction, word, foundWords, selectedWordId) {
        if (word == null || foundWords == null || selectedWordId != foundWords.length) {
            return null;
        }
        let radios = [];
        for (let item of PARTS_OF_SPEECH) {
            const hint = this.i18n(`hint${item}`);
            radios.push(
                <div
                    className="my-2"
                    key={radios.length} >
                    <input
                        type="radio"
                        id={item}
                        onChange={(e) => { this.onNewWordPosSelect(item) }}
                        name="wordPosSelector" />
                    <label
                        className="mx-2"
                        htmlFor={item} >
                        <span className="text-blue-500 italic">
                            {item}
                        </span>
                        <span className="text-sm pl-2">
                            {hint}
                        </span>
                    </label>
                </div>
            );
        }
        const excVerbCheckbox = (
            (direction.src == "kk")
            ? (<div className="text-xl mx-4">
                <input
                    type="checkbox"
                    id="excVerb"
                    onChange={this.onExcVerbChange} />
                <label
                    className="mx-2"
                    htmlFor="excVerb">
                    {this.i18n("feVerb")}
                </label>
            </div>)
            : null
        );
        return (
            <form
                onSubmit={this.onNewWordSubmit}
                className="my-2 p-2 w-full bg-gray-200 rounded">
                <fieldset className="m-2 flex flex-col border-2 border-gray-600 p-2 rounded text-xl">
                    <legend className="px-2 text-base">{this.i18n("selectPos")}</legend>
                    {radios}
                </fieldset>
                <div className="flex flex-row justify-between">
                    {excVerbCheckbox}
                    <button
                        type="submit"
                        className="bg-blue-500 hover:bg-blue-700 text-white text-4xl font-bold mx-2 px-4 rounded focus:outline-none focus:shadow-outline">
                        →
                    </button>
                </div>
            </form>
        );
    }

    renderNewWordDetails(direction, word, foundWords, selectedWordId, selectedPos, excVerb) {
        if (selectedPos == null) {
            return this.renderNewWordForm(direction, word, foundWords, selectedWordId);
        }
        return (
            <div className="my-2 flex flex-row justify-between w-full bg-gray-200 rounded">
                <span className="px-4 py-4 text-2xl">
                    {this.renderPos(selectedPos, excVerb, "text-xl")}
                </span>
                {closeButton({ onClick: this.onNewWordDetailsReset })}
            </div>
        );
    }

    renderTranslationPart(direction, foundWords, selectedWordId, selectedPos, translation) {
        if (foundWords == null || selectedWordId == null || (selectedWordId >= foundWords.length && selectedPos == null)) {
            return null;
        }
        return (
            <GcWordStart
                lang={this.props.lang}
                wordLang={direction.dst}
                lastEntered={this.state.lastEnteredTranslation}
                word={translation}
                changeCallback={this.onTranslationChange}
                submitCallback={this.onTranslationSubmit}
                resetCallback={this.onTranslationReset} />
        );
    }

    renderForm() {
        if (this.state.error) {
            return (
                <p className="text-red-600">{this.i18n("service_error")}</p>
            );
        }

        const direction = this.state.direction;
        const word = this.state.word;
        const foundWords = this.state.foundWords;
        const selectedWordId = this.state.selectedWordId;
        const selectedPos = this.state.selectedPos;
        const excVerb = this.state.excVerb;
        const translation = this.state.translation;
        return (
            <div>
                {this.renderDirectionPart(direction)}
                {this.renderWordPart(direction, word)}
                {this.renderWordSelection(word, foundWords, selectedWordId)}
                {this.renderNewWordDetails(direction, word, foundWords, selectedWordId, selectedPos, excVerb)}
                {this.renderTranslationPart(direction, foundWords, selectedWordId, selectedPos, translation)}
            </div>
        );
    }

    render() {
        return (
            <div>
                <h1 className="my-4 text-center text-4xl italic text-gray-600">
                    {this.i18n("titleGcCreate")}
                </h1>
                {this.renderForm()}
            </div>
        );
    }
}


export default GcCreateApp;