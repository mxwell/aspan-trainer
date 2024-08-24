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
const TITLE_CAPS = "caps";
const TITLE_SHIFT = "shift";

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
        makeSymbolButton("!"),
        makeSymbolButton("ә"),
        makeSymbolButton("і"),
        makeSymbolButton("ң"),
        makeSymbolButton("ғ"),
        makeEmptyButton(DIMS_BASE),
        makeSymbolButton("?"),
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
        makeSymbolButton("-"),
    ],
    [
        makeSpecialButton(TITLE_CAPS, DIMS_WIDE),
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
        makeSymbolButton("ё"),
    ],
    [
        makeSpecialButton(TITLE_SHIFT, DIMS_WIDE),
        makeSymbolButton("я"),
        makeSymbolButton("ч"),
        makeSymbolButton("с"),
        makeSymbolButton("м"),
        makeSymbolButton("и"),
        makeSymbolButton("т"),
        makeSymbolButton("ь"),
        makeSymbolButton("б"),
        makeSymbolButton("ю"),
        makeSpecialButton(TITLE_SHIFT, DIMS_WIDE),
    ],
    [
        makeCustomSymbolButton(" ", " ", DIMS_SPACE),
    ],
];

class TextInputChange {
    constructor(newText, newSelectionStart) {
        this.newText = newText;
        this.newSelectionStart = newSelectionStart;
    }
}

/**
 * Inserts a given string into a `<input type=text ..>`
 * at the cursor (or, generally speaking, selection) position.
 * @param {*} textInput a DOM element of an input with text type
 * @param {*} insertion a string
 * @returns an instance of TextInputChange with new input text and its new cursor position
 */
function insertIntoTextInput(textInput, insertion) {
    const val = textInput.value;
    const start = textInput.selectionStart;
    const end = textInput.selectionEnd;
    const pre = val.substr(0, start);
    const post = val.substr(end);
    const text = pre + insertion + post;
    console.log(`insert char '${insertion}': ${start}:${end}, [${val}] -> [${text}]`);
    return new TextInputChange(text, start + insertion.length);
}

/**
 * Removes a single character from a `<input type=text ..>`
 * before the cursor position if the selection is empty,
 * or removes a selection if it's non-empty.
 * @param {*} textInput a DOM element of an input with text type
 * @returns an instance of TextInputChange with new input text and its new cursor position
 */
function backspaceTextInput(textInput) {
    const val = textInput.value;
    const start = textInput.selectionStart;
    const end = textInput.selectionEnd;
    if (end == 0) {
        console.log("backspace: nothing to remove");
        return new TextInputChange(val, end);
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
    return new TextInputChange(text, pos);

}

/**
 * props:
 * - insertCallback - function(string), which might trigger a `insertIntoTextInput(...)` call
 * - backspaceCallback - function(), which might trigger a `backspaceTextInput(...)` call
 */
class Keyboard extends React.Component {
    constructor(props) {
        super(props);

        this.state = { caps: false, shift: false };
    }

    onBtnClick(e, buttonInfo) {
        e.preventDefault();
        console.log(`onBtnClick: ${buttonInfo.symbol}, ${buttonInfo.special}`);
        const shift = this.state.caps || this.state.shift;
        const ch = shift ? buttonInfo.shSymbol : buttonInfo.symbol;
        if (ch != null) {
            this.props.insertCallback(ch);
            this.setState({ shift: false });
        } else if (buttonInfo.special == TITLE_BS) {
            this.props.backspaceCallback();
            this.setState({ shift: false });
        } else if (buttonInfo.special == TITLE_CAPS) {
            this.setState({ caps: !this.state.caps, shift: false });
        } else if (buttonInfo.special == TITLE_SHIFT) {
            this.setState({ caps: false, shift: !this.state.shift });
        } else {
            console.log(`unsupported button`);
            this.setState({ shift: false });
        }
    }

    renderRows(buttonRows) {
        const resultRows = [];
        const shift = this.state.caps || this.state.shift;
        for (const buttonRow of buttonRows) {
            const buttons = [];
            for (const buttonInfo of buttonRow) {
                const label = shift ? buttonInfo.shLabel : buttonInfo.label
                const activeClass = (
                    label != null
                    ? "bg-white text-gray-700 cursor-pointer"
                    : "bg-gray-100 text-gray-500 cursor-default"
                );
                const btnClass = `${buttonInfo.dims} ${activeClass} rounded text-center m-1 py-1 text-xl`
                buttons.push(
                    <div
                        className={btnClass}
                        onClick={(e) => { this.onBtnClick(e, buttonInfo) }}
                        key={buttons.length}>
                        {label}
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
            <div className="my-2 flex flex-col w-full">
                {this.renderRows(BUTTON_ROWS)}
            </div>
        );
    }
}

export {
    insertIntoTextInput,
    backspaceTextInput,
    Keyboard,
};