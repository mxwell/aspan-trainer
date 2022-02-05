import React from 'react';
import {
    checkCustomVerb,
    checkOptionalExceptionVerb,
    createVerbPresentTransitiveQuiz,
    getVerb,
    QuizState,
} from '../lib/quiz';
import TopicSelector from './topic_selector';

const DISPLAY_TIME_MS = 1000;

const TOPIC_KEYS = [
    "presentTransitive",
    "presentContinuous",
];

const TOPIC_EN_NAMES = {
    presentTransitive: "Present transitive tense",
    presentContinuous: "Present continuous tense",
};

const TOPIC_KZ_NAMES = {
    presentTransitive: "Ауыспалы осы/келер шақ",
    presentContinuous: "Нақ осы шақ",
};

class QuizApp extends React.Component {
    constructor(props) {
        super(props);
        this.state = this.defaultState()

        this.finishResultDisplay = this.finishResultDisplay.bind(this);
        this.onChange = this.onChange.bind(this);
        this.onStartQuiz = this.onStartQuiz.bind(this);
        this.onTopicChange = this.onTopicChange.bind(this);
        this.onTopicConfirm = this.onTopicConfirm.bind(this);
        this.onSentenceTypeChange = this.onSentenceTypeChange.bind(this);
        this.onVerbChange = this.onVerbChange.bind(this);
        this.onVerbChoiceChange = this.onVerbChoiceChange.bind(this);
        this.onStartNew = this.onStartNew.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.onTryAgain = this.onTryAgain.bind(this);
    }

    emptyState(hint, topic, topicConfirmed, sentenceType, forceExceptional) {
        const verb = getVerb(hint);
        return {
            verb: verb,
            isOptionalException: checkOptionalExceptionVerb(verb),
            // if the chosen verb is optionally exceptional, then we need to choose regular or exceptional form.
            forceExceptional: forceExceptional,
            items: [],
            answers: [],
            quizState: null,
            lastEntered: "",
            lastAccepted: false,
            display: false,
            topic: topic,
            topicConfirmed: topicConfirmed,
            sentenceType: sentenceType,
            customVerb: "",
            customVerbMessage: "",
        };
    }

    defaultState() {
        return this.emptyState(
            /* hint */ "",
            /* topic */ TOPIC_KEYS[0],
            /* topicConfirmed */ false,
            /* sentenceType */ "Statement",
            /* forceException */ false
        );
    }

    initialState() {
        const state = this.emptyState(
            this.state.verb,
            this.state.topic,
            this.state.topicConfirmed,
            this.state.sentenceType,
            this.state.forceExceptional
        );
        console.log("Initializing with the verb " + state.verb + ", forceExceptional=" + state.forceExceptional);
        const quizItems = createVerbPresentTransitiveQuiz(state.verb, state.sentenceType, state.forceExceptional);
        state.items = quizItems;
        state.quizState = new QuizState(quizItems.length, 0, 0);
        return state;
    }

    onTryAgain(e) {
        e.preventDefault();
        this.setState(this.initialState());
    }

    onStartNew(e) {
        e.preventDefault();
        this.setState(this.defaultState());
    }

    getCurrentItem() {
        return this.state.items[this.state.quizState.position];
    }

    onChange(e) {
        this.setState({ lastEntered: e.target.value});
    }

    onTopicChange(topic) {
        this.setState({ topic });
    }

    onTopicConfirm() {
        this.setState({ topicConfirmed: true });
    }

    onSentenceTypeChange(e) {
        this.setState({ sentenceType: e.target.value });
    }

    onVerbChange(e) {
        const verb = e.target.value;
        this.setState({ verb: verb, isOptionalException: checkOptionalExceptionVerb(verb) });
    }

    onVerbChoiceChange(e) {
        const forceExceptional = e.target.value == "exceptionVerb";
        this.setState({ forceExceptional });
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
        const answers = this.state.answers;
        answers.push(this.state.lastEntered);
        this.setState({
            answers: answers,
            display: true,
            lastAccepted: accepted,
        });
        const time = accepted ? DISPLAY_TIME_MS : (2 * DISPLAY_TIME_MS);
        setTimeout(this.finishResultDisplay, time);
    }

    getCurrentResult() {
        if (this.state.display) {
            if (this.state.lastAccepted) {
                return <p class="bg-teal-100 text-teal-900 py-4">Ok</p>;
            } else {
                return (
                    <p class="bg-red-100 text-red-700 py-4">
                        Wrong! Correct answer:
                        <span class="font-extrabold">
                            {this.getCurrentItem().expected}
                        </span>
                    </p>
                );
            }
        }
        return "";
    }

    getCustomVerbMessage() {
        if (this.state.customVerbMessage) {
            return <p class="text-red-500 text-s italic">{this.state.customVerbMessage}</p>;
        }
        return "";
    }

    onStartQuiz(e) {
        e.preventDefault();
        const verb = this.state.verb;
        if (!checkCustomVerb(verb)) {
            console.log("the custom verb didn't pass the check: " + verb);
            const message = "The entered verb '" + verb + "' didn't pass the check, pick another please";
            this.setState({verb: "", customVerbMessage: message});
        } else {
            this.setState(this.initialState());
        }
    }

    renderStartForm() {
        const verbChoiceDivClass = (
            "py-4 " +
            (this.state.isOptionalException ? "" : "hidden")
        );
        return (
            <div class="w-full max-w-screen-md flex-col py-4">
                <div class="flex justify-center">
                    <h2 class="text-2xl text-gray-400 text-bold">{TOPIC_EN_NAMES[this.state.topic]}</h2>
                </div>
                <div class="flex justify-center">
                    <h3 class="text-3xl text-blue-700 text-bold p-2">{TOPIC_KZ_NAMES[this.state.topic]}</h3>
                </div>
                <form onSubmit={this.onStartQuiz} class="bg-white border-4 rounded px-8 pt-6 pb-8 mb-4 flex flex-col">
                    <div class="w-full flex justify-between">
                        <label class="text-gray-600 text-2xl py-2">Sentence type:</label>
                        <select
                            required
                            onChange={this.onSentenceTypeChange}
                            value={this.state.sentenceType}
                            class="text-gray-800 text-2xl px-4 py-2">
                            <option value="Statement">Statement</option>
                            <option value="Negative">Negative</option>
                            <option value="Question">Question</option>
                        </select>
                    </div>
                    <div class="py-4">
                        <div class="flex justify-between">
                            <label class="text-gray-600 text-2xl pr-4 py-2">Verb:</label>
                            <input
                                type="text"
                                placeHolder="verb ending with -у/-ю"
                                maxlength="36"
                                value={this.state.verb}
                                onChange={this.onVerbChange}
                                class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 text-2xl leading-tight focus:outline-none focus:shadow-outline"/>
                        </div>
                        <div class={verbChoiceDivClass}>
                            <label class="text-orange-400 text-xl">The verb has two meanings with one behaving regularly and one behaving like an exception</label>
                            <div class="py-4" onChange={this.onVerbChoiceChange}>
                                <input
                                    type="radio"
                                    name="verbChoice"
                                    id="regularVerb"
                                    value="regularVerb"
                                    checked={!this.state.forceExceptional}
                                />
                                <label for="regularVerb" class="text-gray-800 text-2xl px-4">Regular</label>
                                <input
                                    type="radio"
                                    name="verbChoice"
                                    id="exceptionVerb"
                                    value="exceptionVerb"
                                    checked={this.state.forceExceptional}
                                />
                                <label for="exceptionVerb" class="text-gray-800 text-2xl px-4">Exception</label>
                            </div>
                        </div>
                        {this.getCustomVerbMessage()}
                    </div>
                    <input type="submit" value="Start quiz" class="bg-blue-500 hover:bg-blue-700 text-white text-2xl font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"/>
                </form>
            </div>
        )
    }

    renderFinalForm() {
        const rows = [];
        const tdBaseClass = "text-center px-2 py-2"
        for (var i = 0; i < this.state.items.length; ++i) {
            const expected = this.state.items[i].expected;
            const answer = this.state.answers[i];
            const answerClass = expected != answer ? "text-red-600" : "text-teal-600";
            rows.push(
                <tr class="border-t-2">
                    <td class={tdBaseClass}>{expected}</td>
                    <td class={tdBaseClass + " " + answerClass}>{answer}</td>
                </tr>
            );
        }
        return (
            <div class="py-6">
                <p class="bg-teal-100 text-teal-900 text-xl py-6 px-4">
                    <span class="px-2">
                        Quiz is done! Correct responses:
                    </span>
                    <span class="inline-block bg-teal-200 rounded-full px-3 py-1 font-semibold mr-2 mb-2">
                        {this.state.quizState.correct} / {this.state.quizState.total}
                    </span>
                </p>
                <div class="py-6">
                    <table class="w-full">
                        <tr>
                            <th>Expected</th>
                            <th>Your answers</th>
                        </tr>
                        {rows}
                    </table>
                </div>
                <form onSubmit={this.onTryAgain} class="py-4 flex flex-col">
                    <input type="submit" value="Restart" class="bg-blue-500 hover:bg-blue-700 text-white text-2xl font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"/>
                </form>
                <form onSubmit={this.onStartNew} class="py-4 flex flex-col">
                    <input type="submit" value="Start new" class="bg-blue-500 hover:bg-blue-700 text-white text-2xl font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"/>
                </form>
            </div>
        );
    }

    render () {
        if (!this.state.topicConfirmed) {
            return <TopicSelector
                topicKeys={TOPIC_KEYS}
                topicNames={TOPIC_EN_NAMES}
                onTopicChange={this.onTopicChange}
                onTopicConfirm={this.onTopicConfirm}
                topic={this.state.topic}
            />;
        }
        if (this.state.items.length == 0) {
            return this.renderStartForm();
        }
        const position = this.state.quizState.position;
        const total = this.state.quizState.total;
        if (position < total) {
            const item = this.getCurrentItem();
            return (
                <div class="py-6">
                    <div class="flex justify-between">
                        <div>
                            <span class="inline-block bg-gray-200 rounded-full px-3 py-1 font-semibold mr-2 mb-2">{this.state.verb}</span>
                            <span class="inline-block bg-gray-200 rounded-full px-3 py-1 font-semibold text-gray-700 mr-2 mb-2">{this.state.sentenceType.toLowerCase()}</span>
                            <span class="inline-block bg-gray-200 rounded-full px-3 py-1 font-semibold text-gray-700 mr-2 mb-2">{position} / {total}</span>
                        </div>
                        <button class="inline-block bg-gray-600 hover:bg-gray-900 text-white font-bold rounded px-3 py-1 mr-2 mb-2" onClick={this.onStartNew}>X</button>
                    </div>
                    <p class="text-5xl text-purple-600 py-4">{item.textHint}</p>
                    <p class="text-2xl text-gray-900">{item.hint}</p>
                    <form onSubmit={this.onSubmit} class="py-2 flex flex-col">
                        <div class="py-2">
                            <input
                                type="text"
                                size={item.expected.length}
                                maxlength={3 * item.expected.length}
                                value={this.state.lastEntered}
                                onChange={this.onChange}
                                placeholder={item.textHint}
                                class="shadow appearance-none border rounded w-full py-2 px-3 text-2xl text-gray-700 leading-tight focus:outline-none focus:shadow-outline"/>
                        </div>
                        <input type="submit" value="Submit" enabled={!this.state.display} class="bg-blue-500 hover:bg-blue-700 text-white text-2xl font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"/>
                    </form>
                    {this.getCurrentResult()}
                </div>
            )
        } else {
            return this.renderFinalForm();
        }
    }
}

export default QuizApp;