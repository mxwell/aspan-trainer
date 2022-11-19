import React from 'react';
import {
    I18N_LANG_EN,
    I18N_LANG_KZ,
    i18n
} from '../lib/i18n';
import { generateVerbForms } from '../lib/verb_forms';

const SENTENCE_TYPE = "Statement";

class ViewerApp extends React.Component {
    constructor(props) {
        super(props);
        this.state = this.defaultState();

        this.onChange = this.onChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
    }

    makeState(verb, lastEntered) {
        return {
            verb: verb,
            lastEntered: lastEntered,
            tenses: [],
        };
    }

    defaultState() {
        return this.makeState(
            /* verb */ "",
            /* lastEntered */ ""
        );
    }

    i18n(key) {
        return i18n(key, I18N_LANG_EN);
    }

    onChange(e) {
        this.setState({ lastEntered: e.target.value });
    }

    onSubmit(e) {
        e.preventDefault();
        let tenses = generateVerbForms(this.state.lastEntered, "", false, SENTENCE_TYPE);
        this.setState({ tenses });
    }

    renderOneTense(tenseForms) {
        let rows = [];
        // let tdBaseClass = "text-center px-2 py-2";
        let tdBaseClass = "";
        for (var i = 0; i < tenseForms.forms.length; ++i) {
            let form = tenseForms.forms[i];
            rows.push(
                <tr class="border-t-2">
                    <td class={tdBaseClass}>{form.pronoun}</td>
                    <td class={tdBaseClass + " text-teal-600"}>{form.verbPhrase + form.terminator}</td>
                </tr>
            );
        }
        return (
            <div>
                <h3 class="text-xl text-red-600 font-bold">{i18n(tenseForms.tenseNameKey, I18N_LANG_KZ)}</h3>
                <div class="py-6">
                    <table class="w-full">
                        {rows}
                    </table>
                </div>
            </div>
        );
    }

    renderTenses() {
        let tables = [];
        for (var i = 0; i < this.state.tenses.length; ++i) {
            let tense = this.state.tenses[i];
            tables.push(this.renderOneTense(tense));
        }
        return (
            <div class="py-6">
                {tables}
            </div>
        );
    }

    render () {
        return (
            <div class="py-6">
                <form onSubmit={this.onSubmit} class="py-2 flex flex-col">
                    <div class="py-2">
                        <input
                            type="text"
                            size="20"
                            maxlength="100"
                            value={this.state.lastEntered}
                            onChange={this.onChange}
                            placeholder="Enter verb"
                            class="shadow appearance-none border rounded w-full py-2 px-3 text-2xl text-gray-700 leading-tight focus:outline-none focus:shadow-outline"/>
                    </div>
                    <input
                        type="submit"
                        value={this.i18n("buttonSubmit")}
                        class="bg-blue-500 hover:bg-blue-700 text-white text-2xl font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    />
                </form>
                {this.renderTenses()}
            </div>
        );
    }
}

export default ViewerApp;