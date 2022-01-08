import React from 'react';
import {
    checkCustomVerb,
    createVerbPresentTransitiveQuiz,
    getVerb,
    QuizState,
} from '../lib/quiz';

const DISPLAY_TIME_MS = 1000;

class QuizApp extends React.Component {
    constructor(props) {
        super(props);
        this.state = this.emptyState();

        this.finishResultDisplay = this.finishResultDisplay.bind(this);
        this.onChange = this.onChange.bind(this);
        this.onCustomVerb = this.onCustomVerb.bind(this);
        this.onCustomVerbChange = this.onCustomVerbChange.bind(this);
        this.onRandomVerb = this.onRandomVerb.bind(this);
        this.onStartNew = this.onStartNew.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.onTryAgain = this.onTryAgain.bind(this);
    }

    emptyState() {
        return {
            verb: "",
            items: [],
            quizState: null,
            lastEntered: "",
            lastAccepted: false,
            display: false,
            customVerb: "",
            customVerbMessage: "",
        };
    }

    initialState(hint) {
        const state = this.emptyState();
        const verb = getVerb(hint);
        console.log("Initializing with the verb " + verb);
        const quizItems = createVerbPresentTransitiveQuiz(verb);
        state.verb = verb;
        state.items = quizItems;
        state.quizState = new QuizState(quizItems.length, 0, 0);
        return state;
    }

    onTryAgain(e) {
        e.preventDefault();
        this.setState(this.initialState(this.state.verb));
    }

    onStartNew(e) {
        e.preventDefault();
        this.setState({items: []});
    }

    getCurrentItem() {
        return this.state.items[this.state.quizState.position];
    }

    onChange(e) {
        this.setState({ lastEntered: e.target.value});
    }

    onCustomVerbChange(e) {
        this.setState({ customVerb: e.target.value });
    }

    finishResultDisplay() {
        console.log("finishing display");
        if (!this.state.display) {
            console.log("display flag is not set yet, delay finishing");
            setTimeout(this.finishResultDisplay, DISPLAY_TIME_MS);
        } else {
            const correct = this.state.lastAccepted ? 1 : 0;
            this.setState({
                display: false,
                lastEntered: "",
                quizState: this.state.quizState.advance(correct),
            });
        }
    }

    onSubmit(e) {
        e.preventDefault();
        console.log("Submitting " + this.state.lastEntered);
        const expected = this.getCurrentItem().expected;
        var accepted = false;
        if (this.state.lastEntered == expected) {
            accepted = true;
        } else {
            console.log("Entered " + this.state.lastEntered + ", but expected " + expected);
        }
        this.setState({display: true, lastAccepted: accepted});
        const time = accepted ? DISPLAY_TIME_MS : (2 * DISPLAY_TIME_MS);
        setTimeout(this.finishResultDisplay, time);
    }

    getCurrentResult() {
        if (this.state.display) {
            if (this.state.lastAccepted) {
                return <span>Ok</span>;
            } else {
                return (
                    <span>
                        Wrong! Correct answer:
                        <strong>
                            {this.getCurrentItem().expected}
                        </strong>
                    </span>
                );
            }
        }
        return "";
    }

    onRandomVerb(e) {
        e.preventDefault();
        this.setState(this.initialState(""));
    }

    getCustomVerbMessage() {
        if (this.state.customVerbMessage) {
            return <p class="text-red-500 text-xs italic">{this.state.customVerbMessage}</p>;
        }
        return "";
    }

    onCustomVerb(e) {
        e.preventDefault();
        const verb = this.state.customVerb;
        if (!checkCustomVerb(verb)) {
            console.log("the custom verb didn't pass the check: " + verb);
            const message = "The entered verb '" + verb + "' didn't pass the check, pick another please";
            this.setState({customVerb: "", customVerbMessage: message});
        } else {
            this.setState(this.initialState(this.state.customVerb));
        }
    }

    renderStartForm() {
        return (
            <div class="w-full max-w-xs flex-col items-center">
                <form onSubmit={this.onRandomVerb} class="bg-white border-4 rounded px-8 pt-6 pb-8 mb-4">
                    <input type="submit" value="Random verb" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"/>
                </form>
                <form onSubmit={this.onCustomVerb} class="bg-white border-4 rounded px-8 pt-6 pb-8 mb-4">
                    <input type="submit" value="Custom verb" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"/>
                    <div class="pt-4">
                        <input type="text" value={this.state.customVerb} onChange={this.onCustomVerbChange} class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"/>
                        {this.getCustomVerbMessage()}
                    </div>
                </form>
            </div>
        )
    }

    renderFinalForm() {
        return (
            <div>
                <p>
                    Quiz is done!
                    Correct responses:
                    <strong>
                        {this.state.quizState.correct} / {this.state.quizState.total}
                    </strong>
                </p>
                <form onSubmit={this.onTryAgain}>
                    <input type="submit" value="Restart"/>
                </form>
                <form onSubmit={this.onStartNew}>
                    <input type="submit" value="Start new"/>
                </form>
            </div>
        );
    }

    render () {
        if (this.state.items.length == 0) {
            return this.renderStartForm();
        }
        const position = this.state.quizState.position;
        const total = this.state.quizState.total;
        if (position < total) {
            const item = this.getCurrentItem();
            return (
                <div>
                    <div>
                        <strong>{position} / {total}</strong>
                    </div>
                    <div>
                        <i>{item.textHint}</i>
                        <p>{item.hint}</p>
                    </div>
                    <form onSubmit={this.onSubmit}>
                        <input type="text" size={item.expected.length} value={this.state.lastEntered} onChange={this.onChange}/>
                        <input type="submit" value="Submit" enabled={!this.state.display}/>
                        {this.getCurrentResult()}
                    </form>
                </div>
            )
        } else {
            return this.renderFinalForm();
        }
    }
}

export default QuizApp;