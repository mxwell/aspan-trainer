import React from "react";
import { buildGcSearchUrl, parseParams } from "../lib/url";
import { i18n } from "../lib/i18n";

class TransDirection {
    constructor(src, dst) {
        this.src = src;
        this.dst = dst;
    }

    toKey() {
        return `${this.src}${this.dst}`;
    }

    toString() {
        return `${this.src} → ${this.dst}`;
    }
}

function buildDirectionByKeyMap(dirs) {
    let result = {};
    for (let d of dirs) {
        result[d.toKey()] = d;
    }
    return result;
}

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

        this.onChange = this.onChange.bind(this);
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
            direction: direction,
            lastEntered: word,
            loading: true,
            translations: [],
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

    startSearch(word, direction) {
        // TODO
    }

    onChange(event) {
        let lastEntered = event.target.value;
        this.setState({ lastEntered });
    }

    onDirectionChange(event) {
        let key = event.target.value;
        console.log(`onDirectionChange: key ${key}`);
        let direction = DIRECTION_BY_KEY[key];
        if (direction) {
            this.setState({ direction });
        }
    }

    reloadToState(word, direction) {
        const url = buildGcSearchUrl(word, direction.src, direction.dst);
        window.location.href = url;
    }

    onSubmit(event) {
        event.preventDefault();
        const word = this.state.lastEntered;
        const direction = this.state.direction;
        this.reloadToState(word, direction);
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
        return (
            <form
                onSubmit={this.onSubmit}
                className="px-3 py-2 flex flex-row">
                <input
                    type="search"
                    size="20"
                    maxLength="64"
                    value={this.state.lastEntered}
                    onChange={this.onChange}
                    placeholder={this.i18n("hintEnterWord")}
                    className="shadow appearance-none border rounded mx-2 p-2 text-4xl lg:text-2xl text-gray-700 focus:outline-none focus:shadow-outline"
                    autoFocus />
                <select
                    required
                    onChange={this.onDirectionChange}
                    value={this.state.direction.toKey()}
                    class="text-gray-800 text-2xl mx-2 px-4 py-2">
                    {selectOptions}
                </select>
                <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-700 text-white text-4xl font-bold mx-2 px-4 rounded focus:outline-none focus:shadow-outline">
                    →
                </button>
            </form>
        )
    }

    renderFindings() {
        if (this.state.word.length == 0) {
            return null;
        }
        if (this.state.loading) {
            return (
                <p>{this.i18n("searchInProgress")}</p>
            );
        }
        // TODO
        return (
            <p>Result rendering is not implemented</p>
        );
    }

    render() {
        return (
            <div>
                <h1 className="text-center text-4xl italic text-gray-600">
                    {this.i18n("titleGcSearch")}
                </h1>
                {this.renderForm()}
                {this.renderFindings()}
            </div>
        );
    }
}

export default GcSearchApp;