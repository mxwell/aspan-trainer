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
const TITLE_ENTER = "enter";
const TITLE_LATIN = "latin";
const TITLE_CYRILLIC = "cyrillic";

const MOBILE_DIMS_BASE = "h-16 w-16";
const MOBILE_DIMS_WIDE = "h-16 w-32";
const MOBILE_DIMS_SPACE = "h-16 w-7/12";
const MOBILE_TITLE_BS = "⟵";
const MOBILE_TITLE_ENTER = "↵";

const SPEC_KEY_BS = "bs";
const SPEC_KEY_CAPS = "caps";
const SPEC_KEY_SHIFT = "shift";
const SPEC_KEY_ENTER = "enter";
const SPEC_KEY_LATIN = "lat";
const SPEC_KEY_CYRILLIC = "cyr";

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

function makeMobileSymbolButton(symbol) {
    const upper = symbol.toUpperCase();
    return makeCustomSymbolButton(symbol, upper, MOBILE_DIMS_BASE);
}

function makeSpecialButton(label, dims, special) {
    return new ButtonInfo(label, label, null, null, special, dims);
}

const CYR_BUTTON_ROWS = [
    [
        makeSpecialButton(TITLE_LATIN, DIMS_WIDE, SPEC_KEY_LATIN),
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
        makeSpecialButton(TITLE_BS, DIMS_BS, SPEC_KEY_BS),
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
        makeSpecialButton(TITLE_CAPS, DIMS_WIDE, SPEC_KEY_CAPS),
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
        makeSpecialButton(TITLE_ENTER, DIMS_WIDE, SPEC_KEY_ENTER),
    ],
    [
        makeSpecialButton(TITLE_SHIFT, DIMS_WIDE, SPEC_KEY_SHIFT),
        makeSymbolButton("я"),
        makeSymbolButton("ч"),
        makeSymbolButton("с"),
        makeSymbolButton("м"),
        makeSymbolButton("и"),
        makeSymbolButton("т"),
        makeSymbolButton("ь"),
        makeSymbolButton("б"),
        makeSymbolButton("ю"),
        makeSymbolButton("-"),
        makeSpecialButton(TITLE_SHIFT, DIMS_WIDE, SPEC_KEY_SHIFT),
    ],
    [
        makeCustomSymbolButton(" ", " ", DIMS_SPACE),
    ],
];

const MOBILE_CYR_BUTTON_ROWS = [
    [
        makeMobileSymbolButton("ә"),
        makeMobileSymbolButton("і"),
        makeMobileSymbolButton("ң"),
        makeMobileSymbolButton("ғ"),
        makeMobileSymbolButton("ү"),
        makeMobileSymbolButton("ұ"),
        makeMobileSymbolButton("қ"),
        makeMobileSymbolButton("ө"),
        makeMobileSymbolButton("һ"),
        makeSpecialButton(MOBILE_TITLE_BS, MOBILE_DIMS_WIDE, SPEC_KEY_BS),
    ],
    [
        makeMobileSymbolButton("й"),
        makeMobileSymbolButton("ц"),
        makeMobileSymbolButton("у"),
        makeMobileSymbolButton("к"),
        makeMobileSymbolButton("е"),
        makeMobileSymbolButton("н"),
        makeMobileSymbolButton("г"),
        makeMobileSymbolButton("ш"),
        makeMobileSymbolButton("щ"),
        makeMobileSymbolButton("з"),
        makeMobileSymbolButton("х"),
        makeMobileSymbolButton("ъ"),
    ],
    [
        makeMobileSymbolButton("ф"),
        makeMobileSymbolButton("ы"),
        makeMobileSymbolButton("в"),
        makeMobileSymbolButton("а"),
        makeMobileSymbolButton("п"),
        makeMobileSymbolButton("р"),
        makeMobileSymbolButton("о"),
        makeMobileSymbolButton("л"),
        makeMobileSymbolButton("д"),
        makeMobileSymbolButton("ж"),
        makeMobileSymbolButton("э"),
        makeMobileSymbolButton("ё"),
    ],
    [
        makeMobileSymbolButton("я"),
        makeMobileSymbolButton("ч"),
        makeMobileSymbolButton("с"),
        makeMobileSymbolButton("м"),
        makeMobileSymbolButton("и"),
        makeMobileSymbolButton("т"),
        makeMobileSymbolButton("ь"),
        makeMobileSymbolButton("б"),
        makeMobileSymbolButton("ю"),
        makeMobileSymbolButton("-"),
    ],
    [
        makeCustomSymbolButton(" ", " ", MOBILE_DIMS_SPACE),
        makeSpecialButton(MOBILE_TITLE_ENTER, MOBILE_DIMS_WIDE, SPEC_KEY_ENTER),
    ],
];

const LAT_BUTTON_ROWS = [
    [
        makeSpecialButton(TITLE_CYRILLIC, DIMS_WIDE, SPEC_KEY_CYRILLIC),
        makeSymbolButton("!"),
        makeSymbolButton("ä"),
        makeSymbolButton("ı"),
        makeSymbolButton("ñ"),
        makeSymbolButton("ğ"),
        makeEmptyButton(DIMS_BASE),
        makeSymbolButton("?"),
        makeSymbolButton("ü"),
        makeSymbolButton("ū"),
        makeSymbolButton("ö"),
        makeSymbolButton("-"),
        makeSpecialButton(TITLE_BS, DIMS_BS, SPEC_KEY_BS),
    ],
    [
        makeEmptyButton(DIMS_MID),
        makeSymbolButton("q"),
        makeSymbolButton("w"),
        makeSymbolButton("e"),
        makeSymbolButton("r"),
        makeSymbolButton("t"),
        makeSymbolButton("y"),
        makeSymbolButton("u"),
        makeSymbolButton("i"),
        makeSymbolButton("o"),
        makeSymbolButton("p"),
        makeEmptyButton(DIMS_BASE),
        makeEmptyButton(DIMS_MID),
    ],
    [
        makeSpecialButton(TITLE_CAPS, DIMS_WIDE, SPEC_KEY_CAPS),
        makeSymbolButton("a"),
        makeSymbolButton("s"),
        makeSymbolButton("d"),
        makeSymbolButton("f"),
        makeSymbolButton("g"),
        makeSymbolButton("h"),
        makeSymbolButton("j"),
        makeSymbolButton("k"),
        makeSymbolButton("l"),
        makeSymbolButton("ş"),
        makeSpecialButton(TITLE_ENTER, DIMS_WIDE, SPEC_KEY_ENTER),
    ],
    [
        makeSpecialButton(TITLE_SHIFT, DIMS_WIDE, SPEC_KEY_SHIFT),
        makeSymbolButton("z"),
        makeSymbolButton("x"),
        makeSymbolButton("c"),
        makeSymbolButton("v"),
        makeSymbolButton("b"),
        makeSymbolButton("n"),
        makeSymbolButton("m"),
        makeEmptyButton(DIMS_BASE),
        makeSpecialButton(TITLE_SHIFT, DIMS_WIDE, SPEC_KEY_SHIFT),
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

function isMobile() {
    return window.matchMedia('screen and (max-width: 1024px)').matches;
}

/**
 * props:
 * - insertCallback - function(string), which might trigger a `insertIntoTextInput(...)` call
 * - backspaceCallback - function(), which might trigger a `backspaceTextInput(...)` call
 * - enterCallback - function(event)
 * - lat - true = latin 2021.01.28 layout, false or undefined = cyrillic layout,
 */
class Keyboard extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            mobile: isMobile(),
            caps: false,
            shift: false,
            lat: (this.props.lat == true),
        };
    }

    onBtnClick(e, buttonInfo) {
        e.preventDefault();
        console.log(`onBtnClick: ${buttonInfo.symbol}, ${buttonInfo.special}`);
        const shift = this.state.caps || this.state.shift;
        const ch = shift ? buttonInfo.shSymbol : buttonInfo.symbol;
        if (ch != null) {
            this.props.insertCallback(ch);
            this.setState({ shift: false });
        } else if (buttonInfo.special == SPEC_KEY_BS) {
            this.props.backspaceCallback();
            this.setState({ shift: false });
        } else if (buttonInfo.special == SPEC_KEY_CAPS) {
            this.setState({ caps: !this.state.caps, shift: false });
        } else if (buttonInfo.special == SPEC_KEY_SHIFT) {
            this.setState({ caps: false, shift: !this.state.shift });
        } else if (buttonInfo.special == SPEC_KEY_ENTER) {
            this.props.enterCallback(e);
        } else if (buttonInfo.special == SPEC_KEY_LATIN) {
            this.setState({ lat: true });
        } else if (buttonInfo.special == SPEC_KEY_CYRILLIC) {
            this.setState({ lat: false });
        } else {
            console.log(`unsupported button`);
            this.setState({ shift: false });
        }
    }

    renderRows(buttonRows, textClass) {
        const resultRows = [];
        const shift = this.state.caps || this.state.shift;
        for (const buttonRow of buttonRows) {
            const buttons = [];
            for (const buttonInfo of buttonRow) {
                const label = shift ? buttonInfo.shLabel : buttonInfo.label
                const activeClass = (
                    label != null
                    ? "bg-white text-gray-700 cursor-pointer select-none"
                    : "bg-gray-100 text-gray-500 cursor-default"
                );
                const btnClass = `${buttonInfo.dims} ${activeClass} ${textClass} rounded text-center m-1`
                buttons.push(
                    <div
                        className={btnClass}
                        onMouseDown={(e) => { this.onBtnClick(e, buttonInfo) }}
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
        let buttonRows = null;
        let textClass = "text-xl py-1";
        if (this.state.mobile) {
            buttonRows = MOBILE_CYR_BUTTON_ROWS;
            textClass = "text-3xl py-2";
        } else if (this.state.lat == true) {
            buttonRows = LAT_BUTTON_ROWS;
        } else {
            buttonRows = CYR_BUTTON_ROWS;
        }
        return (
            <div className="my-2 flex flex-col w-full">
                {this.renderRows(buttonRows, textClass)}
            </div>
        );
    }
}

export {
    insertIntoTextInput,
    backspaceTextInput,
    Keyboard,
};