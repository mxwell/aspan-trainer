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
    composeAnswer,
    collectAnswerOptions,
    getVerb,
    getPresentContinuousVerb,
    QuizState,
    storeDoneQuizes,
    retrieveDoneQuizes
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
    "optativeMood",
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

const DIFFICULTY_LEVELS = [
    "easy",  // user is presented with variants of answer to choose; one click is required
    "hard",  // user is required to type in the whole phrase and to click "Submit"
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
        this.onDifficultyLevelChange = this.onDifficultyLevelChange.bind(this);

        /* final form handlers */
        this.onTryAgain = this.onTryAgain.bind(this);
        this.onTopicContinue = this.onTopicContinue.bind(this);
        this.onStartNew = this.onStartNew.bind(this);

        this.onChange = this.onChange.bind(this);
        this.finishResultDisplay = this.finishResultDisplay.bind(this);
        this.onExtraKeyClick = this.onExtraKeyClick.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
    }

    presetVerb(topic) {
        if (topic == TOPIC_KEYS[1]) {
            return getPresentContinuousVerb();
        }
        return getVerb("");
    }

    makeState(lang, langConfirmed, verb, auxVerbId, topic, topicConfirmed, sentenceType, forceExceptional, doneQuizes, difficultyLevel) {
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
            doneQuizes: doneQuizes,
            difficultyLevel: difficultyLevel,
        };
    }

    defaultState() {
        var retrievedLang = retrieveUiLang();
        const retrievedDoneQuizes = retrieveDoneQuizes();
        return this.makeState(
            /* lang */ retrievedLang || I18N_LANG_EN,
            /* langConfirmed */ retrievedLang != null,
            /* verb */ "",
            /* auxVerbId */ 0,
            /* topic */ TOPIC_KEYS[0],
            /* topicConfirmed */ false,
            /* sentenceType */ SENTENCE_TYPES[0],
            /* forceExceptional */ false,
            /* doneQuizes */ retrievedDoneQuizes,
            /* difficultyLevel */ DIFFICULTY_LEVELS[0],
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
            this.state.doneQuizes,
            this.state.difficultyLevel,
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
            this.state.forceExceptional,
            this.state.doneQuizes,
            this.state.difficultyLevel
        );
        const quizItems = this.createQuizItems(state);
        if (quizItems.length == 0) {
            console.log("Failed to create quiz items. Abort!");
            return this.defaultState();
        }
        state.items = quizItems;
        const answerOptions = collectAnswerOptions(quizItems);
        state.quizState = new QuizState(quizItems.length, 0, 0, answerOptions);
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
    onDifficultyLevelChange(difficultyLevel) {
        this.setState({ difficultyLevel });
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
            this.setState(function(state, props) {
                const nextQuizState = state.quizState.advance(correct);
                const update = {
                    display: false,
                    lastEntered: "",
                    quizState: nextQuizState,
                    doneQuizes: state.doneQuizes,
                };
                if (nextQuizState.done() && !state.quizState.done()) {
                    const newDoneQuizes = state.doneQuizes + 1;
                    storeDoneQuizes(newDoneQuizes);
                    update.doneQuizes = newDoneQuizes;
                }
                return update;
            });
            this.disableEvents = false;
        }
    }

    onExtraKeyClick(e) {
        e.preventDefault();
        const value = e.target.value;
        this.setState(function(state, props) {
            const lastEntered = state.lastEntered + value;
            return { lastEntered };
        });
    }

    onSubmit(e) {
        e.preventDefault();
        if (this.disableEvents) {
            console.log("Suppressing input event during display");
            return;
        }
        let response = null;
        if (this.state.difficultyLevel == DIFFICULTY_LEVELS[0]) {
            const value = e.target.value;
            response = composeAnswer(this.getCurrentItem().expectedPronoun, value);
        } else {
            response = this.state.lastEntered;
        }
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
        var surveyInvitation = null;
        if (this.state.doneQuizes <= 5) {
            surveyInvitation = (<div class="py-12">
                <p class="bg-red-400 px-4 text-bold py-4">
                    {this.i18n("inviteToSurvey")} <a class="underline" href="https://forms.yandex.ru/u/6216a3a6acda5a1898d70ba8/">{this.i18n("linkShortSurvey")}</a>!
                </p>
            </div>);
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
                {surveyInvitation}
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

    renderExtraKeys() {
        const buttons = [];
        for (const key of ["ә", "і", "ң", "ғ", "ү", "ұ", "қ", "ө", "һ"]) {
            const button = <input
                type="button"
                value={key}
                onClick={this.onExtraKeyClick}
                class="bg-gray-400 text-white text-xl font-bold py-2 px-4 rounded mx-2"
            />;
            buttons.push(button);
        }
        return buttons;
    }

    renderButtonSelectionUserInput() {
        const buttons = [];
        for (const option of this.state.quizState.options) {
            const button = (<span class="p-1">
                <input
                type="button"
                value={option}
                onClick={this.onSubmit}
                class="bg-blue-400 hover:bg-blue-700 text-white text-2xl py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                />
            </span>);
            buttons.push(button);
        }
        return (
            <form onSubmit={this.onSubmit} class="py-2 flex flex-col" disabled={this.state.display}>
                <div class="py-2 flex flex-wrap">
                    {buttons}
                </div>
            </form>
        );
    }

    renderManualUserInput() {
        const item = this.getCurrentItem();
        return (
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
                <div class="py-2 flex">
                    {this.renderExtraKeys()}
                </div>
                <input
                    type="submit"
                    value={this.i18n("buttonSubmit")}
                    class="bg-blue-500 hover:bg-blue-700 text-white text-2xl font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                />
            </form>
        );
    }

    renderUserInput() {
        if (this.state.difficultyLevel == DIFFICULTY_LEVELS[0]) {
            return this.renderButtonSelectionUserInput();
        } else if (this.state.difficultyLevel == DIFFICULTY_LEVELS[1]) {
            return this.renderManualUserInput();
        } else {
            return <p>invalid difficulty level</p>;
        }
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
                difficultyLevel={this.state.difficultyLevel}
                difficultyLevels={DIFFICULTY_LEVELS}
                onDifficultyLevelChange={this.onDifficultyLevelChange}
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
                    {this.renderUserInput()}
                    {this.getCurrentResult()}
                </div>
            )
        } else {
            return this.renderFinalForm();
        }
    }
}

export default QuizApp;