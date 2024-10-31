import React from "react";
import { i18n } from "../lib/i18n";
import { buildDictUrl, parseParams } from "../lib/url";
import { makeDetectRequest } from "../lib/requests";
import { unpackDetectResponseWithPos } from "../lib/detector";
import { SENTENCE_TYPES } from "../lib/sentence";

/**
 * props:
 * - lang: string
 */
class DictApp extends React.Component {
    constructor(props) {
        super(props);

        this.handleDetectResponse = this.handleDetectResponse.bind(this);
        this.handleDetectError = this.handleDetectError.bind(this);
        this.onChange = this.onChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);

        const urlState = this.readUrlState();
        if (urlState != null) {
            this.state = urlState;
            this.lookup(urlState.word);
        } else {
            this.state = this.defaultState();
        }
    }

    makeState(word) {
        return {
            word: word,
            lastEntered: word,
            loading: false,
            error: false,
            detectedForms: [],
        };
    }

    defaultState() {
        return this.makeState(
            /* word */ "",
        );
    }

    readUrlState() {
        const params = parseParams();
        const word = params.w;
        if (word == null || word.length == 0) {
            return null;
        }
        return this.makeState(word);
    }

    i18n(key) {
        return i18n(key, this.props.lang);
    }

    async handleDetectResponse(context, responseJsonPromise) {
        let response = await responseJsonPromise;
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
        const loading = false;
        this.setState({ loading, detectedForms });
    }

    async handleDetectError(context, responseTextPromise) {
        let responseText = await responseTextPromise;
        console.log(`Got error from detect: ${responseText}`);
        this.setState({ loading: false, error: true });
    }

    lookup(lastEntered) {
        const suggest = false;
        const onlyVerbs = false;
        makeDetectRequest(
            lastEntered,
            suggest,
            onlyVerbs,
            this.handleDetectResponse,
            this.handleDetectError,
            { }
        );
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
        const newUrl = buildDictUrl(lastEntered, this.props.lang);
        window.history.pushState(null, "", newUrl);
        this.lookup(lastEntered);
    }

    renderSubmitButton() {
        if (this.state.loading) {
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
            <form onSubmit={this.onSubmit} className="p-3 flex flex-row justify-center">
                <input
                    type="text"
                    size="20"
                    maxLength="100"
                    autoFocus
                    onChange={this.onChange}
                    value={this.state.lastEntered}
                    required
                    className="shadow appearance-none border rounded mx-2 p-2 text-4xl lg:text-2xl text-gray-700 focus:outline-none focus:shadow-outline"
                    placeholder={this.i18n("hintEnterWordForm")}
                    />
                {this.renderSubmitButton()}
            </form>
        );
    }

    renderFormDetails(detectedForm) {
        let featureHtmls = [];
        let pos = detectedForm.pos;
        let title = null;
        if (pos == "n") {
            title = this.i18n("titleNounFormT")(detectedForm.base);
            const septik = detectedForm.septik;
            if (septik != null && septik != 0) {
                featureHtmls.push(
                    <div key={featureHtmls.length}>
                        {this.i18n(`analyzerSeptik_${septik}`)}
                    </div>
                );
            }
            if (detectedForm.grammarPerson) {
                featureHtmls.push(
                    <div key={featureHtmls.length}>
                        {this.i18n(`analyzerPoss_${detectedForm.grammarPerson}`)}
                    </div>
                );
            }
        } else if (pos == "v") {
            title = this.i18n("titleVerbFormT")(detectedForm.base);
            const tense = detectedForm.tense;
            if (tense != null) {
                featureHtmls.push(
                    <div key={featureHtmls.length}>
                        {this.i18n(`analyzerTense_${tense}`)}
                    </div>
                );
            }
            if (detectedForm.sentenceType == SENTENCE_TYPES[1]) {
                featureHtmls.push(
                    <div key={featureHtmls.length}>
                        {this.i18n("analyzerNegation")}
                    </div>
                );
            }
            if (detectedForm.grammarPerson) {
                featureHtmls.push(
                    <div key={featureHtmls.length}>
                        {this.i18n(`analyzer_${detectedForm.grammarPerson}`)}
                    </div>
                );
            }
        } else {
            title = this.i18n("titleWordFormT")(detectedForm.base);
        }
        if (detectedForm.grammarNumber == "Plural") {
            featureHtmls.push(
                <div key={featureHtmls.length}>
                    {this.i18n("analyzer_Plural")}
                </div>
            );
        }
        if (featureHtmls.length == 0) {
            return (<div></div>);
        }
        return (
            <div>
                <h3>{title}</h3>
                {featureHtmls}
            </div>
        );
    }

    renderTranslations(detectedForm) {
        let glossHtmls = [];
        for (const gloss of detectedForm.ruGlosses) {
            glossHtmls.push(
                <li key={glossHtmls.length}>{gloss}</li>
            );
        }

        return (
            <div className="bg-green-200 p-2">
                <h3>{this.i18n("translationTo_ru")}</h3>
                <ul>
                    {glossHtmls}
                </ul>
            </div>
        );
    }

    // TODO show exception verbs
    renderDetectedForms() {
        if (this.state.error || this.state.loading) {
            return;
        }

        const detectedForms = this.state.detectedForms;

        const formHtmls = [];
        const total = detectedForms.length;
        for (const index in detectedForms) {
            const detectedForm = detectedForms[index];
            const oneBasedIndex = Number(index) + 1;
            formHtmls.push(
                <div key={formHtmls.length}
                    className="m-2 p-2 border-2">
                    <div className="flex flex-row justify-between">
                        {this.renderFormDetails(detectedForm)}
                        <span>{oneBasedIndex}/{total}</span>
                    </div>
                    {this.renderTranslations(detectedForm)}
                </div>
            );
        }

        return (
            <div className="flex flex-col">
                <p className="m-2 italic">
                    {this.i18n("foundResults", this.props.lang)}: {total}
                </p>
                {formHtmls}
            </div>
        );
    }

    renderStatus() {
        if (this.state.error) {
            return (
                <p className="text-center text-2xl text-red-600">{this.i18n("gotError")}</p>
            );
        } else if (this.state.loading) {
            return (
                <p className="text-center text-2xl text-gray-600">
                    {this.i18n("isLoading")}
                </p>
            );
        } else {
            return null;
        }
    }

    render() {
        return (
            <div className="flex flex-row justify-center">
                <div className="flex flex-col">
                    <h1 className="text-center text-4xl italic text-gray-600">
                        <a href={buildDictUrl("", this.props.lang)}>
                            {this.i18n("titleDict")}
                        </a>
                    </h1>
                    {this.renderForm()}
                    {this.renderDetectedForms()}
                    {this.renderStatus()}
                </div>
            </div>
        );

    }
}

export default DictApp;