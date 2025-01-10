import React from "react";
import { i18n } from "../lib/i18n";
import { makeAnalyzeRequest } from "../lib/requests";
import { AnalyzedPart, parseAnalyzeResponse } from "../lib/analyzer";
import { AnalyzedPartView } from "./analyzed_part_view";
import { pickRandom } from "../lib/random";
import { buildTextAnalyzerUrl, parseParams } from "../lib/url";

const DEMO_POOL = [
    "Парижден оралған спортшылардан коронавирус анықталған",
    "Аумағы жөнінен Каспий, Арал теңіздерінен кейінгі үшінші орында, әлемдегі ең үлкен көлдер тізімінде он төртінші орында",
    "Морфологиялық құрамы жағынан етістіктер дара етістіктер мен күрделі етістіктер деп аталатын екі салаға бөлінеді",
    "Сені мен жұма күні құтқардым, сондықтан сенің атың Жұма болады деп түсіндірдім",
    "Құдай тағала әрбір ақылы бар кісіге иман парыз, әрбір иманы бар кісіге ғибадат парыз деген екен",
];

function pickDemoSentence(cur) {
    for (let i = 0; i < 3; ++i) {
        const pick = pickRandom(DEMO_POOL);
        if (pick != cur) {
            return pick;
        }
    }
    return pickRandom(DEMO_POOL);
}

/**
 * props:
 * - lang: string
 */
class AnalyzerApp extends React.Component {
    constructor(props) {
        super(props);

        this.handleAnalyzeResponse = this.handleAnalyzeResponse.bind(this);
        this.handleAnalyzeError = this.handleAnalyzeError.bind(this);
        this.onChange = this.onChange.bind(this);
        this.onDemo = this.onDemo.bind(this);
        this.onGrammarToggle = this.onGrammarToggle.bind(this);
        this.onTranslationsToggle = this.onTranslationsToggle.bind(this);
        this.onSubmit = this.onSubmit.bind(this);

        const urlState = this.readUrlState();
        if (urlState != null) {
            this.state = urlState;
            this.startAnalysis(urlState.text);
        } else {
            this.state = this.defaultState();
        }
    }

    makeState(text, analyzing) {
        return {
            text: text,
            lastEntered: text,
            enableDemo: text.length == 0 && !analyzing,
            grammar: true,
            translations: false,
            analyzing: analyzing,
            error: false,
            breakdown: [],
        };
    }

    defaultState() {
        return this.makeState(
            /* text */ "",
            /* analyzing */ false,
        );
    }

    readUrlState() {
        const params = parseParams();
        const text = params.text;
        if (text == null || text.length == 0) {
            return null;
        }
        return this.makeState(text, /* analyzing */ true);
    }

    i18n(key) {
        return i18n(key, this.props.lang);
    }

    async handleAnalyzeResponse(context, responseJsonPromise) {
        let response = await responseJsonPromise;
        let analyzedParts = parseAnalyzeResponse(response);
        let filteredParts = [];
        for (const part of analyzedParts) {
            let filteredForms = [];
            for (const candidate of part.detectedForms) {
                if (candidate.tense != "infinitive") {
                    filteredForms.push(candidate);
                }
            }
            if (filteredForms.length > 0) {
                filteredParts.push(new AnalyzedPart(part.token, filteredForms));
            } else {
                /*
                 * Split unrecognized content into lines and insert parts with "\n" in-between,
                 * so that we can split the breakdown into flex-rows during rendering.
                 */
                const lines = part.token.split("\n");
                filteredParts.push(new AnalyzedPart(lines[0], []));
                for (let i = 1; i < lines.length; ++i) {
                    filteredParts.push(new AnalyzedPart("\n", []));
                    filteredParts.push(new AnalyzedPart(lines[i], []));
                }
            }
        }
        this.setState({ analyzing: false, error: false, breakdown: filteredParts });
    }

    async handleAnalyzeError(context, responseTextPromise) {
        let responseText = await responseTextPromise;
        console.log(`Got error from /analyze: ${responseText}, text was ${context.text}.`);
        this.setState({ analyzing: false, error: true });
    }

    startAnalysis(text) {
        if (text.length == 0) {
            return;
        }
        makeAnalyzeRequest(
            text,
            this.handleAnalyzeResponse,
            this.handleAnalyzeError,
            {
                text: text,
            }
        );
    }

    onChange(event) {
        let lastEntered = event.target.value;
        const enableDemo = false;
        this.setState({ lastEntered, enableDemo });
    }

    onDemo(event) {
        event.preventDefault();

        if (this.state.analyzing) {
            console.log("already analyzing");
            return;
        }

        const text = pickDemoSentence(this.state.lastEntered);
        const lastEntered = text;
        const analyzing = true;
        this.setState({ text, lastEntered, analyzing });
        const newUrl = buildTextAnalyzerUrl(lastEntered, this.props.lang);
        window.history.pushState(null, "", newUrl);
        this.startAnalysis(text);
    }

    renderDemoButton() {
        if (this.state.enableDemo) {
            return (
                <button
                    onClick={this.onDemo}
                    className="bg-indigo-500 hover:bg-indigo-700 text-white text-lg font-bold px-4 rounded focus:outline-none focus:shadow-outline">
                    DEMO
                </button>
            );
        }
        return (<div></div>);
    }

    onSubmit(event) {
        event.preventDefault();
        const lastEntered = this.state.lastEntered;
        if (lastEntered.length == 0) {
            console.log("empty input");
            return;
        }
        if (this.state.analyzing) {
            console.log("already analyzing");
            return;
        }
        const newUrl = buildTextAnalyzerUrl(lastEntered, this.props.lang);
        window.history.pushState(null, "", newUrl);

        const analyzing = true;
        this.setState({ analyzing });
        this.startAnalysis(lastEntered);
    }

    onGrammarToggle(event) {
        const grammar = !this.state.grammar;
        this.setState({ grammar });
    }

    onTranslationsToggle(event) {
        const translations = !this.state.translations;
        this.setState({ translations });
    }

    renderToggler(on, handler, labelKey) {
        return (
            <div
                className="mx-4 rounded flex flex-row cursor-pointer select-none"
                onClick={handler}>
                <img
                    className="mx-2 h-8"
                    src={on ? "/toggle_on.svg" : "/toggle_off.svg"}
                />
                <span className="text-xl">{this.i18n(labelKey)}</span>
            </div>
        );
    }

    renderControls() {
        return (
            <div className="flex flex-row">
                {this.renderToggler(this.state.grammar, this.onGrammarToggle, "toggleGrammar")}
                {this.renderToggler(this.state.translations, this.onTranslationsToggle, "toggleTranslations")}
                {this.renderSubmitButton()}
            </div>
        );
    }

    renderSubmitButton() {
        if (this.state.analyzing) {
            return (
                <button
                    type="submit"
                    disabled
                    className="bg-gray-500 hover:bg-gray-500 text-white text-4xl font-bold px-4 rounded focus:outline-none">
                    ⋯
                </button>
            );
        } else {
            return (
                <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-700 text-white text-4xl font-bold px-4 rounded focus:outline-none focus:shadow-outline">
                    →
                </button>
            );
        }
    }

    renderForm() {
        return (
            <form onSubmit={this.onSubmit} className="px-3 py-2 flex flex-col">
                <textarea
                    rows="3"
                    cols="32"
                    autoFocus
                    onChange={this.onChange}
                    value={this.state.lastEntered}
                    maxLength="2048"
                    required
                    className="shadow appearance-none border rounded mx-2 p-2 text-4xl lg:text-2xl text-gray-700 focus:outline-none focus:shadow-outline"
                    placeholder={this.i18n("hintEnterTextForAnalysis")}
                    />
                <div className="p-2 flex flex-row justify-between">
                    {this.renderDemoButton()}
                    {this.renderControls()}
                </div>
            </form>
        );
    }

    renderIntro() {
        if (this.state.error || this.state.analyzing) {
            return null;
        }
        let msg1 = null;
        let msg2 = null;
        if (this.state.breakdown.length == 0) {
            msg1 = "analyzerIntro";
            msg2 = "demoHint";
        } else {
            msg1 = "clipboardHint";
            msg2 = "clearHint";
        }
        return (
            <div className="flex flex-row justify-center">
                <div className="lg:w-1/5">
                    <p className="m-2 p-4 border-2 rounded-2xl bg-blue-100 text-gray-700">{this.i18n(msg1)}</p>
                    <p className="m-2 p-4 border-2 rounded-2xl bg-indigo-100 text-gray-700">{this.i18n(msg2)}</p>
                </div>
            </div>
        );
    }

    renderAnalysisStatus() {
        if (this.state.error) {
            return (
                <p className="text-center text-2xl text-red-600">{this.i18n("gotError")}</p>
            );
        } else if (this.state.analyzing) {
            return (
                <p className="text-center text-2xl text-gray-600">
                    {this.i18n("analyzing")}
                </p>
            );
        } else {
            return null;
        }
    }

    renderBreakdown() {
        let rows = [];
        let row = [];

        const flushRow = function() {
            if (row.length > 0) {
                rows.push(
                    <div key={rows.length} className="flex flex-row flex-wrap">
                        {row}
                    </div>
                );
                row = [];
            }
        }

        const grammar = this.state.grammar;
        const translations = this.state.translations;

        for (const part of this.state.breakdown) {
            if (part.detectedForms.length == 0 && part.token == "\n") {
                flushRow();
                continue;
            }
            row.push(
                <AnalyzedPartView
                    key={row.length}
                    analyzedPart={part}
                    grammar={grammar}
                    translations={translations}
                    lang={this.props.lang}
                />
            );
        }
        flushRow();
        return (
            <div className="m-4 flex flex-col">
                {rows}
            </div>
        );
    }

    render() {
        return (
            <div className="flex flex-col w-full">
                <h1 className="text-center text-4xl italic text-gray-600">
                    <a href={buildTextAnalyzerUrl("", this.props.lang)}>
                        {this.i18n("titleTextAnalyzer")}
                    </a>
                </h1>
                {this.renderForm()}
                {this.renderBreakdown()}
                {this.renderAnalysisStatus()}
                {this.renderIntro()}
            </div>
        );
    }
}

export default AnalyzerApp;