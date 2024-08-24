import React from "react";
import { Keyboard, backspaceTextInput, insertIntoTextInput } from "./keyboard";

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
        this.onInsert = this.onInsert.bind(this);
        this.onBackspace = this.onBackspace.bind(this);
    }

    onWordChange(event) {
        event.preventDefault();
        const lastEnteredWord = event.target.value;
        this.props.changeCallback(lastEnteredWord);
    }

    updateText(change) {
        this.props.changeCallback(change.newText);
        this.setState(
            {},
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
                <Keyboard
                    insertCallback={this.onInsert}
                    backspaceCallback={this.onBackspace} />
            </form>
        );
    }
}

export default KeyboardInput;