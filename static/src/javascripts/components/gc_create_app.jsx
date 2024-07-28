import React from "react";
import { closeButton } from "./close_button";
import { TransDirection, buildDirectionByKeyMap } from "../lib/gc";
import { i18n } from "../lib/i18n";
import { trimAndLowercase } from "../lib/input_validation";

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
        this.onWordSubmit = this.onWordSubmit.bind(this);
        this.onWordReset = this.onWordReset.bind(this);

        this.state = this.defaultState();
    }

    makeState(direction) {
        return {
            direction: direction,
            word: null,
            lastEnteredWord: "",
            foundWords: null,
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

    onWordSubmit(event) {
        event.preventDefault();
        const lastEntered = this.state.lastEnteredWord;
        const word = trimAndLowercase(lastEntered);
        if (word.length == 0) {
            console.log(`onWordSubmit: empty input [${lastEntered}]`)
            return;
        }
        // TODO load existing words from /gcapi/v1/get_words
        this.setState({ word });
    }

    onWordReset(event) {
        event.preventDefault();
        const word = null;
        this.setState({ word });
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
        if (word == null) {
            const placeHolderKey = `enterLangWord_${direction.src}`
            return (
                <form
                    onSubmit={this.onWordSubmit}
                    className="my-2 flex flex-row w-full bg-gray-200 rounded">
                    <span className="px-4 py-4 text-2xl">
                        {this.i18n("srcWord")}:
                    </span>
                    <input
                        type="text"
                        size="20"
                        maxLength="64"
                        value={this.state.lastEnteredWord}
                        onChange={this.onWordChange}
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
        } else {
            return (
                <div className="my-2 flex flex-row justify-between w-full bg-gray-200 rounded">
                    <span className="px-4 py-4 text-2xl">
                        {this.i18n("srcWord")}:
                    </span>
                    <span className="py-4 text-2xl">
                        {word}
                    </span>
                    {closeButton({ onClick: this.onWordReset })}
                </div>
            );
        }
    }

    renderWordSelection(word, foundWords) {
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
        return (
            <p>Not impl.</p>
        );
    }

    renderForm() {
        const direction = this.state.direction;
        const word = this.state.word;
        const foundWords = this.state.foundWords;
        return (
            <div>
                {this.renderDirectionPart(direction)}
                {this.renderWordPart(direction, word)}
                {this.renderWordSelection(word, foundWords)}
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