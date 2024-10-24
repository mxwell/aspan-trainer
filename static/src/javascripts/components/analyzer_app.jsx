import React from "react";
import { i18n } from "../lib/i18n";
import { makeDetectRequest } from "../lib/requests";
import { AnalyzedPart, tokenize } from "../lib/analyzer";
import { unpackDetectResponseWithPos } from "../lib/detector";
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

        this.handleDetectResponse = this.handleDetectResponse.bind(this);
        this.handleDetectError = this.handleDetectError.bind(this);
        this.onChange = this.onChange.bind(this);
        this.onDemo = this.onDemo.bind(this);
        this.onSubmit = this.onSubmit.bind(this);

        const urlState = this.readUrlState();
        if (urlState != null) {
            this.state = urlState;
            this.analyze(urlState.text);
        } else {
            this.state = this.defaultState();
        }
    }

    makeState(text) {
        return {
            text: text,
            lastEntered: text,
            analyzing: false,
            error: false,
            tokenCount: 0,
            breakdown: [],
        };
    }

    defaultState() {
        return this.makeState(
            /* text */ "",
        );
    }

    readUrlState() {
        const params = parseParams();
        const text = params.text;
        if (text == null || text.length == 0) {
            return null;
        }
        this.star
        return this.makeState(text);
    }

    i18n(key) {
        return i18n(key, this.props.lang);
    }

    async handleDetectResponse(context, responseJsonPromise) {
        let response = await responseJsonPromise;
        const tokens = context.tokens;
        const pos = context.pos;
        const token = tokens[pos];
        let detectedForms = [];
        if (response.words) {
            const candidates = unpackDetectResponseWithPos(response.words);
            /**
             * Some tenses are problematic, hence the filtering.
             */
            for (const candidate of candidates) {
                if (candidate.tense != "presentContinuous" && candidate.tense != "infinitive") {
                    detectedForms.push(candidate);
                }
            }
        }
        this.pushAnalyzedToken(pos, token, detectedForms);
        this.processToken(tokens, pos + 1);
    }

    async handleDetectError(context, responseTextPromise) {
        let responseText = await responseTextPromise;
        console.log(`Got error from detect: ${responseText}, pos was ${context.pos}.`);
        this.setState({ analyzing: false, error: true });
    }

    pushAnalyzedToken(pos, token, detectedForms) {
        let part = new AnalyzedPart(token, detectedForms);
        let breakdown = this.state.breakdown;
        if (pos == 0 || breakdown == null) {
            breakdown = [part];
        } else {
            breakdown.push(part);
        }
        this.setState({ breakdown });
    }

    detect(tokens, pos, token) {
        makeDetectRequest(
            token,
            /* suggest */ false,
            /* onlyVerbs */ false,
            this.handleDetectResponse,
            this.handleDetectError,
            {
                tokens: tokens,
                pos: pos,
            }
        );
    }

    processToken(tokens, start) {
        if (start >= tokens.length) {
            console.log("all tokens are processed");
            this.setState({ analyzing: false });
            return;
        }
        for (let pos = start; pos < tokens.length; ++pos) {
            console.log(`processing token #${pos}`);
            const token = tokens[pos];
            if (token.isWord) {
                this.detect(tokens, pos, token.content.toLowerCase());
                return;
            } else {
                this.pushAnalyzedToken(pos, token, []);
            }
        }
        console.log("all tokens are processed");
        this.setState({ analyzing: false });
    }

    startDetection(lastEntered) {
        const tokens = tokenize(lastEntered);
        if (tokens.length == 0) {
            console.log("got no tokens");
            this.setState({ analyzing: false, error: true });
            return;
        }
        this.setState({ tokenCount: tokens.length });
        this.processToken(tokens, 0);
    }

    onChange(event) {
        let lastEntered = event.target.value;
        this.setState({ lastEntered });
    }

    analyze(text) {
        if (this.state.analyzing) {
            console.log("already analyzing");
            return;
        }
        this.setState({ analyzing: true });
        this.startDetection(text);
    }

    onDemo(event) {
        event.preventDefault();

        if (this.state.analyzing) {
            console.log("already analyzing");
            return;
        }

        const text = pickDemoSentence(this.state.lastEntered);
        const lastEntered = text;
        this.setState({ text, lastEntered });
        const newUrl = buildTextAnalyzerUrl(lastEntered, this.props.lang);
        window.history.pushState(null, "", newUrl);
        this.analyze(text);
    }

    onSubmit(event) {
        event.preventDefault();
        const lastEntered = this.state.lastEntered;
        if (lastEntered.length == 0) {
            console.log("empty input");
            return;
        }
        const newUrl = buildTextAnalyzerUrl(lastEntered, this.props.lang);
        window.history.pushState(null, "", newUrl);
        this.analyze(lastEntered);
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
                    <button
                        onClick={this.onDemo}
                        className="bg-indigo-500 hover:bg-indigo-700 text-white text-lg font-bold px-4 rounded focus:outline-none focus:shadow-outline">
                        DEMO
                    </button>
                    {this.renderSubmitButton()}
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
                    {this.i18n("analyzing")} {this.state.breakdown.length}&nbsp;/&nbsp;{this.state.tokenCount}
                </p>
            );
        } else {
            return null;
        }
    }

    renderBreakdown() {
        const htmlParts = [];
        for (const part of this.state.breakdown) {
            htmlParts.push(
                <AnalyzedPartView
                    key={htmlParts.length}
                    analyzedPart={part}
                    lang={this.props.lang}
                />
            );
        }
        return (
            <div className="m-4 flex flex-row flex-wrap">
                {htmlParts}
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