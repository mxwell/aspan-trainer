import React from "react";
import { i18n } from "../lib/i18n";
import { makeDetectRequest } from "../lib/requests";
import { AnalyzedPart, reproduceNoun, reproduceVerb, tokenize } from "../lib/analyzer";
import { highlightDeclensionPhrasal, highlightPhrasal } from "../lib/highlight";
import { SENTENCE_TYPES } from "../lib/sentence";
import { unpackDetectResponseWithPos } from "../lib/detector";

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
        let detectedWord = null;
        if (response.words) {
            const candidate = unpackDetectResponseWithPos(response.words);
            /**
             * Some tenses are problematic, hence the filtering.
             */
            if (candidate != null && candidate.tense != "presentContinuous" && candidate.tense != "infinitive") {
                detectedWord = candidate;
            }
        }
        this.pushAnalyzedToken(token, detectedWord);
        this.processToken(tokens, pos + 1);
    }

    async handleDetectError(context, responseTextPromise) {
        let responseText = await responseTextPromise;
        console.log(`Got error from detect: ${responseText}, pos was ${context.pos}.`);
        this.setState({ analyzing: false, error: true });
    }

    pushAnalyzedToken(token, analysis) {
        const label = analysis != null ? "w/ analysis" : "w/o analysis";
        console.log(`adding token ${label}: [${token.content}]`);
        let part = new AnalyzedPart(token, analysis);
        let breakdown = this.state.breakdown;
        if (breakdown == null) {
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
                this.pushAnalyzedToken(token, null);
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
        this.setState({ analyzing: true, breakdown: [] });
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

    highlightDetectedWord(detectedWord) {
        const pos = detectedWord.pos;
        if (pos == "n") {
            const phrasal = reproduceNoun(detectedWord);
            return highlightDeclensionPhrasal(phrasal);
        } else if (pos == "v") {
            const phrasal = reproduceVerb(detectedWord);
            return highlightPhrasal(phrasal, -1);
        } else {
            return [
                <span>{detectedWord.base}</span>
            ];
        }
    }

    getFormName(pos, detectedWord) {
        if (pos == "n") {
            const septik = detectedWord.septik;
            if (septik != null && septik != 0) {
                return this.i18n(`analyzerSeptik_${detectedWord.septik}`);
            }
        } else if (pos == "v") {
            const tense = detectedWord.tense;
            if (tense != null) {
                return this.i18n(`analyzerTense_${tense}`);
            }
        }
        return null;
    }

    renderFormDetails(detectedWord) {
        const pos = detectedWord.pos;
        const posName = this.i18n(`pos_${pos}`);
        const exceptionalClause = (
            detectedWord.excVerb == 1
            ? (<p className="italic">{this.i18n("ExceptionVerb")}</p>)
            : null
        );
        const formName = this.getFormName(pos, detectedWord);
        const formElement = (
            formName != null
            ? (<p className="italic">{formName}</p>)
            : null
        );
        const negation = (
            detectedWord.sentenceType == SENTENCE_TYPES[1]
            ? <p className="italic">{this.i18n("analyzerNegation")}</p>
            : null
        );
        const grammarPerson = (
            detectedWord.grammarPerson
            ? (
                pos == "n"
                ? (<p className="italic">{this.i18n(`analyzerPoss_${detectedWord.grammarPerson}`)}</p>)
                : (<p className="italic">{this.i18n(`analyzer_${detectedWord.grammarPerson}`)}</p>)
            )
            : null
        );
        const grammarNumber = (
            detectedWord.grammarNumber == "Plural"
            ? (<p className="italic">{this.i18n("analyzer_Plural")}</p>)
            : null
        );
        return (
            <div className="flex flex-col border-2 border-gray-300 text-sm p-2">
                <strong className="text-center">{detectedWord.verb}</strong>
                <p className="">{posName}</p>
                {exceptionalClause}
                {formElement}
                {negation}
                {grammarPerson}
                {grammarNumber}
            </div>
        );
    }

    renderBreakdown() {
        const htmlParts = [];
        for (const part of this.state.breakdown) {
            const analysis = part.analysis;
            if (analysis == null) {
                htmlParts.push(
                    <div
                        key={htmlParts.length}
                        className="flex flex-col justify-top">
                        <div className="text-center text-2xl bg-gray-200 mt-10">
                            <pre>{part.token.content}</pre>
                        </div>
                    </div>
                );
            } else {
                htmlParts.push(
                    <div
                        key={htmlParts.length}
                        className="flex flex-col justify-top">
                        <div className="text-center text-2xl bg-gray-200 mt-10">
                            {this.highlightDetectedWord(analysis)}
                        </div>
                        {this.renderFormDetails(analysis)}
                    </div>
                );
            }
        }
        return (
            <div className="flex flex-row flex-wrap">
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