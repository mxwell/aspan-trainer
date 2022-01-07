import React from 'react';
import {
    createVerbPresentTransitiveQuiz,
    QuizState
} from '../lib/quiz';

const DISPLAY_TIME_MS = 1000;

class QuizApp extends React.Component {
    constructor(props) {
        super(props);
        this.state = this.initialState()

        this.onChange = this.onChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.finishResultDisplay = this.finishResultDisplay.bind(this);
        this.onTryAgain = this.onTryAgain.bind(this);
    }

    initialState() {
        const quizItems = createVerbPresentTransitiveQuiz("бару");
        return {
            items: quizItems,
            quizState: new QuizState(quizItems.length, 0, 0),
            lastEntered: "",
            lastAccepted: false,
            display: false,
        };
    }

    onTryAgain(e) {
        e.preventDefault();
        this.setState(this.initialState());        
    }

    getCurrentItem() {
        return this.state.items[this.state.quizState.position];
    }

    onChange(e) {
        this.setState({ lastEntered: e.target.value});
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

    render () {
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
                        <input type="submit" value="Try again"/>
                    </form>
                </div>
            );
        }
    }
}

export default QuizApp;