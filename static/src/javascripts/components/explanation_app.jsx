import React from 'react';
import { highlightPhrasal } from '../lib/highlight';
import { parseSentenceType, SENTENCE_TYPES } from '../lib/sentence';
import { parseParams } from '../lib/url'
import {
    PARAGRAPH_PLAIN,
    PARAGRAPH_TITLE,
    PARAGRAPH_PROGRESSION,
    explainVerbPhrasal,
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
        const paragraphs = explainVerbPhrasal(verb, phrasal);
        console.log(`Received explanation in ${paragraphs.length} paragraphs`);
        let htmlParts = [];

        for (let i = 0; i < paragraphs.length; ++i) {
            const paragraph = paragraphs[i];
            if (paragraph.paragraphType == PARAGRAPH_PLAIN) {
                htmlParts.push(
                    <p
                        key={`p${htmlParts.length}`}>
                        {paragraph.item}
                    </p>
                );
            } else if (paragraph.paragraphType == PARAGRAPH_TITLE) {
                htmlParts.push(
                    <h3
                        className="text-3xl"
                        key={`p${htmlParts.length}`}>
                        {paragraph.item}
                    </h3>
                );
            } else if (paragraph.paragraphType == PARAGRAPH_PROGRESSION) {
                htmlParts.push(
                    <p
                        key={`p${htmlParts.length}`}>
                        {paragraph.items.join(" → ")}
                    </p>
                );
            } else {
                htmlParts.push(
                    <p
                        key={`p${htmlParts.length}`}>
                        Unsupported paragraph type
                    </p>
                );
            }
        }

        return (
            <div>
                <p>{highlightPhrasal(phrasal)}</p>
                {htmlParts}
            </div>
        );

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