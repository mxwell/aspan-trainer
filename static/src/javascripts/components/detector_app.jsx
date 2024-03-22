import React from "react";
import { i18n } from "../lib/i18n";
import { buildVerbDetectorUrl, parseParams } from "../lib/url"
import { makeDetectRequest } from "../lib/requests";
import { normalizeVerb } from "../lib/verb_forms";
import { pickRandom } from "../lib/random";
import { SENTENCE_TYPES } from "../lib/sentence";
import { GRAMMAR_NUMBERS, GRAMMAR_PERSONS } from "../lib/aspan";

const PRESET_VERB_FORMS = [
    "аламын",
    "кетейік",
    "жазбадың",
    "жасамайды",
    "ойнапсыз",
    "жаярмыз",
    "қабитын",
    "қабатын",
    "сүйсе",
    "қобалжымайтынсыңдар",
];

function pickExamples(chosenForm, exampleCount) {
    if (PRESET_VERB_FORMS.length < exampleCount + 1) {
        return [];
    }
    let forms = [];
    while (forms.length < exampleCount) {
        while (true) {
            let form = pickRandom(PRESET_VERB_FORMS);
            if (form == chosenForm) continue;
            if (forms.indexOf(form) >= 0) continue;
            forms.push(form);
            break;
        }
    }
    return forms;
}

class DetectedVerb {
    constructor(verb, isExceptional, sentenceType, tense, grammarPerson, grammarNumber) {
        this.verb = verb;
        this.isExceptional = isExceptional;
        this.sentenceType = sentenceType;
        this.tense = tense;
        this.grammarPerson = grammarPerson;
        this.grammarNumber = grammarNumber;
    }
}

function getSentenceTypeByIndex(sentenceType) {
    if (sentenceType == "0") {
        return SENTENCE_TYPES[0];
    } else if (sentenceType == "1") {
        return SENTENCE_TYPES[1];
    } else if (sentenceType == "2") {
        return SENTENCE_TYPES[2];
    }
    return null;
}

function getGrammarPerson(p) {
    if (p.length == 0) {
        return null;
    }
    const index = Number(p);
    if (index < 0 || index >= GRAMMAR_PERSONS.length) {
        return null;
    }
    return GRAMMAR_PERSONS[index];
}

function getGrammarNumber(n) {
    if (n.length == 0) {
        return null;
    }
    const index = Number(n);
    if (index < 0 || index >= GRAMMAR_NUMBERS.length) {
        return null;
    }
    return GRAMMAR_NUMBERS[index];
}

function unpackResponseWord(word) {
    const verb = word.initial;
    if (verb == null || verb.length == 0) {
        console.log("No verb in response word.");
        return null;
    }
    const isExceptional = word.exceptional == true;
    const parts = word.transition.split(":");
    if (parts.length == 4) {
        const sentenceType = getSentenceTypeByIndex(parts[0]);
        if (sentenceType == null) {
            console.log(`Error: unknown sentence type index: ${parts[0]}`);
            return null;
        }
        const tense = parts[1];
        if (tense.length == 0) {
            console.log("Error: empty tense in response word");
            return null;
        }
        const grammarPerson = getGrammarPerson(parts[2]);
        const grammarNumber = getGrammarNumber(parts[3]);
        return new DetectedVerb(verb, isExceptional, sentenceType, tense, grammarPerson, grammarNumber);
    }
    return new DetectedVerb(verb, isExceptional, null, null, null, null);
}

function unpackDetectResponse(responseWords) {
    for (let i = 0; i < responseWords.length; ++i) {
        let word = responseWords[i];
        let unpacked = unpackResponseWord(word);
        if (unpacked != null) {
            return unpacked;
        }
    }
    return null;
}

class DetectorApp extends React.Component {
    constructor(props) {
        super(props);

        this.handleDetectResponse = this.handleDetectResponse.bind(this);
        this.handleDetectError = this.handleDetectError.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.onChange = this.onChange.bind(this);

        this.state = this.readUrlState() || this.defaultState();
    }

    makeState(form) {
        return {
            form: form,
            lastEntered: form,
            examples: pickExamples(form, 2),
            verb: null,
            error: false,
        };
    }

    defaultState() {
        return this.makeState(
            /* form */ "",
        );
    }

    startDetection(prevLastEntered, rawForm) {
        const form = normalizeVerb(rawForm);

        if (form.length == 0) {
            const verb = null;
            this.setState({ verb });
            return;
        }

        makeDetectRequest(
            form,
            this.handleDetectResponse,
            this.handleDetectError,
            {
                prevEntered: prevLastEntered,
                lastEntered: rawForm,
            }
        );
    }

    readUrlState() {
        const params = parseParams();
        const form = params.form;
        if (form == null || form.length == 0) {
            console.log("No form in URL");
            return null;
        }
        this.startDetection("", form);
        return this.makeState(form);
    }

    i18n(key) {
        return i18n(key, this.props.lang);
    }

    async handleDetectResponse(context, responseJsonPromise) {
        let response = await responseJsonPromise;
        let lastEntered = this.state.lastEntered;
        // TODO Use "form" from the response, instead of the context
        if (lastEntered == context.prevEntered || lastEntered == context.lastEntered) {
            if (response.words) {
                const verb = unpackDetectResponse(response.words);
                this.setState({ verb });
            } else {
                console.log("No words in response.");
            }
        } else {
            console.log(`Detections are too old, lastEntered is ${lastEntered}.`);
        }
    }

    async handleDetectError(context, responseTextPromise) {
        let responseText = await responseTextPromise;
        console.log(`Got error from detect: ${responseText}, lastEntered was ${context.lastEntered}.`);
        const verb = null;
        const error = true;
        this.setState({ verb, error });
    }

    onChange(event) {
        let lastEntered = event.target.value;
        this.startDetection(this.state.lastEntered, lastEntered);
        this.setState({ lastEntered });
    }

    reloadToState(form) {
        const url = buildVerbDetectorUrl(form, this.props.lang);
        window.location.href = url;
    }

    onSubmit(event) {
        event.preventDefault();
        const form = this.state.lastEntered;
        this.reloadToState(form);
    }

    renderExampleForms() {
        const forms = this.state.examples;
        let items = [];
        items.push(
            <span
                className="text-3xl lg:text-sm text-gray-600"
                key={items.length} >
                {this.i18n("examples")}:&nbsp;
            </span>
        );
        for (var i = 0; i < forms.length; ++i) {
            let form = forms[i];
            const link = buildVerbDetectorUrl(form, this.props.lang);
            if (i > 0) {
                items.push(
                    <span
                        className="text-3xl lg:text-sm text-gray-600"
                        key={items.length} >
                        &nbsp;{this.i18n("or")}&nbsp;
                    </span>
                )
            }
            items.push(
                <a
                    className="px-2 lg:px-1 text-3xl lg:text-sm text-blue-600 hover:text-blue-800 visited:text-purple-600"
                    key={items.length}
                    href={link} >
                    {form}
                </a>
            );
        }
        return (
            <div className="mx-2 py-4 lg:py-0">
                {items}
            </div>
        );
    }

    renderForm() {
        return (
            <form onSubmit={this.onSubmit} className="px-3 py-2 flex flex-col">
                <input
                    type="text"
                    size="20"
                    maxLength="100"
                    value={this.state.lastEntered}
                    onChange={this.onChange}
                    placeholder={this.i18n("hint_enter_verb_form")}
                    className="shadow appearance-none border rounded w-full m-2 p-2 text-4xl lg:text-2xl text-gray-700 focus:outline-none focus:shadow-outline"
                    autoFocus />
                {this.renderExampleForms()}
                <input
                    type="submit"
                    value={this.i18n("buttonSubmit")}
                    className="bg-blue-500 hover:bg-blue-700 text-white text-4xl lg:text-2xl uppercase m-2 w-full font-bold rounded focus:outline-none focus:shadow-outline"
                />
            </form>
        );
    }

    renderFindings() {
        let result = null;
        let extraClass = null;
        if (this.state.verb != null) {
            result = this.state.verb.verb;
            extraClass = "text-green-700";
        } else if (this.state.error) {
            result = this.i18n("service_error");
            extraClass = "text-red-600";
        } else {
            result = this.i18n("no_verb_detected");
            extraClass = "text-gray-600";
        }
        return (
            <p className={`text-4xl lg:text-2xl lg:max-w-xs m-4 py-4 ${extraClass}`}>{result}</p>
        );
    }

    renderDetails() {
        const verb = this.state.verb;
        if (verb == null) {
            return null;
        }
        const exceptionalClause = (
            verb.isExceptional
            ? (<p className="text-orange-600">{this.i18n("ExceptionVerb")}</p>)
            : null
        );
        const tense = (
            <strong>{this.i18n(verb.tense)}</strong>
        );
        const sentenceType = (
            verb.tense != "infinitiv"
            ? <p>{this.i18n(verb.sentenceType)}</p>
            : null
        );
        const grammarPerson = (
            verb.grammarPerson
            ? (<p>{this.i18n(`gp_${verb.grammarPerson}`)}</p>)
            : null
        );
        const grammarNumber = (
            verb.grammarNumber
            ? (<p>{this.i18n(`gn_${verb.grammarNumber}`)}</p>)
            : null
        );
        return (
            <div className="flex flex-col italic border-2 border-gray-300 p-5">
                {exceptionalClause}
                {tense}
                {sentenceType}
                {grammarPerson}
                {grammarNumber}
            </div>
        );
    }

    render() {
        return (
            <div>
                <h1 className="text-center text-4xl italic text-gray-600">
                    {this.i18n("title_verb_detector")}
                </h1>
                {this.renderForm()}
                <div className="flex justify-center">
                    {this.renderFindings()}
                </div>
                {this.renderDetails()}
            </div>
        );
    }
}

export default DetectorApp;