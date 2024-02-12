import React from 'react';
import { parseSentenceType, SENTENCE_TYPES } from '../lib/sentence';
import { parseParams } from '../lib/url'
import {
    renderVerbPhrasalExplanation,
} from '../lib/verb_analysis';
import { createFormByParams } from '../lib/verb_forms';

class ExplanationApp extends React.Component {
    constructor(props) {
        super(props);

        this.state = this.readUrlState() || this.defaultState();
    }

    makeState(verb, forceExceptional, sentenceType, tense, grammarPerson, grammarNumber, phrasal) {
        return {
            verb: verb,
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
            /* grammarPNumber */ "",
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
                <h1>Explanation in {this.props.lang}</h1>
                {this.renderExplanation()}
            </div>
        );
    }
}

export default ExplanationApp;