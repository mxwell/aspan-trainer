import React from 'react';
import {
    I18N_LANG_EN,
    I18N_LANG_RU,
    i18n,
    retrieveUiLang,
    storeUiLang,
    clearUiLang
} from '../lib/i18n';
import {
    checkOptionalExceptionVerb,
    VerbQuizBuilder,
    getVerb,
    getPresentContinuousVerb,
    QuizState,
} from '../lib/quiz';
import { ActionButtonForm } from './action_button_form';
import { closeButton } from './close_button';
import LanguageSelector from './language_selector';
import TopicSelector from './topic_selector';
import VerbQuizDetails from './verb_quiz_details';

const DISPLAY_TIME_MS = 1000;
const MISTAKE_DISPLAY_TIME_MS = 5000;

const LANG_KEYS = [I18N_LANG_EN, I18N_LANG_RU];

const TOPIC_KEYS = [
    "presentTransitive",
    "presentContinuous",
    "pastTense",
    "wantClause",
    "canClause",
];

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
        this.disableEvents = false;
        this.state = this.defaultState();

        /* LanguageSelector handlers */
        this.onLanguageSelection = this.onLanguageSelection.bind(this);

        /* TopicSelector handlers */
        this.onTopicSelection = this.onTopicSelection.bind(this);
        this.onLanguageReset = this.onLanguageReset.bind(this);

        /* VerbQuizDetails handlers */
        this.onStartQuiz = this.onStartQuiz.bind(this);
        this.onSentenceTypeChange = this.onSentenceTypeChange.bind(this);
        this.onVerbChange = this.onVerbChange.bind(this);
        this.onAuxVerbChange = this.onAuxVerbChange.bind(this);
        this.onTopicCancel = this.onTopicCancel.bind(this);
        this.setForceExceptional = this.setForceExceptional.bind(this);

        /* final form handlers */
        this.onTryAgain = this.onTryAgain.bind(this);
        this.onTopicContinue = this.onTopicContinue.bind(this);
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

    makeState(lang, langConfirmed, verb, auxVerbId, topic, topicConfirmed, sentenceType, forceExceptional) {
        const isOptionalException = checkOptionalExceptionVerb(verb);
        const needAuxVerb = topic == TOPIC_KEYS[1];
        return {
            lang: lang,
            langConfirmed: langConfirmed,
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
        var retrievedLang = retrieveUiLang();
        return this.makeState(
            /* lang */ retrievedLang || I18N_LANG_EN,
            /* langConfirmed */ retrievedLang != null,
            /* verb */ "",
            /* auxVerbId */ 0,
            /* topic */ TOPIC_KEYS[0],
            /* topicConfirmed */ false,
            /* sentenceType */ SENTENCE_TYPES[0],
            /* forceExceptional */ false
        );
    }

    initializedTopicState(topic) {
        const verb = this.presetVerb(topic);
        const state = this.makeState(
            this.state.lang,
            this.state.langConfirmed,
            verb,
            /* auxVerbId */ 0,
            topic,
            /* topicConfirmed */ true,
            /* sentenceType */ SENTENCE_TYPES[0],
            /* forceExceptional */ false,
        );
        return state;
    }

    createQuizItems(state) {
        var auxVerb = "";
        if (state.topic == TOPIC_KEYS[1]) {
            auxVerb = PRESENT_CONT_AUX_NAMES[state.auxVerbId];
        }

        console.log(`Creating quiz: verb "${state.verb}", forceExceptional ${state.forceExceptional}, auxVerb "${auxVerb}"`);
        let verbQuizBuilder = new VerbQuizBuilder(state.lang, state.topic, state.verb, state.forceExceptional, state.sentenceType);
        return verbQuizBuilder.build(auxVerb);
    }

    initializedQuizState() {
        const state = this.makeState(
            this.state.lang,
            this.state.langConfirmed,
            this.state.verb,
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

    i18n(key) {
        return i18n(key, this.state.lang);
    }

    /* LanguageSelector handlers */
    onLanguageSelection(lang) {
        if (storeUiLang(lang)) {
            this.setState({
                lang: lang,
                langConfirmed: true,
            });
        }
    }

    /* TopicSelector handlers */
    onTopicSelection(topic) {
        this.setState(this.initializedTopicState(topic));
    }
    onLanguageReset() {
        clearUiLang();
        this.setState({
            langConfirmed: false,
        });
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
        });
    }
    setForceExceptional(forceExceptional) {
        this.setState({ forceExceptional });
    }
    /* final form handlers */
    onTryAgain(e) {
        e.preventDefault();
        this.setState(this.initializedQuizState());
    }
    onTopicContinue(e) {
        e.preventDefault();
        this.setState(this.initializedTopicState(this.state.topic));
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
            setTimeout(this.finishResultDisplay, DISPLAY_TIME_MS * 2);
        } else {
            const correct = this.state.lastAccepted ? 1 : 0;
            this.setState({
                display: false,
                lastEntered: "",
                quizState: this.state.quizState.advance(correct),
            });
            this.disableEvents = false;
        }
    }

    onSubmit(e) {
        e.preventDefault();
        if (this.disableEvents) {
            console.log("Suppressing input event during display");
            return;
        }
        const response = this.state.lastEntered;
        if (response.length == 0) {
            console.log("Empty input, ignoring it")
            return;
        }
        if (this.state.display) {
            console.log("Suppressing input event during display");
            return;
        }
        this.disableEvents = true;
        this.setState({display: true});
        console.log(`Submitting ${response}`);
        const expected = this.getCurrentItem().expected;
        var accepted = false;
        if (response == expected) {
            accepted = true;
        } else {
            console.log(`Entered ${response}, but expected ${expected}`);
        }
        this.setState(function(state, props) {
            const answers = state.answers;
            answers.push(response);
            return {
                answers: answers,
                lastAccepted: accepted,
            }
        });
        const time = accepted ? DISPLAY_TIME_MS : MISTAKE_DISPLAY_TIME_MS;
        setTimeout(this.finishResultDisplay, time);
    }

    getCurrentResult() {
        if (this.state.display) {
            if (this.state.lastAccepted) {
                return <p class="bg-teal-100 text-teal-900 py-4">{this.i18n("feedbackCorrect")}</p>;
            } else {
                return (
                    <p class="bg-red-100 text-red-700 py-4">
                        {this.i18n("feedbackWrongAndHereIsCorrect")}
                        <span class="font-extrabold px-2">
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
                        {this.i18n("quizDone")}
                    </span>
                    <span class="inline-block bg-teal-200 rounded-full px-3 py-1 font-semibold mr-2 mb-2">
                        {this.state.quizState.correct} / {this.state.quizState.total}
                    </span>
                </p>
                <div class="py-6">
                    <table class="w-full">
                        <tr>
                            <th>{this.i18n("columnExpected")}</th>
                            <th>{this.i18n("columnYourAnswers")}</th>
                        </tr>
                        {rows}
                    </table>
                </div>
                <ActionButtonForm
                    onSubmit={this.onTryAgain}
                    actionName={this.i18n("buttonRestartQuiz")}
                    secondary={true}
                />
                <ActionButtonForm
                    onSubmit={this.onTopicContinue}
                    actionName={this.i18n("buttonContinueTopic")}
                />
                <ActionButtonForm
                    onSubmit={this.onStartNew}
                    actionName={this.i18n("buttonChangeTopic")}
                />
            </div>
        );
    }

    render () {
        if (!this.state.langConfirmed) {
            return <LanguageSelector
                langKeys={LANG_KEYS}
                onLanguageSelection={this.onLanguageSelection}
            />;
        }
        if (!this.state.topicConfirmed) {
            return <TopicSelector
                topicKeys={TOPIC_KEYS}
                lang={this.state.lang}
                onTopicSelection={this.onTopicSelection}
                onLanguageReset={this.onLanguageReset}
            />;
        }
        if (this.state.items.length == 0) {
            return <VerbQuizDetails
                lang={this.state.lang}
                topic={this.state.topic}
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
                            <span class="inline-block bg-gray-200 rounded-full px-3 py-1 font-semibold text-gray-700 mr-2 mb-2">{this.i18n(this.state.sentenceType.toLowerCase())}</span>
                            <span class="inline-block bg-gray-200 rounded-full px-3 py-1 font-semibold text-gray-700 mr-2 mb-2">{position} / {total}</span>
                        </div>
                        {closeButton({onClick: this.onTopicContinue})}
                    </div>
                    <p class="text-5xl text-purple-600 py-4">{item.textHint}</p>
                    <p class="text-2xl text-gray-900">{item.hint}</p>
                    <form onSubmit={this.onSubmit} class="py-2 flex flex-col" disabled={this.state.display}>
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
                        <input
                            type="submit"
                            value={this.i18n("buttonSubmit")}
                            class="bg-blue-500 hover:bg-blue-700 text-white text-2xl font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        />
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