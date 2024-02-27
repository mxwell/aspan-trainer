import React from "react";
import { i18n } from "../lib/i18n";
import { buildMapByPronoun } from "../lib/grammar_utils";
import { renderOptionsWithI18nKeys, renderOptionsWithKeys } from "../lib/react_util";
import { parseSentenceType, SENTENCE_TYPES } from "../lib/sentence";
import { parseParams } from "../lib/url"
import {
    SPEED_NORMAL,
    PhrasalAnimationState,
    buildVerbPhrasalExplanation,
    renderPhrasalExplanation,
    makeAnimationState,
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
        this.onAnimationChange = this.onAnimationChange.bind(this);

        this.state = this.readUrlState() || this.defaultState();
    }

    makeState(verb, forceExceptional, sentenceType, tense, pronoun, animation, phrasal, explanation, animationState, paused) {
        if (typeof animation != "boolean") {
            throw new Error("animation param must be boolean");
        }
        return {
            verb: verb,
            lastEntered: verb,
            forceExceptional: forceExceptional,
            sentenceType: sentenceType,
            tense: tense,
            pronoun: pronoun,
            animation: animation,
            phrasal: phrasal,
            explanation: explanation,
            animationState: animationState,
            paused: paused,
        };
    }

    defaultState() {
        return this.makeState(
            /* verb */ "",
            /* forceExceptional */ false,
            /* sentenceType */ SENTENCE_TYPES[0],
            /* tense */ TENSES[0],
            /* pronoun */ PRONOUNS[0],
            /* animation */ false,
            /* phrasal */ null,
            /* explanation */ null,
            /* animationState */ null,
            /* paused */ true,
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
        const forceExceptional = params.exception == "true";
        const sentenceType = parseSentenceType(params.sentence_type);
        const tense = params.tense || TENSES[0];
        const pronoun = params.pronoun || PRONOUNS[0];
        const personNumber = MAP_BY_PRONOUN.get(pronoun);
        const animation = params.animation == "true";

        const phrasal = (
            verb != null
            ? createFormByParams(
                verb,
                forceExceptional,
                sentenceType,
                tense,
                personNumber,
            )
            : null
        );
        const explanation = (
            phrasal != null
            ? buildVerbPhrasalExplanation(verb, phrasal)
            : null
        );
        const animationState = makeAnimationState(explanation, animation);
        if (animation) {
            this.startAnimation();
        }
        return this.makeState(
            verb,
            forceExceptional,
            sentenceType,
            tense,
            pronoun,
            animation,
            phrasal,
            explanation,
            animationState,
            animationState == null,
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
        const explanation = (
            phrasal != null
            ? buildVerbPhrasalExplanation(verb, phrasal)
            : null
        );
        const animationState = makeAnimationState(explanation, this.state.animation);
        const paused = animationState == null || !this.state.animation;
        this.setState({
            verb,
            phrasal,
            explanation,
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

    onKeyDown(event) {
        // TODO
    }

    onTenseSelect(event) {
        const tense = event.target.value;
        const paused = true;
        this.setState({ tense, paused });
    }

    onPronounSelect(event) {
        const pronoun = event.target.value;
        const paused = true;
        this.setState({ pronoun, paused });
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
                <p>Nothing to explain</p>
            );
        }
        return renderPhrasalExplanation(explanation, animationState);
    }

    render() {
        return (
            <div>
                {this.renderForm()}
                {this.renderExplanation()}
            </div>
        );
    }
}

export default ExplanationApp;