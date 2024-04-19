import React from "react";
import { i18n } from "../lib/i18n";
import { buildGlosbeUrl, buildLugatUrl, buildVerbDetectorUrl, buildViewerUrl2, parseParams } from "../lib/url"
import { makeDetectRequest } from "../lib/requests";
import { normalizeVerb } from "../lib/verb_forms";
import { pickRandom } from "../lib/random";
import { SENTENCE_TYPES } from "../lib/sentence";
import { hasMixedAlphabets } from "../lib/input_validation";
import { unpackDetectResponse } from "../lib/detector";

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

class DetectorApp extends React.Component {
    constructor(props) {
        super(props);

        this.handleDetectResponse = this.handleDetectResponse.bind(this);
        this.handleDetectError = this.handleDetectError.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.onChange = this.onChange.bind(this);

        this.state = this.readUrlState() || this.defaultState();
    }

    makeState(form, warning) {
        return {
            form: form,
            lastEntered: form,
            examples: pickExamples(form, 2),
            verb: null,
            warning: warning,
            error: false,
        };
    }

    defaultState() {
        return this.makeState(
            /* form */ "",
            /* warning */ null,
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
        const warning = hasMixedAlphabets(form) ? this.i18n("mixedAlphabetsInForm") : null;
        this.startDetection("", form);
        return this.makeState(form, warning);
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
        const warning = hasMixedAlphabets(lastEntered) ? this.i18n("mixedAlphabetsInForm") : null;
        this.startDetection(this.state.lastEntered, lastEntered);
        this.setState({ lastEntered, warning });
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

    renderWarning() {
        const warning = this.state.warning;
        if (warning == null) {
            return null;
        }
        return (
            <p className="text-red-600 text-center text-2xl lg:text-base lg:max-w-xs m-4 py-4">{warning}</p>
        );
    }

    renderAllFormsLink() {
        if (this.state.verb == null) {
            return null;
        }
        const detectedVerb = this.state.verb;
        const sentenceType = detectedVerb.sentenceType || SENTENCE_TYPES[0];
        const forceExceptional = detectedVerb.isExceptional == true;
        const url = buildViewerUrl2(detectedVerb.verb, sentenceType, forceExceptional, this.props.lang, null, false);
        return (
            <a
                className="text-right px-2 my-4 lg:px-1 text-3xl lg:text-sm text-blue-600 hover:text-blue-800 visited:text-purple-600"
                href={url}>
                {this.i18n("linkAllForms")}&nbsp;→
            </a>
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
            <div className="flex flex-col">
                {this.renderWarning()}
                <p className={`text-center text-4xl lg:text-3xl lg:max-w-xs m-4 py-4 ${extraClass}`}>{result}</p>
                {this.renderAllFormsLink()}
            </div>
        );
    }

    renderDetails() {
        const verb = this.state.verb;
        if (verb == null) {
            return null;
        }
        const exceptionalClause = (
            verb.isExceptional
            ? (<p className="italic text-orange-600">{this.i18n("ExceptionVerb")}</p>)
            : null
        );
        const tense = (
            <strong className="italic">{this.i18n(verb.tense)}</strong>
        );
        const sentenceType = (
            verb.sentenceType
            ? <p className="italic">{this.i18n(verb.sentenceType)}</p>
            : null
        );
        const grammarPerson = (
            verb.grammarPerson
            ? (<p className="italic">{this.i18n(`gp_${verb.grammarPerson}`)}</p>)
            : null
        );
        const grammarNumber = (
            verb.grammarNumber
            ? (<p className="italic">{this.i18n(`gn_${verb.grammarNumber}`)}</p>)
            : null
        );
        return (
            <div className="flex flex-col border-2 border-gray-300 p-5">
                <h2 className="text-xl my-2 text-gray-600">{this.i18n("enteredFormDetails")}</h2>
                {exceptionalClause}
                {tense}
                {sentenceType}
                {grammarPerson}
                {grammarNumber}
            </div>
        );
    }

    renderDictionaries() {
        const detectedVerb = this.state.verb;
        if (detectedVerb == null) {
            return null;
        }
        const verb = detectedVerb.verb;
        const lang = this.props.lang;
        return (
            <div className="flex flex-col border-2 border-gray-300 p-5 my-4">
                <h2 className="text-xl my-2 text-gray-600">{this.i18n("lookupDictionaries")}</h2>
                <a
                    className="px-2 text-3xl lg:text-base text-blue-600 hover:text-blue-800 visited:text-purple-600"
                    href={buildGlosbeUrl(verb, lang)}
                    target="blank_">
                    Glosbe &nbsp; ↗
                </a>
                <a
                    className="px-2 text-3xl lg:text-base text-blue-600 hover:text-blue-800 visited:text-purple-600"
                    href={buildLugatUrl(verb, lang)}
                    target="blank_">
                    Lugat &nbsp; ↗
                </a>
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
                {this.renderFindings()}
                {this.renderDetails()}
                {this.renderDictionaries()}
            </div>
        );
    }
}

export default DetectorApp;