import React from "react";
import { i18n } from "../lib/i18n";
import { buildDictUrl, parseParams } from "../lib/url";
import { makeDetectRequest } from "../lib/requests";
import { unpackDetectResponseWithPos } from "../lib/detector";

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

        // TODO lookup if cgi param
        this.state = this.readUrlState() || this.defaultState();
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
                <div key={formHtmls.length}>
                    <div className="flex flex-row justify-between">
                        <span>{detectedForm.base}</span>
                        <span>{oneBasedIndex}/{total}</span>
                    </div>
                </div>
            );
        }

        return (
            <div className="m-4 flex flex-col">
                <p className="italic">
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