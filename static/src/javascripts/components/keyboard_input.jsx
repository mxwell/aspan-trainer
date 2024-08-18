import React from "react";

class ButtonInfo {
    constructor(label, shLabel, symbol, shSymbol, special, dims) {
        this.label = label;
        this.shLabel = shLabel;
        this.symbol = symbol;
        this.shSymbol = shSymbol;
        this.special = special;
        this.dims = dims;
    }
}

const DIMS_BASE = "h-10 w-10";
const DIMS_MID = "h-10 w-12"
const DIMS_WIDE = "h-10 w-24"
const DIMS_BS = "h-10 w-32";
const DIMS_SPACE = "h-10 w-64";
const TITLE_BS = "backspace";

function makeEmptyButton(dims) {
    return new ButtonInfo(null, null, null, null, null, dims);
}

function makeCustomSymbolButton(symbol, upper, bw) {
    return new ButtonInfo(symbol, upper, symbol, upper, null, bw);
}

function makeSymbolButton(symbol) {
    const upper = symbol.toUpperCase();
    return makeCustomSymbolButton(symbol, upper, DIMS_BASE);
}

function makeSpecialButton(special, dims) {
    return new ButtonInfo(special, special, null, null, special, dims);
}

const BUTTON_ROWS = [
    [
        makeEmptyButton(DIMS_BASE),
        makeEmptyButton(DIMS_BASE),
        makeSymbolButton("ә"),
        makeSymbolButton("і"),
        makeSymbolButton("ң"),
        makeSymbolButton("ғ"),
        makeEmptyButton(DIMS_BASE),
        makeEmptyButton(DIMS_BASE),
        makeSymbolButton("ү"),
        makeSymbolButton("ұ"),
        makeSymbolButton("қ"),
        makeSymbolButton("ө"),
        makeSymbolButton("һ"),
        makeSpecialButton(TITLE_BS, DIMS_BS),
    ],
    [
        makeEmptyButton(DIMS_MID),
        makeSymbolButton("й"),
        makeSymbolButton("ц"),
        makeSymbolButton("у"),
        makeSymbolButton("к"),
        makeSymbolButton("е"),
        makeSymbolButton("н"),
        makeSymbolButton("г"),
        makeSymbolButton("ш"),
        makeSymbolButton("щ"),
        makeSymbolButton("з"),
        makeSymbolButton("х"),
        makeSymbolButton("ъ"),
        makeEmptyButton(DIMS_MID),
    ],
    [
        makeSpecialButton("caps", DIMS_WIDE),
        makeSymbolButton("ф"),
        makeSymbolButton("ы"),
        makeSymbolButton("в"),
        makeSymbolButton("а"),
        makeSymbolButton("п"),
        makeSymbolButton("р"),
        makeSymbolButton("о"),
        makeSymbolButton("л"),
        makeSymbolButton("д"),
        makeSymbolButton("ж"),
        makeSymbolButton("э"),
        makeEmptyButton(DIMS_MID),
    ],
    [
        makeSpecialButton("shift", DIMS_WIDE),
        makeSymbolButton("я"),
        makeSymbolButton("ч"),
        makeSymbolButton("с"),
        makeSymbolButton("м"),
        makeSymbolButton("и"),
        makeSymbolButton("т"),
        makeSymbolButton("ь"),
        makeSymbolButton("б"),
        makeSymbolButton("ю"),
        makeSpecialButton("shift", DIMS_WIDE),
    ],
    [
        makeCustomSymbolButton(" ", " ", DIMS_SPACE),
    ],
];

/**
 * props:
 * - title
 * - placeholder
 * - lastEntered
 * - changeCallback
 * - submitCallback
 */
class KeyboardInput extends React.Component {
    constructor(props) {
        super(props);

        this.onWordChange = this.onWordChange.bind(this);

        this.state = { pos: 0 };
    }

    onWordChange(event) {
        event.preventDefault();
        const lastEnteredWord = event.target.value;
        this.props.changeCallback(lastEnteredWord);
    }

    updateText(text, pos) {
        this.props.changeCallback(text);
        this.setState(
            { pos },
            () => {
                const wi = this.refs.wordInput;
                wi.selectionStart = this.state.pos;
                wi.selectionEnd = this.state.pos;
            }
        );
    }

    insertChar(wordInput, ch) {
        const val = wordInput.value;
        const start = wordInput.selectionStart;
        const end = wordInput.selectionEnd;
        const pre = val.substr(0, start);
        const post = val.substr(end);
        const text = pre + ch + post;
        console.log(`insert char '${ch}': ${start}:${end}, [${val}] -> [${text}]`);
        this.updateText(text, start + ch.length);
    }

    backspace(wordInput) {
        const val = wordInput.value;
        const start = wordInput.selectionStart;
        const end = wordInput.selectionEnd;
        if (end == 0) {
            console.log("backspace: nothing to remove");
            return;
        }
        const pos = (
            end > start
            ? start
            : Math.max(0, start - 1)
        );
        const pre = val.substr(0, pos);
        const post = val.substr(end);
        const text = pre + post;
        console.log(`backspace: ${start}:${end}, [${val}] -> [${text}]`);
        this.updateText(text, pos);
    }

    onBtnClick(e, buttonInfo) {
        e.preventDefault();
        console.log(`onBtnClick: ${buttonInfo.symbol}, ${buttonInfo.special}`);
        const ch = buttonInfo.symbol;
        if (ch != null) {
            this.insertChar(this.refs.wordInput, ch);
        } else if (buttonInfo.special == TITLE_BS) {
            this.backspace(this.refs.wordInput);
        } else {
            console.log(`unsupported button`);
        }
    }

    renderRows(buttonRows) {
        const resultRows = [];
        for (const buttonRow of buttonRows) {
            const buttons = [];
            for (const buttonInfo of buttonRow) {
                const symbol = buttonInfo.symbol;
                const special = buttonInfo.special;
                const bgColor = (buttonInfo.label != null ? "bg-white" : "bg-gray-100");
                const txtAndCursor = (
                    (symbol != null || special == TITLE_BS)
                    ? "text-gray-700 cursor-pointer"
                    : "text-gray-500 cursor-default"
                );
                const btnClass = `${buttonInfo.dims} ${bgColor} ${txtAndCursor} rounded text-center m-1 py-1 text-xl`
                buttons.push(
                    <div
                        className={btnClass}
                        onClick={(e) => { this.onBtnClick(e, buttonInfo) }}
                        key={buttons.length}>
                        {buttonInfo.label}
                    </div>
                );
            }
            resultRows.push(
                <div className="flex flex-row justify-center" key={resultRows.length}>
                    {buttons}
                </div>
            );
        }
        return resultRows;
    }

    render() {
        return (
            <form
                onSubmit={this.props.submitCallback}
                className="my-2 flex flex-col w-full bg-gray-200 rounded">
                <div className="flex flex-row">
                    <span className="w-1/2 px-4 py-4 text-2xl">
                        {this.props.title}:
                    </span>
                    <input
                        ref="wordInput"
                        type="text"
                        size="20"
                        minLength="1"
                        maxLength="64"
                        required
                        spellCheck="false"
                        value={this.props.lastEntered}
                        onChange={this.onWordChange}
                        placeholder={this.props.placeholder}
                        className="w-full shadow appearance-none border rounded mx-2 p-2 text-4xl lg:text-2xl text-gray-700 focus:outline-none focus:shadow-outline"
                        autoFocus />
                    <button
                        type="submit"
                        className="bg-blue-500 hover:bg-blue-700 text-white text-4xl font-bold mx-2 px-4 rounded focus:outline-none focus:shadow-outline">
                        →
                    </button>
                </div>
                <div className="my-2 flex flex-col w-full">
                    {this.renderRows(BUTTON_ROWS)}
                </div>
            </form>
        );
    }
}

export default KeyboardInput;