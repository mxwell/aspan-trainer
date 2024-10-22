import React from "react";
import { i18n } from "../lib/i18n";
import { makeDetectRequest } from "../lib/requests";
import { AnalyzedPart, tokenize } from "../lib/analyzer";
import { unpackDetectResponseWithPos } from "../lib/detector";
import { AnalyzedPartView } from "./analyzed_part_view";

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
        this.onSubmit = this.onSubmit.bind(this);

        this.state = this.defaultState();
    }

    makeState(text) {
        return {
            text: text,
            lastEntered: text,
            analyzing: false,
            error: false,
            breakdown: [],
        };
    }

    defaultState() {
        return this.makeState(
            /* text */ "",
        );
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
        this.processToken(tokens, 0);
    }

    onChange(event) {
        let lastEntered = event.target.value;
        this.setState({ lastEntered });
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
        this.setState({ analyzing: true });
        this.startDetection(lastEntered);
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
                    maxLength="256"
                    required
                    className="shadow appearance-none border rounded mx-2 p-2 text-4xl lg:text-2xl text-gray-700 focus:outline-none focus:shadow-outline"
                    placeholder={this.i18n("hintEnterTextForAnalysis")}
                    />
                <div className="px-3 py-2 flex flex-row justify-end">
                    <button
                        type="submit"
                        className="bg-blue-500 hover:bg-blue-700 text-white text-4xl font-bold px-4 rounded focus:outline-none focus:shadow-outline">
                        →
                    </button>
                </div>
            </form>
        );
    }

    renderAnalysisStatus() {
        if (this.state.error) {
            return (
                <p>{this.i18n("gotError")}</p>
            );
        } else if (this.state.analyzing) {
            return (
                <p>{this.i18n("analyzing")}</p>
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
                    {this.i18n("titleTextAnalyzer")}
                </h1>
                {this.renderForm()}
                {this.renderAnalysisStatus()}
                {this.renderBreakdown()}
            </div>
        );
    }
}

export default AnalyzerApp;