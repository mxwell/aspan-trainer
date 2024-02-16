import React from 'react';
import { i18n } from '../lib/i18n';
import { renderOptionsWithI18nKeys } from "../lib/react_util";
import { parseSentenceType, SENTENCE_TYPES } from '../lib/sentence';
import { parseParams } from '../lib/url'
import {
    renderVerbPhrasalExplanation,
} from '../lib/verb_analysis';
import { createFormByParams } from '../lib/verb_forms';

class ExplanationApp extends React.Component {
    constructor(props) {
        super(props);

        this.onSubmit = this.onSubmit.bind(this);
        this.onChange = this.onChange.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onSentenceTypeSelect = this.onSentenceTypeSelect.bind(this);

        this.state = this.readUrlState() || this.defaultState();
    }

    makeState(verb, forceExceptional, sentenceType, tense, grammarPerson, grammarNumber, phrasal) {
        return {
            verb: verb,
            lastEntered: verb,
            forceExceptional: forceExceptional,
            sentenceType: sentenceType,
            tense: tense,
            grammarPerson: grammarPerson,
            grammarNumber: grammarNumber,
            phrasal: phrasal,
        };
    }

    defaultState() {
        return this.makeState(
            /* verb */ "",
            /* forceExceptional */ false,
            /* sentenceType */ SENTENCE_TYPES[0],
            /* tense */ "",
            /* grammarPerson */ "",
            /* grammarNumber */ "",
            /* phrasal */ null,
        );
    }

    readUrlState() {
        const params = parseParams();
        const verb = params.verb;
        if (verb == null || verb.length <= 0) {
            return null;
        }
        const forceExceptional = params.exception == "true";
        const sentenceType = parseSentenceType(params.sentence_type);
        const tense = params.tense;
        const grammarPerson = params.person;
        const grammarNumber = params.number;

        const phrasal = createFormByParams(
            verb,
            forceExceptional,
            sentenceType,
            tense,
            grammarPerson,
            grammarNumber,
        );
        return this.makeState(
            verb,
            forceExceptional,
            sentenceType,
            tense,
            grammarPerson,
            grammarNumber,
            phrasal,
        );
    }

    i18n(key) {
        return i18n(key, this.props.lang);
    }

    onSubmit(event) {
        event.preventDefault();

        const verb = this.state.lastEntered;

        const phrasal = createFormByParams(
            verb,
            this.state.forceExceptional,
            this.state.sentenceType,
            this.state.tense,
            this.state.grammarPerson,
            this.state.grammarNumber,
        );
        this.setState({ verb, phrasal });
    }

    onChange(event) {
        let lastEntered = event.target.value;
        this.setState({ lastEntered });
    }

    onKeyDown(event) {
        // TODO
    }

    onSentenceTypeSelect(event) {
        const sentenceType = event.target.value;
        this.setState({ sentenceType });
    }

    renderForm() {
        return (
            <form onSubmit={this.onSubmit} className="px-3 py-2 flex flex-col lg:flex-row">
                <div className="lg:px-2">
                    <div className="relative">
                        <input
                            type="text"
                            size="20"
                            maxLength="100"
                            value={this.state.lastEntered}
                            onChange={this.onChange}
                            onKeyDown={this.onKeyDown}
                            placeholder={this.i18n("hintEnterVerb")}
                            className="shadow appearance-none border rounded w-full p-2 text-4xl lg:text-2xl text-gray-700 focus:outline-none focus:shadow-outline"
                            autoFocus />
                    </div>
                </div>
                <select
                    required
                    value={this.state.sentenceType}
                    onChange={this.onSentenceTypeSelect}
                    className="text-gray-800 text-4xl lg:text-2xl lg:mx-2 mb-6 p-2 lg:px-4">
                    {renderOptionsWithI18nKeys(SENTENCE_TYPES, this.props.lang)}
                </select>
                <input
                    type="submit"
                    value={this.i18n("buttonSubmit")}
                    className="bg-blue-500 hover:bg-blue-700 text-white text-4xl lg:text-2xl uppercase mb-6 font-bold px-4 rounded focus:outline-none focus:shadow-outline"
                />
            </form>
        );
    }

    renderExplanation() {
        const verb = this.state.verb;
        const phrasal = this.state.phrasal;
        if (verb == null || phrasal == null) {
            return (
                <p>Nothing to explain</p>
            );
        }
        return renderVerbPhrasalExplanation(verb, phrasal);
    }

    render() {
        return (
            <div>
                {this.renderForm()}
                <h1>Explanation in {this.props.lang}</h1>
                {this.renderExplanation()}
            </div>
        );
    }
}

export default ExplanationApp;