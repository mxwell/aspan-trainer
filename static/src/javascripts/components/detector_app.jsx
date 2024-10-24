import React from "react";
import { i18n } from "../lib/i18n";
import { buildGlosbeUrl, buildLugatUrl, buildSozdikUrl, buildTextAnalyzerUrl, buildVerbDetectorUrl, buildViewerUrl2, parseParams } from "../lib/url"
import { makeDetectRequest } from "../lib/requests";
import { pickRandom } from "../lib/random";
import { SENTENCE_TYPES } from "../lib/sentence";
import { hasMixedAlphabets, trimAndLowercase } from "../lib/input_validation";
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

const DEFAULT_SUGGESTIONS = [];
const DEFAULT_SUGGESTION_POS = -1;

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

function catCompletion(suggestion) {
    const completion = suggestion.completion;
    let parts = [];
    if (completion) {
        for (let i = 0; i < completion.length; ++i) {
            parts.push(completion[i].text);
        }
    }
    return parts.join("");
}

/**
 * props:
 * - lang: string
 * - onlyVerbs: boolean
 */
class DetectorApp extends React.Component {
    constructor(props) {
        super(props);

        this.handleDetectResponse = this.handleDetectResponse.bind(this);
        this.handleDetectError = this.handleDetectError.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.onChange = this.onChange.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onCopySuccess = this.onCopySuccess.bind(this);
        this.onCopyClick = this.onCopyClick.bind(this);
        this.onBgClick = this.onBgClick.bind(this);

        this.state = this.readUrlState() || this.defaultState();
    }

    makeState(form, warning) {
        return {
            form: form,
            lastEntered: form,
            modified: false,
            suggestions: DEFAULT_SUGGESTIONS,
            currentFocus: DEFAULT_SUGGESTION_POS,
            examples: pickExamples(form, 2),
            verb: null,
            copied: false,
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

    startDetection(prevLastEntered, rawForm, suggest) {
        const form = trimAndLowercase(rawForm);

        if (form.length == 0) {
            const verb = null;
            this.setState({ verb });
            return;
        }

        makeDetectRequest(
            form,
            suggest,
            this.props.onlyVerbs,
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
        this.startDetection("", form, false);
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
                const copied = false;
                this.setState({ verb, copied });
            }
            if (response.suggestions && response.suggestions.length > 0) {
                const suggestions = [];
                for (let i = 0; i < response.suggestions.length; ++i) {
                    suggestions.push({
                        completion: response.suggestions[i].completion,
                        raw: catCompletion(response.suggestions[i]),
                    });
                }
                if (!(suggestions.length == 1 && suggestions[0].raw == lastEntered)) {
                    const currentFocus = DEFAULT_SUGGESTION_POS;
                    this.setState({ suggestions, currentFocus });
                }
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

    changeInputText(lastEntered, suggest) {
        const modified = true;
        const warning = hasMixedAlphabets(lastEntered) ? this.i18n("mixedAlphabetsInForm") : null;
        const suggestions = DEFAULT_SUGGESTIONS;
        this.startDetection(this.state.lastEntered, lastEntered, suggest);
        this.setState({ lastEntered, modified, suggestions, warning });
    }

    onChange(event) {
        let lastEntered = event.target.value;
        this.changeInputText(lastEntered, true);
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

    moveActiveSuggestion(posChange) {
        if (posChange == 0) return;
        let suggestions = this.state.suggestions;
        let prevFocus = this.state.currentFocus;
        let currentFocus = prevFocus + posChange;
        if (currentFocus >= suggestions.length || suggestions.length == 0) {
            currentFocus = 0;
        } else if (currentFocus < 0) {
            currentFocus = suggestions.length - 1;
        }
        this.setState({ currentFocus });
    }

    clearSuggestions() {
        this.setState({
            suggestions: DEFAULT_SUGGESTIONS,
        });
    }

    activateSuggestion(lastEntered) {
        this.changeInputText(lastEntered, false);
    }

    onKeyDown(e) {
        if (e.keyCode == 40) {  // arrow down
            this.moveActiveSuggestion(1);
        } else if (e.keyCode == 38) { // arrow up
            this.moveActiveSuggestion(-1);
        } else if (e.keyCode == 27) { // esc
            this.clearSuggestions();
        } else if (e.keyCode == 13) { // enter
            let suggestions = this.state.suggestions;
            let currentFocus = this.state.currentFocus;
            if (0 <= currentFocus && currentFocus < suggestions.length) {
                e.preventDefault();
                let lastEntered = suggestions[currentFocus].raw;
                this.activateSuggestion(lastEntered);
            }
        }
    }

    onSuggestionClick(verb, e) {
        e.stopPropagation();
        let lastEntered = verb;
        this.activateSuggestion(lastEntered);
    }

    onBgClick(e) {
        this.clearSuggestions();
    }

    renderSuggestions() {
        let suggestions = this.state.suggestions;
        if (suggestions.length == 0) {
            return null;
        }

        let currentFocus = this.state.currentFocus;

        let items = [];
        for (let i = 0; i < suggestions.length; ++i) {
            let completion = suggestions[i].completion;
            let parts = [];
            for (let j = 0; j < completion.length; ++j) {
                let item = completion[j];
                if (item.hl) {
                    parts.push(<strong key={j}>{item.text}</strong>);
                } else {
                    parts.push(<span key={j}>{item.text}</span>);
                }
            }
            let verb = suggestions[i].raw;
            let divClasses = "p-2 border-b-2 border-gray-300 text-2xl lg:text-xl";
            if (i == currentFocus) {
                divClasses += " bg-blue-500 text-white";
            } else {
                divClasses += " bg-white text-gray-700";
            }
            items.push(
                <div
                    onClick={(e) => { this.onSuggestionClick(verb, e) }}
                    key={i}
                    className={divClasses} >
                    {parts}
                </div>
            );
        }
        return (
            <div className="absolute z-50 left-0 right-0 border-l-2 border-r-2 border-gray-300 mx-2">
                {items}
            </div>
        );
    }

    renderExampleForms() {
        if (this.state.lastEntered.length > 0) {
            return null;
        }

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
                <div className="flex">
                    <div className="relative">
                        <input
                            type="text"
                            size="20"
                            maxLength="100"
                            value={this.state.lastEntered}
                            onChange={this.onChange}
                            onKeyDown={this.onKeyDown}
                            placeholder={this.i18n("hint_enter_verb_form")}
                            className="shadow appearance-none border rounded mx-2 p-2 text-4xl lg:text-2xl text-gray-700 focus:outline-none focus:shadow-outline"
                            autoFocus />
                        {this.renderSuggestions()}
                    </div>
                    <button
                        type="submit"
                        className="bg-blue-500 hover:bg-blue-700 text-white text-4xl font-bold px-4 rounded focus:outline-none focus:shadow-outline">
                        →
                    </button>
                </div>
                {this.renderExampleForms()}
            </form>
        );
    }

    renderWarning() {
        const warning = this.state.warning;
        if (warning == null) {
            return null;
        }
        return (
            <p className="text-red-600 text-center text-2xl lg:text-base max-w-sm m-4 py-4">{warning}</p>
        );
    }

    onCopySuccess() {
        console.log("Copied to clipboard");
        const copied = true;
        this.setState({ copied });
    }

    onCopyClick(e) {
        navigator.clipboard.writeText(this.state.verb.verb).then(
            this.onCopySuccess,
            function(err) {
                console.error(`Could not copy to clipboard: ${err}`);
            }
        );
    }

    renderAllFormsLink() {
        if (this.state.verb == null || this.state.verb.isNoun) {
            return null;
        }
        const detectedVerb = this.state.verb;
        const sentenceType = detectedVerb.sentenceType || SENTENCE_TYPES[0];
        const forceExceptional = detectedVerb.isExceptional == true;
        const url = buildViewerUrl2(detectedVerb.verb, sentenceType, forceExceptional, null, this.props.lang, null, false);
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
        let copyIcon = null;
        let extraClass = null;
        if (this.state.verb != null) {
            result = this.state.verb.verb;
            copyIcon = (
                <img
                    className="mx-2 h-12 w-12"
                    onClick={this.onCopyClick}
                    src={this.state.copied ? "/copy_pressed.svg" : "/copy.svg"} />
            );
            extraClass = "text-green-700";
        } else if (this.state.error) {
            result = this.i18n("service_error");
            extraClass = "text-red-600";
        } else {
            result = "(·_·)";
            extraClass = "text-gray-600";
        }
        return (
            <div className="flex flex-col">
                {this.renderWarning()}
                <div
                    className={`text-center text-4xl lg:text-3xl max-w-sm m-4 py-4 flex justify-center ${extraClass}`}>
                    <span>{result}</span>
                    {copyIcon}
                </div>
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
            verb.isExceptional == 1
            ? (<p className="italic text-orange-600">{this.i18n("ExceptionVerb")}</p>)
            : null
        );
        const tense = (
            !verb.isNoun
            ? <strong className="italic">{this.i18n(verb.tense)}</strong>
            : null
        );
        const sentenceType = (
            verb.sentenceType
            ? <p className="italic">{this.i18n(verb.sentenceType)}</p>
            : null
        );
        const grammarPerson = (
            verb.grammarPerson
            ? (
                verb.isNoun
                ? (<p className="italic">{this.i18n(`poss_${verb.grammarPerson}`)}</p>)
                : (<p className="italic">{this.i18n(`gp_${verb.grammarPerson}`)}</p>)
            )
            : null
        );
        const grammarNumber = (
            verb.grammarNumber
            ? (<p className="italic">{this.i18n(`gn_${verb.grammarNumber}`)}</p>)
            : null
        );
        const septik = (
            verb.septik != null
            ? (<p className="italic">{this.i18n(`septik_${verb.septik}`)}</p>)
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
                {septik}
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
        const dicts = [
            ["Glosbe", buildGlosbeUrl(verb, lang)],
            ["Lugat", buildLugatUrl(verb, lang)],
        ];
        const sozdikUrl = buildSozdikUrl(verb, lang);
        if (sozdikUrl != null) {
            dicts.push(["Sozdik", sozdikUrl]);
        }
        let links = [];
        for (let i = 0; i < dicts.length; i++) {
            const [name, url] = dicts[i];
            links.push(<a
                key={i}
                className="px-2 text-3xl lg:text-base text-blue-600 hover:text-blue-800 visited:text-purple-600"
                href={url}
                target="blank_">
                {name} &nbsp; ↗
            </a>);
        }
        return (
            <div className="flex flex-col border-2 border-gray-300 p-5 my-4">
                <h2 className="text-xl my-2 text-gray-600">{this.i18n("lookupDictionaries")}</h2>
                {links}
            </div>
        );
    }

    render() {
        return (
            <div onClick={this.onBgClick} className="w-1/2">
                <div className="flex flex-row justify-center">
                    <div className="text-red-800 bg-red-100 p-4 rounded">
                            <p className="text-center">
                                {this.i18n("youMightBeInterestedInAnalyzer")}
                                &nbsp;
                                <a href={buildTextAnalyzerUrl(this.state.lastEntered, this.props.lang)} className="underline">
                                    {this.i18n("titleTextAnalyzer")}
                                </a>.
                            </p>
                            <p className="text-center">
                                {this.i18n("detectsBothVerbAndNoun")}
                            </p>
                    </div>
                </div>
                <div className="flex flex-row justify-center">
                    <div>
                        <h1 className="text-center text-4xl italic text-gray-600 mt-10">
                            {this.i18n("title_verb_detector")}
                        </h1>
                        {this.renderForm()}
                        {this.renderFindings()}
                        {this.renderDetails()}
                        {this.renderDictionaries()}
                    </div>
                </div>
            </div>
        );
    }
}

export default DetectorApp;