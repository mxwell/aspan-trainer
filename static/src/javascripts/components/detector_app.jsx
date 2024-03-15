import React from "react";
import { i18n } from "../lib/i18n";
import { buildVerbDetectorUrl, parseParams } from "../lib/url"
import { makeDetectRequest } from "../lib/requests";
import { normalizeVerb } from "../lib/verb_forms";

class DetectorApp extends React.Component {
    constructor(props) {
        super(props);

        this.handleDetectResponse = this.handleDetectResponse.bind(this);
        this.handleDetectError = this.handleDetectError.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.onChange = this.onChange.bind(this);

        this.state = this.readUrlState() || this.defaultState();
    }

    makeState(form, verb) {
        return {
            form: form,
            lastEntered: form,
            verb: verb,
            error: false,
        };
    }

    defaultState() {
        return this.makeState(
            /* form */ null,
            /* verb */ null,
        );
    }

    startDetection(rawForm) {
        const form = normalizeVerb(rawForm);
        makeDetectRequest(
            form,
            this.handleDetectResponse,
            this.handleDetectError,
            {
                prevEntered: form,
                lastEntered: form,
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
        this.startDetection(form);
        return this.makeState(
            form,
            /* verb */ null,
        );
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
                let verbs = [];
                for (let i = 0; i < response.words.length; ++i) {
                    let word = response.words[i];
                    if (word && word.initial) {
                        verbs.push(word.initial);
                    }
                }
                // console.log(`Got ${verbs.length} verbs in detect response.`);
                if (verbs.length > 0) {
                    const verb = verbs[0];
                    this.setState({ verb });
                } else {
                    const verb = null;
                    this.setState({ verb });
                }
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
        this.startDetection(lastEntered);
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
        if (this.state.verb) {
            result = this.state.verb;
            extraClass = "text-green-700";
        } else if (this.state.error) {
            result = this.i18n("service_error");
            extraClass = "text-red-600";
        } else {
            result = this.i18n("no_verb_detected");
            extraClass = "text-gray-600";
        }
        return (
            <p className={`text-4xl lg:text-2xl lg:max-w-xs m-4 ${extraClass}`}>{result}</p>
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
            </div>
        );
    }
}

export default DetectorApp;