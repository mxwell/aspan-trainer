import React from "react";
import { i18n } from "../lib/i18n";
import {
    buildMapByPronoun,
    getNomPronounByPersonNumber,
    PersonNumber,
} from "../lib/grammar_utils";
import { renderOptionsWithI18nKeys, renderOptionsWithKeys } from "../lib/react_util";
import { parseSentenceType, SENTENCE_TYPES } from "../lib/sentence";
import { buildViewerUrl2, parseParams } from "../lib/url"
import {
    SPEED_NORMAL,
    PhrasalAnimationState,
    buildVerbPhrasalExplanation,
    renderPhrasalExplanation,
    makeAnimationState,
    buildVerbPhrasalSummary,
} from "../lib/verb_analysis";
import { createFormByParams, normalizeVerb } from "../lib/verb_forms";
import { GRAMMAR_NUMBERS, GRAMMAR_PERSONS } from "../lib/aspan";
import { closeButton } from "./close_button";

const TENSES = [
    "presentTransitive",
];
const MAP_BY_PRONOUN = buildMapByPronoun();
const PRONOUNS = Array.from(MAP_BY_PRONOUN.keys());
const DEFAULT_PERSON_NUMBER = MAP_BY_PRONOUN.get(PRONOUNS[0]);

function parseTense(s) {
    if (TENSES.includes(s)) {
        return s;
    }
    return TENSES[0];
}

function parsePerson(s) {
    for (const person of GRAMMAR_PERSONS) {
        if (person == s) {
            return person;
        }
    }
    return GRAMMAR_PERSONS[0];
}

function parseNumber(s) {
    for (const number of GRAMMAR_NUMBERS) {
        if (number == s) {
            return number;
        }
    }
    return GRAMMAR_NUMBERS[0];
}

class ExplanationApp extends React.Component {
    constructor(props) {
        super(props);

        this.onSubmit = this.onSubmit.bind(this);
        this.onChange = this.onChange.bind(this);
        this.onTenseSelect = this.onTenseSelect.bind(this);
        this.onPronounSelect = this.onPronounSelect.bind(this);
        this.onSentenceTypeSelect = this.onSentenceTypeSelect.bind(this);
        this.onAnimationChange = this.onAnimationChange.bind(this);
        this.onClose = this.onClose.bind(this);

        this.state = this.readUrlState() || this.defaultState();
    }

    makeState(verb, forceExceptional, sentenceType, tense, personNumber, animation, phrasal, explanation, summary, animationState, paused, showForm) {
        if (typeof animation != "boolean") {
            throw new Error("animation param must be boolean");
        }
        return {
            verb: verb,
            lastEntered: verb,
            forceExceptional: forceExceptional,
            sentenceType: sentenceType,
            tense: tense,
            personNumber: personNumber,
            animation: animation,
            phrasal: phrasal,
            explanation: explanation,
            summary: summary,
            animationState: animationState,
            paused: paused,
            showForm: showForm,
        };
    }

    defaultState() {
        return this.makeState(
            /* verb */ null,
            /* forceExceptional */ false,
            /* sentenceType */ SENTENCE_TYPES[0],
            /* tense */ TENSES[0],
            /* personNumber */ DEFAULT_PERSON_NUMBER,
            /* animation */ false,
            /* phrasal */ null,
            /* explanation */ null,
            /* summary */ null,
            /* animationState */ null,
            /* paused */ true,
            /* showForm */ false,
        );
    }

    startAnimation() {
        let start = null;
        const maxIdleSeconds = 10;
        let advancePeriod = SPEED_NORMAL;
        const animate = timestamp => {
            if (!start) {
                start = timestamp;
            }
            if (this.state.paused) {
                console.log("Animation paused");
                return;
            }
            const progressSeconds = (timestamp - start) / 1000;
            if (progressSeconds > advancePeriod) {
                console.log(`timestamp: ${timestamp}, seconds since advance: ${progressSeconds}`);
            }

            const explanation = this.state.explanation;
            const prevState = this.state.animationState;
            if (prevState == null || !prevState.valid(explanation)) {
                console.log("Complete or invalid animation state");
                if (progressSeconds < maxIdleSeconds) {
                    window.requestAnimationFrame(animate);
                } else {
                    console.log("Animation stopped due to timeout");
                }
                return;
            }
            if (progressSeconds > advancePeriod) {
                const nextState = prevState.advance(explanation);
                if (nextState == null) {
                    console.log("Animation stopped due to completion");
                    return;
                } else {
                    this.setState({ animationState: nextState });
                }
                console.log("Advanced animation state");
                start = timestamp;
                advancePeriod = nextState.getSpeed(explanation);
            }
            window.requestAnimationFrame(animate);
        };
        window.requestAnimationFrame(animate);
    }

    readUrlState() {
        const params = parseParams();
        const verb = params.verb;
        if (verb == null || verb.length == 0) {
            console.log("No verb in URL");
            return null;
        }

        const forceExceptional = params.exception == "true";
        const sentenceType = parseSentenceType(params.sentence_type);
        const tense = parseTense(params.tense);

        const person = parsePerson(params.person);
        const number = parseNumber(params.number);
        const pronoun = getNomPronounByPersonNumber(person, number);
        const personNumber = new PersonNumber(person, number, pronoun);
        const lang = this.props.lang;

        const animation = params.animation == "true";
        const form = params.form == "true";

        const verbL = normalizeVerb(verb);

        const phrasal = createFormByParams(
            verbL,
            forceExceptional,
            sentenceType,
            tense,
            personNumber,
        );
        if (phrasal == null) {
            console.log("Invalid phrasal form");
            return null;
        }
        const explanation = buildVerbPhrasalExplanation(verbL, phrasal, lang);
        const summary = buildVerbPhrasalSummary(sentenceType, tense, personNumber.person, personNumber.number, phrasal, lang);
        const animationState = makeAnimationState(explanation, animation);
        if (animation) {
            this.startAnimation();
        }
        return this.makeState(
            verb,
            forceExceptional,
            sentenceType,
            tense,
            personNumber,
            animation,
            phrasal,
            explanation,
            summary,
            animationState,
            animationState == null,
            form,
        );
    }

    i18n(key) {
        return i18n(key, this.props.lang);
    }

    onSubmit(event) {
        event.preventDefault();

        const verb = this.state.lastEntered || null;
        const verbL = normalizeVerb(verb);
        const sentenceType = this.state.sentenceType;
        const tense = this.state.tense;
        const personNumber = this.state.personNumber;
        const lang = this.props.lang;

        const phrasal = createFormByParams(
            verbL,
            this.state.forceExceptional,
            sentenceType,
            tense,
            personNumber,
        );
        const explanation = (
            phrasal != null
            ? buildVerbPhrasalExplanation(verbL, phrasal, lang)
            : null
        );
        const summary = (
            phrasal != null
            ? buildVerbPhrasalSummary(sentenceType, tense, personNumber.person, personNumber.number, phrasal, lang)
            : null
        );
        const animationState = makeAnimationState(explanation, this.state.animation);
        const paused = animationState == null || !this.state.animation;
        this.setState({
            verb,
            phrasal,
            explanation,
            summary,
            animationState,
            paused,
        });
        if (!paused) {
            this.startAnimation();
        }
    }

    onChange(event) {
        let lastEntered = event.target.value;
        const paused = true;
        this.setState({ lastEntered, paused });
    }

    onTenseSelect(event) {
        const tense = event.target.value;
        const paused = true;
        this.setState({ tense, paused });
    }

    onPronounSelect(event) {
        const pronoun = event.target.value;
        const personNumber = MAP_BY_PRONOUN.get(pronoun);
        const paused = true;
        this.setState({ personNumber, paused });
    }

    onSentenceTypeSelect(event) {
        const sentenceType = event.target.value;
        const paused = true;
        this.setState({ sentenceType, paused });
    }

    onAnimationChange(event) {
        const animation = event.target.checked;
        this.setState({ animation });
    }

    onClose(event) {
        const viewerUrl = buildViewerUrl2(this.state.verb, this.state.sentenceType, this.state.forceExceptional, this.props.lang);
        window.location.href = viewerUrl;
    }

    renderDetails() {
        const tense = this.state.tense;
        const verb = this.state.verb;
        if (tense == null || verb == null || verb.length == 0) {
            return null;
        }
        const localizedTense = this.i18n(tense);
        const localizedOfVerb = this.i18n("of_verb");
        const tenseOfVerb = `${localizedTense} ${localizedOfVerb} «${verb}»`;

        return (
            <div className="px-6">
                <p>{tenseOfVerb}</p>
                <p>{this.state.summary}</p>
            </div>
        );
    }

    renderForm() {
        if (!this.state.showForm) {
            return this.renderDetails();
        }
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
                            placeholder={this.i18n("hintEnterVerb")}
                            className="shadow appearance-none border rounded w-full p-2 text-4xl lg:text-2xl text-gray-700 focus:outline-none focus:shadow-outline"
                            autoFocus />
                    </div>
                    <select
                        required
                        value={this.state.personNumber.pronoun}
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
                <div>
                    <input
                        className="ml-4"
                        type="checkbox"
                        checked={this.state.animation}
                        onChange={this.onAnimationChange}
                        id="animation" name="animation" />
                    <label
                        htmlFor="animation"
                        className="text-gray-800 text-2xl lg:text-xl ml-2">
                        Animation
                    </label>
                </div>
            </form>
        );
    }

    renderExplanation() {
        const explanation = this.state.explanation;
        const animationState = this.state.animationState;
        if (explanation == null || animationState == null) {
            return (
                <p className="px-6">
                    {this.i18n("nothing_explain")}
                </p>
            );
        }
        const phrasalFirst = !this.state.showForm;
        return renderPhrasalExplanation(explanation, animationState, phrasalFirst);
    }

    render() {
        return (
            <div>
                <div className="flex justify-between">
                    <h1 className="px-6 text-3xl lg:text-4xl italic text-gray-600">
                        {this.i18n("verb_form_explanation")}
                    </h1>
                    {closeButton({ onClick: this.onClose })}
                </div>
                {this.renderForm()}
                {this.renderExplanation()}
            </div>
        );
    }
}

export default ExplanationApp;