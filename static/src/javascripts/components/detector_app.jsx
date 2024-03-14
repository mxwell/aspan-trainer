import React from "react";
import { i18n } from "../lib/i18n";
import { parseParams } from "../lib/url"
import { makeDetectRequest } from "../lib/requests";

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
        };
    }

    defaultState() {
        return this.makeState(
            /* form */ null,
            /* verb */ null,
        );
    }

    readUrlState() {
        const params = parseParams();
        const form = params.form;
        if (form == null || form.length == 0) {
            console.log("No form in URL");
            return null;
        }
        // TODO trim form

        makeDetectRequest(
            form,
            this.handleDetectResponse,
            this.handleDetectError,
            {
                prevEntered: form,
                lastEntered: form,
            }
        );

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
                console.log(`Got ${verbs.length} verbs in detect response.`);
                if (verbs.length > 0) {
                    const verb = verbs[0];
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
        // TODO show error to user
        const verb = null;
        this.setState({ verb });
    }

    onChange(event) {
        let lastEntered = event.target.value;
        this.setState({ lastEntered });
        // call detector
    }

    onSubmit(event) {
        event.preventDefault();
        console.log(`Submit is pressed`);
        // TODO impl.
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
                    className="shadow appearance-none border rounded w-full p-2 text-4xl lg:text-2xl text-gray-700 focus:outline-none focus:shadow-outline"
                    autoFocus />
                <input
                    type="submit"
                    value={this.i18n("buttonSubmit")}
                    className="bg-blue-500 hover:bg-blue-700 text-white text-4xl lg:text-2xl uppercase mb-6 font-bold px-4 rounded focus:outline-none focus:shadow-outline"
                />
            </form>
        );
    }

    renderFindings() {
        let result = this.state.verb || this.i18n("no_verb_detected");
        return (
            <p className="text-4xl lg:text-2xl">{result}</p>
        );
    }

    render() {
        return (
            <div>
                <h1 className="px-6 text-3xl lg:text-4xl italic text-gray-600">
                    {this.i18n("title_verb_detector")}
                </h1>
                {this.renderForm()}
                {this.renderFindings()}
            </div>
        );
    }
}

export default DetectorApp;