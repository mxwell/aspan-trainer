import React from 'react';
import {
    checkOptionalExceptionVerb,
    VerbQuizBuilder,
    getVerb,
    getPresentContinuousVerb,
    QuizState,
} from '../lib/quiz';
import { closeButton } from './close_button';
import TopicSelector from './topic_selector';
import VerbQuizDetails from './verb_quiz_details';

const DISPLAY_TIME_MS = 1000;

const TOPIC_KEYS = [
    "presentTransitive",
    "presentContinuous",
    "pastTense",
    "wantClause",
    "canClause",
];

const TOPIC_EN_NAMES = {
    presentTransitive: "Present transitive tense",
    presentContinuous: "Present continuous tense",
    pastTense: "Past tense",
    wantClause: "Want clause",
    canClause: "Can clause",
};

const TOPIC_KZ_NAMES = {
    presentTransitive: "Ауыспалы осы/келер шақ",
    presentContinuous: "Нақ осы шақ",
    pastTense: "Жедел өткен шақ",
    wantClause: "Қалау рай",
    canClause: "Алу",
};

const SENTENCE_TYPES = [
    "Statement",
    "Negative",
    "Question",
];

const PRESENT_CONT_AUX_NAMES = [
    "жату",
    "тұру",
    "жүру",
    "отыру",
];

class QuizApp extends React.Component {
    constructor(props) {
        super(props);
        this.state = this.defaultState()

        /* TopicSelector handlers */
        this.onTopicChange = this.onTopicChange.bind(this);
        this.onTopicConfirm = this.onTopicConfirm.bind(this);

        /* VerbQuizDetails handlers */
        this.onStartQuiz = this.onStartQuiz.bind(this);
        this.onSentenceTypeChange = this.onSentenceTypeChange.bind(this);
        this.onVerbChange = this.onVerbChange.bind(this);
        this.onAuxVerbChange = this.onAuxVerbChange.bind(this);
        this.onTopicCancel = this.onTopicCancel.bind(this);
        this.setForceExceptional = this.setForceExceptional.bind(this);

        this.onTryAgain = this.onTryAgain.bind(this);
        this.onStartNew = this.onStartNew.bind(this);
        this.onChange = this.onChange.bind(this);
        this.finishResultDisplay = this.finishResultDisplay.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
    }

    presetVerb(topic) {
        if (topic == TOPIC_KEYS[1]) {
            return getPresentContinuousVerb();
        }
        return getVerb("");
    }

    makeState(verb, needAuxVerb, auxVerbId, topic, topicConfirmed, sentenceType, forceExceptional) {
        const isOptionalException = verb.length > 0 ? checkOptionalExceptionVerb(verb) : false;
        return {
            verb: verb,
            isOptionalException: isOptionalException,
            needAuxVerb: needAuxVerb,
            auxVerbId: auxVerbId,
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
        };
    }

    defaultState() {
        return this.makeState(
            /* verb */ "",
            /* needAuxVerb */ false,
            /* auxVerbId */ 0,
            /* topic */ TOPIC_KEYS[0],
            /* topicConfirmed */ false,
            /* sentenceType */ SENTENCE_TYPES[0],
            /* forceException */ false
        );
    }

    createQuizItems(state) {
        console.log(`Initializing: verb ${state.verb}, forceExceptional ${state.forceExceptional}`);
        let verbQuizBuilder = new VerbQuizBuilder(state.verb, state.forceExceptional, state.sentenceType);
        if (state.topic == TOPIC_KEYS[0]) {
            return verbQuizBuilder.buildPresentTransitive();
        }
        if (state.topic == TOPIC_KEYS[1]) {
            const auxVerb = PRESENT_CONT_AUX_NAMES[state.auxVerbId];
            console.log(`Using aux verb: id ${state.auxVerbId}, verb ${auxVerb}`)
            return verbQuizBuilder.buildPresentContinuous(auxVerb);
        }
        if (state.topic == TOPIC_KEYS[2]) {
            return verbQuizBuilder.buildPast();
        }
        if (state.topic == TOPIC_KEYS[3]) {
            return verbQuizBuilder.buildWantClause();
        }
        if (state.topic == TOPIC_KEYS[4]) {
            return verbQuizBuilder.buildCanClause();
        }
        return [];
    }

    initializedQuizState() {
        const state = this.makeState(
            this.state.verb,
            this.state.needAuxVerb,
            this.state.auxVerbId,
            this.state.topic,
            this.state.topicConfirmed,
            this.state.sentenceType,
            this.state.forceExceptional
        );
        const quizItems = this.createQuizItems(state);
        if (quizItems.length == 0) {
            console.log("Failed to create quiz items. Abort!");
            return this.defaultState();
        }
        state.items = quizItems;
        state.quizState = new QuizState(quizItems.length, 0, 0);
        return state;
    }

    /* TopicSelector handlers */
    onTopicChange(topic) {
        let needAuxVerb = topic == TOPIC_KEYS[1];
        this.setState({
            topic,
            needAuxVerb,
        });
    }
    onTopicConfirm() {
        this.setState((state, props) => ({
            topicConfirmed: true,
            verb: this.presetVerb(state.topic),
        }));
    }

    /* VerbQuizDetails handlers */
    onStartQuiz() {
        this.setState(this.initializedQuizState());
    }
    onSentenceTypeChange(sentenceType) {
        this.setState({ sentenceType });
    }
    onVerbChange(verb) {
        this.setState({ verb: verb, isOptionalException: checkOptionalExceptionVerb(verb) });
    }
    onAuxVerbChange(auxVerbId) {
        this.setState({ auxVerbId: Number(auxVerbId) });
    }
    onTopicCancel() {
        this.setState({
            topicConfirmed: false,
            verb: "",
        });
    }
    setForceExceptional(forceExceptional) {
        this.setState({ forceExceptional });
    }

    onTryAgain(e) {
        e.preventDefault();
        this.setState(this.initializedQuizState());
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
            return <VerbQuizDetails
                verb={this.state.verb}
                needAuxVerb={this.state.needAuxVerb}
                auxVerbId={this.state.auxVerbId}
                onStartQuiz={this.onStartQuiz}
                onSentenceTypeChange={this.onSentenceTypeChange}
                onVerbChange={this.onVerbChange}
                onAuxVerbChange={this.onAuxVerbChange}
                onTopicCancel={this.onTopicCancel}
                setForceExceptional={this.setForceExceptional}
                isOptionalException={this.state.isOptionalException}
                titleEn={TOPIC_EN_NAMES[this.state.topic]}
                titleKz={TOPIC_KZ_NAMES[this.state.topic]}
                auxVerbNames={PRESENT_CONT_AUX_NAMES}
                sentenceType={this.state.sentenceType}
                sentenceTypes={SENTENCE_TYPES}
                forceExceptional={this.state.forceExceptional}
            />;
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
                        {closeButton({onClick: this.onStartNew})}
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