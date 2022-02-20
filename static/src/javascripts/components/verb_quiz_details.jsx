import React from "react";
import { I18N_LANG_KZ, i18n } from '../lib/i18n';
import { closeButton } from './close_button';
import { checkCustomVerb, checkPresentContPair } from '../lib/quiz';
import { renderOptionsWithI18nKeys, renderOptionsWithNames } from "../lib/react_util";

class VerbQuizDetails extends React.Component {
    constructor(props) {
        super(props);
        this.state = this.initialState();

        this.handleStartQuiz = this.handleStartQuiz.bind(this);
        this.handleSentenceTypeChange = this.handleSentenceTypeChange.bind(this);
        this.handleVerbChange = this.handleVerbChange.bind(this);
        this.handleVerbChoiceChange = this.handleVerbChoiceChange.bind(this);
        this.handleAuxVerbChange = this.handleAuxVerbChange.bind(this);
    }

    initialState() {
        return {verbMessage: ""};
    }

    i18n(key) {
        return i18n(key, this.props.lang);
    }

    handleStartQuiz(e) {
        e.preventDefault();

        const verb = this.props.verb;
        if (!checkCustomVerb(verb)) {
            console.log("the custom verb didn't pass the check: " + verb);
            const verbMessage = this.i18n("EnteredVerbNotPassed");
            this.setState({ verbMessage });
        } else if (this.props.needAuxVerb && !checkPresentContPair(verb, this.props.auxVerbNames[this.props.auxVerbId])) {
            const verbMessage = this.i18n("IncompatibleAuxVerb");
            this.setState({ verbMessage });
        } else {
            this.props.onStartQuiz();
        }
    }

    handleSentenceTypeChange(e) {
        this.props.onSentenceTypeChange(e.target.value);
    }

    handleVerbChange(e) {
        this.props.onVerbChange(e.target.value);
        this.setState(this.initialState());
    }

    handleVerbChoiceChange(e) {
        const forceExceptional = e.target.value == "exceptionVerb";
        this.props.setForceExceptional(forceExceptional);
    }

    handleAuxVerbChange(e) {
        this.props.onAuxVerbChange(e.target.value);
        this.setState(this.initialState());
    }

    renderVerbAlert(text) {
        if (text) {
            return <p class="text-red-500 text-s italic">{text}</p>;
        }
        return "";
    }

    renderAuxVerbElements() {
        if (!this.props.needAuxVerb) {
            return "";
        }
        return (
            <div class="flex justify-between py-2">
                <label class="text-gray-600 text-2xl pr-4 py-2">{this.i18n("AuxVerb")}:</label>
                <select
                    required
                    onChange={this.handleAuxVerbChange}
                    value={this.props.auxVerbId}
                    class="text-gray-800 text-2xl px-4 py-2">
                    {renderOptionsWithNames(this.props.auxVerbNames)}
                </select>
            </div>
        );
    }

    render() {
        /* additional inputs for exceptional verbs */
        const verbChoiceDivClass = (
            "py-4 " +
            (this.props.isOptionalException ? "" : "hidden")
        );
        return (
            <div class="w-full max-w-screen-md flex-col py-4">
                <div class="flex justify-between">
                    <h2 class="text-2xl text-gray-400 text-bold">{this.i18n(this.props.topic)}</h2>
                    {closeButton({onClick: this.props.onTopicCancel})}
                </div>
                <div class="flex justify-center">
                    <h3 class="text-3xl text-blue-700 text-bold p-2">{i18n(this.props.topic, I18N_LANG_KZ)}</h3>
                </div>
                <form onSubmit={this.handleStartQuiz} class="bg-white border-4 rounded px-8 pt-6 pb-8 mb-4 flex flex-col">
                    <div class="w-full flex justify-between">
                        <label class="text-gray-600 text-2xl py-2">{this.i18n("SentenceType")}:</label>
                        <select
                            required
                            onChange={this.handleSentenceTypeChange}
                            value={this.props.sentenceType}
                            class="text-gray-800 text-2xl px-4 py-2">
                            {renderOptionsWithI18nKeys(this.props.sentenceTypes, this.props.lang)}
                        </select>
                    </div>
                    <div class="py-4">
                        <div class="flex justify-between">
                            <label class="text-gray-600 text-2xl pr-4 py-2">{this.i18n("Verb")}:</label>
                            <input
                                type="text"
                                placeHolder="verb ending with -у/-ю"
                                maxlength="36"
                                value={this.props.verb}
                                onChange={this.handleVerbChange}
                                class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 text-2xl leading-tight focus:outline-none focus:shadow-outline"/>
                        </div>
                        <div class={verbChoiceDivClass}>
                            <label class="text-orange-400 text-xl">{this.i18n("chooseVerbExceptionOrNot")}</label>
                            <div class="py-4" onChange={this.handleVerbChoiceChange}>
                                <input
                                    type="radio"
                                    name="verbChoice"
                                    id="regularVerb"
                                    value="regularVerb"
                                    checked={!this.props.forceExceptional}
                                />
                                <label for="regularVerb" class="text-gray-800 text-2xl px-4">{this.i18n("RegularVerb")}</label>
                                <input
                                    type="radio"
                                    name="verbChoice"
                                    id="exceptionVerb"
                                    value="exceptionVerb"
                                    checked={this.props.forceExceptional}
                                />
                                <label for="exceptionVerb" class="text-gray-800 text-2xl px-4">{this.i18n("ExceptionVerb")}</label>
                            </div>
                        </div>
                        {this.renderAuxVerbElements()}
                        {this.renderVerbAlert(this.state.verbMessage)}
                    </div>
                    <input
                        type="submit"
                        value={this.i18n("StartQuiz")}
                        class="bg-blue-500 hover:bg-blue-700 text-white text-2xl font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    />
                </form>
            </div>
        );
    }
}

export default VerbQuizDetails;