import React from "react";
import { checkCustomVerb } from '../lib/quiz';
import { renderOptionsWithKeys } from "../lib/react_util";

class VerbQuizDetails extends React.Component {
    constructor(props) {
        super(props);
        this.handleStartQuiz = this.handleStartQuiz.bind(this);
        this.handleSentenceTypeChange = this.handleSentenceTypeChange.bind(this);
        this.handleVerbChange = this.handleVerbChange.bind(this);
        this.handleVerbChoiceChange = this.handleVerbChoiceChange.bind(this);
    }

    handleStartQuiz(e) {
        e.preventDefault();
        const verb = this.props.verb;
        if (!checkCustomVerb(verb)) {
            console.log("the custom verb didn't pass the check: " + verb);
            const message = "The entered verb '" + verb + "' didn't pass the check, pick another please";
            this.props.onInvalidCustomVerb(message);
        } else {
            this.props.onStartQuiz();
        }
    }

    handleSentenceTypeChange(e) {
        this.props.onSentenceTypeChange(e.target.value);
    }

    handleVerbChange(e) {
        this.props.onVerbChange(e.target.value);
    }

    handleVerbChoiceChange(e) {
        const forceExceptional = e.target.value == "exceptionVerb";
        this.props.setForceExceptional(forceExceptional);
    }

    getCustomVerbMessage() {
        if (this.props.customVerbMessage) {
            return <p class="text-red-500 text-s italic">{this.props.customVerbMessage}</p>;
        }
        return "";
    }

    render() {
        /* additional inputs for exceptional verbs */
        const verbChoiceDivClass = (
            "py-4 " +
            (this.props.isOptionalException ? "" : "hidden")
        );
        return (
            <div class="w-full max-w-screen-md flex-col py-4">
                <div class="flex justify-center">
                    <h2 class="text-2xl text-gray-400 text-bold">{this.props.titleEn}</h2>
                </div>
                <div class="flex justify-center">
                    <h3 class="text-3xl text-blue-700 text-bold p-2">{this.props.titleKz}</h3>
                </div>
                <form onSubmit={this.handleStartQuiz} class="bg-white border-4 rounded px-8 pt-6 pb-8 mb-4 flex flex-col">
                    <div class="w-full flex justify-between">
                        <label class="text-gray-600 text-2xl py-2">Sentence type:</label>
                        <select
                            required
                            onChange={this.handleSentenceTypeChange}
                            value={this.props.sentenceType}
                            class="text-gray-800 text-2xl px-4 py-2">
                            {renderOptionsWithKeys(this.props.sentenceTypes)}
                        </select>
                    </div>
                    <div class="py-4">
                        <div class="flex justify-between">
                            <label class="text-gray-600 text-2xl pr-4 py-2">Verb:</label>
                            <input
                                type="text"
                                placeHolder="verb ending with -у/-ю"
                                maxlength="36"
                                value={this.props.verb}
                                onChange={this.handleVerbChange}
                                class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 text-2xl leading-tight focus:outline-none focus:shadow-outline"/>
                        </div>
                        <div class={verbChoiceDivClass}>
                            <label class="text-orange-400 text-xl">The verb has two meanings with one behaving regularly and one behaving like an exception</label>
                            <div class="py-4" onChange={this.handleVerbChoiceChange}>
                                <input
                                    type="radio"
                                    name="verbChoice"
                                    id="regularVerb"
                                    value="regularVerb"
                                    checked={!this.props.forceExceptional}
                                />
                                <label for="regularVerb" class="text-gray-800 text-2xl px-4">Regular</label>
                                <input
                                    type="radio"
                                    name="verbChoice"
                                    id="exceptionVerb"
                                    value="exceptionVerb"
                                    checked={this.props.forceExceptional}
                                />
                                <label for="exceptionVerb" class="text-gray-800 text-2xl px-4">Exception</label>
                            </div>
                        </div>
                        {this.getCustomVerbMessage()}
                    </div>
                    <input
                        type="submit"
                        value="Start quiz"
                        class="bg-blue-500 hover:bg-blue-700 text-white text-2xl font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    />
                </form>
            </div>
        );
    }
}

export default VerbQuizDetails;