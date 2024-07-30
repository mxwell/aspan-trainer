import React from "react";
import { closeButton } from "./close_button";
import { TransDirection, buildDirectionByKeyMap } from "../lib/gc";
import { i18n } from "../lib/i18n";
import { trimAndLowercase } from "../lib/input_validation";
import { gcGetWords } from "../lib/gc_api";
import GcWordStart from "./gc_word_start";
import GcWordSelection from "./gc_word_selection";
import GcWordCreate from "./gc_word_create";

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
        this.onNewWordPosSelect = this.onNewWordPosSelect.bind(this);
        this.onExcVerbChange = this.onExcVerbChange.bind(this);
        this.onNewWordSubmit = this.onNewWordSubmit.bind(this);
        this.onNewWordReset = this.onNewWordReset.bind(this);

        this.onTranslationChange = this.onTranslationChange.bind(this);
        this.onTranslationSubmit = this.onTranslationSubmit.bind(this);
        this.onTranslationReset = this.onTranslationReset.bind(this);
        this.onTranslationSelect = this.onTranslationSelect.bind(this);
        this.onTranslationSelectionSubmit = this.onTranslationSelectionSubmit.bind(this);
        this.onTranslationSelectionReset = this.onTranslationSelectionReset.bind(this);
        this.onNewTranslationPosSelect = this.onNewTranslationPosSelect.bind(this);
        this.onNewTranslationSubmit = this.onNewTranslationSubmit.bind(this);
        this.onNewTranslationReset = this.onNewTranslationReset.bind(this);

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
            preselectedTranslationId: null,
            selectedTranslationId: null,
            preselectedTranslationPos: null,
            selectedTranslationPos: null,
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
            selectedTranslationId: null,
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
            selectedTranslationId: null,
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

    onNewWordReset(event) {
        event.preventDefault();
        this.setState({
            preselectedPos: null,
            selectedPos: null,
            preExcVerb: null,
            excVerb: null,
            selectedTranslationId: null,
            selectedTranslationPos: null,
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
            selectedTranslationId: null,
            preselectedTranslationPos: null,
            selectedTranslationPos: null,
            error: null,
        });
    }

    onTranslationSelect(index) {
        const preselectedTranslationId = index;
        this.setState({ preselectedTranslationId });
    }

    onTranslationSelectionSubmit(event) {
        event.preventDefault();
        const selectedTranslationId = this.state.preselectedTranslationId;
        this.setState({ selectedTranslationId });
    }

    onTranslationSelectionReset(event) {
        event.preventDefault();
        this.setState({
            selectedTranslationId: null,
            preselectedTranslationPos: null,
            selectedTranslationPos: null,
        });
    }

    onNewTranslationPosSelect(pos) {
        const preselectedTranslationPos = pos;
        this.setState({ preselectedTranslationPos });
    }

    onNewTranslationSubmit(event) {
        event.preventDefault();
        const selectedTranslationPos = this.state.preselectedTranslationPos;
        this.setState({ selectedTranslationPos });
    }

    onNewTranslationReset(event) {
        event.preventDefault();
        this.setState({
            preselectedTranslationPos: null,
            selectedTranslationPos: null,
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

    renderWordSelection(word, foundWords, selectedWordId) {
        if (word == null) {
            return null;
        }
        return (
            <GcWordSelection
                lang={this.props.lang}
                foundWords={foundWords}
                selectedWordId={selectedWordId}
                selectCallback={this.onWordSelect}
                submitCallback={this.onWordSelectionSubmit}
                resetCallback={this.onWordSelectionReset} />
        );
    }

    renderNewWordDetails(direction, foundWords, selectedWordId, selectedPos, excVerb) {
        if (foundWords == null || selectedWordId != foundWords.length) {
            return null;
        }
        return (
            <GcWordCreate
                lang={this.props.lang}
                wordLang={direction.src}
                selectedPos={selectedPos}
                excVerb={excVerb}
                selectCallback={this.onNewWordPosSelect}
                excVerbCallback={this.onExcVerbChange}
                submitCallback={this.onNewWordSubmit}
                resetCallback={this.onNewWordReset} />
        );
    }

    renderTranslationPart(readyForTranslation, direction, translation) {
        if (!readyForTranslation) {
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

    renderTranslationSelection(readyForTranslation, translation, foundTranslations, selectedTranslationId) {
        if (!readyForTranslation || translation == null) {
            return null;
        }
        return (
            <GcWordSelection
                lang={this.props.lang}
                foundWords={foundTranslations}
                selectedWordId={selectedTranslationId}
                selectCallback={this.onTranslationSelect}
                submitCallback={this.onTranslationSelectionSubmit}
                resetCallback={this.onTranslationSelectionReset} />
        );
    }

    renderTranslationCreate(readyForTranslation, direction, foundTranslations, selectedTranslationId, selectedTranslationPos) {
        if (!readyForTranslation || foundTranslations == null || selectedTranslationId != foundTranslations.length) {
            return null;
        }
        return (
            <GcWordCreate
                lang={this.props.lang}
                wordLang={direction.dst}
                selectedPos={selectedTranslationPos}
                excVerb={false}
                selectCallback={this.onNewTranslationPosSelect}
                excVerbCallback={() => {}}
                submitCallback={this.onNewTranslationSubmit}
                resetCallback={this.onNewTranslationReset} />
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
        const readyForTranslation = (
            foundWords != null
            && selectedWordId != null
            && (selectedWordId < foundWords.length || selectedPos != null)
        );
        const translation = this.state.translation;
        const foundTranslations = this.state.foundTranslations;
        const selectedTranslationId = this.state.selectedTranslationId;
        const selectedTranslationPos = this.state.selectedTranslationPos;
        return (
            <div>
                {this.renderDirectionPart(direction)}
                {this.renderWordPart(direction, word)}
                {this.renderWordSelection(word, foundWords, selectedWordId)}
                {this.renderNewWordDetails(direction, foundWords, selectedWordId, selectedPos, excVerb)}
                {this.renderTranslationPart(readyForTranslation, direction, translation)}
                {this.renderTranslationSelection(readyForTranslation, translation, foundTranslations, selectedTranslationId)}
                {this.renderTranslationCreate(readyForTranslation, direction, foundTranslations, selectedTranslationId, selectedTranslationPos)}
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