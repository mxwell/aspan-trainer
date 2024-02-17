import React from "react";
import { i18n } from "../lib/i18n";
import { buildMapByPronoun } from "../lib/grammar_utils";
import { renderOptionsWithI18nKeys, renderOptionsWithKeys } from "../lib/react_util";
import { parseSentenceType, SENTENCE_TYPES } from "../lib/sentence";
import { parseParams } from "../lib/url"
import {
    renderVerbPhrasalExplanation,
} from "../lib/verb_analysis";
import { createFormByParams } from "../lib/verb_forms";

const TENSES = [
    "presentTransitive",
];
const MAP_BY_PRONOUN = buildMapByPronoun();
const PRONOUNS = Array.from(MAP_BY_PRONOUN.keys());

class ExplanationApp extends React.Component {
    constructor(props) {
        super(props);

        this.onSubmit = this.onSubmit.bind(this);
        this.onChange = this.onChange.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onTenseSelect = this.onTenseSelect.bind(this);
        this.onPronounSelect = this.onPronounSelect.bind(this);
        this.onSentenceTypeSelect = this.onSentenceTypeSelect.bind(this);

        this.state = this.readUrlState() || this.defaultState();
    }

    makeState(verb, forceExceptional, sentenceType, tense, pronoun, phrasal) {
        return {
            verb: verb,
            lastEntered: verb,
            forceExceptional: forceExceptional,
            sentenceType: sentenceType,
            tense: tense,
            pronoun: pronoun,
            phrasal: phrasal,
        };
    }

    defaultState() {
        return this.makeState(
            /* verb */ "",
            /* forceExceptional */ false,
            /* sentenceType */ SENTENCE_TYPES[0],
            /* tense */ TENSES[0],
            /* pronoun */ PRONOUNS[0],
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
        const tense = params.tense || TENSES[0];
        const pronoun = params.pronoun || PRONOUNS[0];
        const personNumber = MAP_BY_PRONOUN.get(pronoun);

        const phrasal = createFormByParams(
            verb,
            forceExceptional,
            sentenceType,
            tense,
            personNumber,
        );
        if (phrasal == null) {
            console.log(`Failed to generate phrasal for verb: ${verb}`);
        }
        return this.makeState(
            verb,
            forceExceptional,
            sentenceType,
            tense,
            pronoun,
            phrasal,
        );
    }

    i18n(key) {
        return i18n(key, this.props.lang);
    }

    onSubmit(event) {
        event.preventDefault();

        const verb = this.state.lastEntered;
        const personNumber = MAP_BY_PRONOUN.get(this.state.pronoun);

        const phrasal = createFormByParams(
            verb,
            this.state.forceExceptional,
            this.state.sentenceType,
            this.state.tense,
            personNumber,
        );
        if (phrasal == null) {
            console.log(`Failed to generate phrasal for verb: ${verb}`);
        }
        this.setState({ verb, phrasal });
    }

    onChange(event) {
        let lastEntered = event.target.value;
        this.setState({ lastEntered });
    }

    onKeyDown(event) {
        // TODO
    }

    onTenseSelect(event) {
        const tense = event.target.value;
        this.setState({ tense });
    }

    onPronounSelect(event) {
        const pronoun = event.target.value;
        this.setState({ pronoun });
    }

    onSentenceTypeSelect(event) {
        const sentenceType = event.target.value;
        this.setState({ sentenceType });
    }

    renderForm() {
        return (
            <form onSubmit={this.onSubmit} className="px-3 py-2 flex flex-col">
                <div>
                    <select
                        required
                        value={this.state.tense}
                        onChange={this.onTenseSelect}
                        className="text-gray-800 text-4xl lg:text-2xl lg:mx-2 mb-6 p-2 lg:px-4">
                        {renderOptionsWithI18nKeys(TENSES, this.props.lang)}
                    </select>
                </div>
                <div className="lg:px-2 flex flex-col lg:flex-row">
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
                    <select
                        required
                        value={this.state.pronoun}
                        onChange={this.onPronounSelect}
                        className="text-gray-800 text-4xl lg:text-2xl lg:mx-2 mb-6 p-2 lg:px-4">
                        {renderOptionsWithKeys(PRONOUNS)}
                    </select>
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
                </div>
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