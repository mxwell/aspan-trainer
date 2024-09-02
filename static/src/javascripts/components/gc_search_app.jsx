import React from "react";
import { buildGcCreatePrefilledUrl, buildGcSearchUrl, parseParams } from "../lib/url";
import { i18n } from "../lib/i18n";
import { trimAndLowercase } from "../lib/input_validation";
import { gcGetTranslations } from "../lib/gc_api";
import { TransDirection, buildDirectionByKeyMap } from "../lib/gc";
import { renderComment } from "./gc_common";
import { Keyboard, backspaceTextInput, insertIntoTextInput } from "./keyboard";

const DIRECTIONS = [
    new TransDirection("kk", "ru"),
    new TransDirection("kk", "en"),
];

const DIRECTION_BY_KEY = buildDirectionByKeyMap(DIRECTIONS);

function findDirection(src, dst) {
    for (let d of DIRECTIONS) {
        if (d.src == src && d.dst == dst) {
            return d;
        }
    }
    return null;
}

/**
 * props:
 * - lang
 */
class GcSearchApp extends React.Component {
    constructor(props) {
        super(props);

        this.handleSearchResponse = this.handleSearchResponse.bind(this);
        this.handleSearchError = this.handleSearchError.bind(this);
        this.onChange = this.onChange.bind(this);
        this.onKeyboardClick = this.onKeyboardClick.bind(this);
        this.onInsert = this.onInsert.bind(this);
        this.onBackspace = this.onBackspace.bind(this);
        this.onDirectionChange = this.onDirectionChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);

        this.state = this.readUrlState() || this.defaultState();
    }

    makeState(word, direction) {
        if (!(direction instanceof TransDirection)) {
            throw new Error("invalid type of direction arg");
        }
        return {
            word: word,
            preselectedDirection: direction,
            direction: direction,
            lastEntered: word,
            keyboard: false,
            loading: true,
            translations: [],
            error: false,
        };
    }

    defaultState() {
        return this.makeState(
            "",
            DIRECTIONS[0],
        );
    }

    readUrlState() {
        const params = parseParams();
        const word = params.w;
        if (word == null || word.length == 0) {
            console.log("No word in URL");
            return null;
        }
        const src = params.src;
        const dst = params.dst;
        const direction = findDirection(src, dst);
        if (direction == null) {
            console.log(`Not found direction: ${src} -> ${dst}`);
            return null;
        }
        this.startSearch(word, direction);
        return this.makeState(word, direction);
    }

    i18n(key) {
        return i18n(key, this.props.lang);
    }

    async handleSearchResponse(context, responseJsonPromise) {
        const response = await responseJsonPromise;
        const translations = response.translations;
        const loading = false;
        this.setState({ translations, loading });
    }

    async handleSearchError(context, responseTextPromise) {
        let responseText = await responseTextPromise;
        console.log(`Got error from search: ${responseText}, params were: ${context.w}, ${context.src}, ${context.dst}`);
        const error = true;
        this.setState({ error });
    }

    startSearch(word, direction) {
        const w = trimAndLowercase(word);
        if (w.length == 0) {
            const word = w;
            this.setState({ word });
            return;
        }

        gcGetTranslations(
            w,
            direction.src,
            direction.dst,
            /* bothDirs */ false,
            this.handleSearchResponse,
            this.handleSearchError,
            {
                w: w,
                src: direction.src,
                dst: direction.dst,
            }
        );
    }

    onChange(event) {
        let lastEntered = event.target.value;
        this.setState({ lastEntered });
    }

    onDirectionChange(event) {
        let key = event.target.value;
        console.log(`onDirectionChange: key ${key}`);
        let preselectedDirection = DIRECTION_BY_KEY[key];
        if (preselectedDirection) {
            this.setState({ preselectedDirection });
        }
    }

    reloadToState(word, direction) {
        const url = buildGcSearchUrl(word, direction.src, direction.dst, this.props.lang);
        window.location.href = url;
    }

    onSubmit(event) {
        event.preventDefault();
        const word = this.state.lastEntered;
        const direction = this.state.preselectedDirection;
        this.reloadToState(word, direction);
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
                const mi = this.refs.managedInput;
                mi.selectionStart = change.newSelectionStart;
                mi.selectionEnd = change.newSelectionStart;
                mi.focus();
            }
        );
    }

    onInsert(fragment) {
        const textInput = this.refs.managedInput;
        const change = insertIntoTextInput(textInput, fragment);
        this.updateText(change);
    }

    onBackspace() {
        const textInput = this.refs.managedInput;
        const change = backspaceTextInput(textInput);
        this.updateText(change);
    }

    renderForm() {
        var selectOptions = [];
        for (let d of DIRECTIONS) {
            const key = d.toKey();
            selectOptions.push(
                <option key={key} value={key}>
                    {this.i18n(key)}
                </option>
            );
        }
        const keyboard = this.state.keyboard;
        const keyboardClass = (
            keyboard
            ? "px-2 bg-blue-600 hover:bg-blue-700 focus:outline-none"
            : "px-2 bg-gray-400 hover:bg-gray-600 focus:outline-none"
        );
        return (
            <form
                onSubmit={this.onSubmit}
                className="px-3 py-2 flex flex-row">
                <input
                    ref="managedInput"
                    type="search"
                    size="20"
                    maxLength="64"
                    value={this.state.lastEntered}
                    onChange={this.onChange}
                    placeholder={this.i18n("hintEnterWord")}
                    className="shadow appearance-none border rounded p-2 w-full text-4xl lg:text-2xl text-gray-700 focus:outline-none focus:shadow-outline"
                    autoFocus />
                <button
                    type="button"
                    onClick={this.onKeyboardClick}
                    className={keyboardClass}>
                    <img src="/keyboard.svg" alt="keyboard show or hide" className="h-12" />
                </button>
                <select
                    required
                    onChange={this.onDirectionChange}
                    value={this.state.preselectedDirection.toKey()}
                    className="text-gray-800 text-2xl mx-2 px-4 py-2">
                    {selectOptions}
                </select>
                <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-700 text-white text-4xl font-bold mx-2 px-4 rounded focus:outline-none focus:shadow-outline">
                    →
                </button>
            </form>
        );
    }

    renderKeyboard() {
        if (!this.state.keyboard) {
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

    renderPos(pos, excVerb) {
        if (pos) {
            if (excVerb > 0) {
                return (<span className="text-blue-500 text-xs italic pl-2">
                    &nbsp;{pos}, {this.i18n("feVerb")}
                </span>);
            }
            return (<span className="text-blue-500 text-xs italic pl-2">
                &nbsp;{pos}
            </span>);
        }
        return null;
    }

    renderTranslationRows(translations) {
        let rows = [];
        const commentClass = "py-2 px-4 text-gray-700 italic";
        for (let entry of translations) {
            rows.push(
                <tr
                    className="border-t-2 text-base"
                    key={rows.length}>
                    <td className="bg-gray-200 pl-4 py-2">{entry.word}{this.renderPos(entry.pos, entry.exc_verb)}{renderComment(entry.comment, commentClass, 128)}</td>
                    <td className="border-l-2 bg-gray-100 pl-4 py-2">{entry.translation_word}{this.renderPos(entry.translation_pos, 0)}{renderComment(entry.translation_comment, commentClass, 128)}</td>
                </tr>
            );
        }
        return rows;
    }

    renderFindings() {
        if (this.state.error) {
            return (
                <p className="m-10 text-center text-red-600">{this.i18n("service_error")}</p>
            );
        }
        if (this.state.word.length == 0) {
            return null;
        }
        if (this.state.loading) {
            return (
                <p className="m-10 text-center">{this.i18n("searchInProgress")}</p>
            );
        }
        const translations = this.state.translations;
        if (translations.length == 0) {
            return (
                <p className="m-10 text-center">{this.i18n("nothingFound")}</p>
            );
        }
        const direction = this.state.direction;

        return (
            <table className="my-4 w-full">
                <tbody>
                    <tr className="bg-gray-600 text-white">
                        <th className="w-1/2 py-2">{this.i18n(direction.src)}</th>
                        <th className="w-1/2 py-2 border-l-2">{this.i18n(direction.dst)}</th>
                    </tr>
                    {this.renderTranslationRows(translations)}
                </tbody>
            </table>
        );
    }

    renderButton() {
        const word = this.state.word;
        if (word.length == 0) {
            return null;
        }
        const direction = this.state.direction;
        const url = buildGcCreatePrefilledUrl(word, direction.src, direction.dst, this.props.lang);
        return (
            <div className="my-10 py-4 flex flex-row justify-center">
                <a href={url}>
                    <button
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                        {this.i18n("titleGcCreate")}
                    </button>
                </a>
            </div>
        );
    }

    render() {
        return (
            <div className="w-1/2">
                <h1 className="text-center text-4xl italic text-gray-600">
                    {this.i18n("titleGcSearch")}
                </h1>
                {this.renderForm()}
                {this.renderKeyboard()}
                {this.renderFindings()}
                {this.renderButton()}
            </div>
        );
    }
}

export default GcSearchApp;