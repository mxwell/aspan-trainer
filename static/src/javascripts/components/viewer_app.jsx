import React from 'react';
import {
    PHRASAL_PART_TYPE
} from '../lib/aspan';
import {
    I18N_LANG_EN,
    I18N_LANG_KZ,
    i18n
} from '../lib/i18n';
import { renderOptionsWithI18nKeys } from "../lib/react_util";
import {
    buildViewerUrl,
    parseParams
} from "../lib/url";
import { generateVerbForms } from '../lib/verb_forms';

const SENTENCE_TYPES = [
    "Statement",
    "Negative",
    "Question",
];

/**
 * If true, upon hitting Submit, we get URL modified and page reloaded, hopefully, mostly from cache.
 *   Advantage: we get a proper browser history, that we can nagivate back and forth.
 *   Also, the address bar contains a URL that contains an actual state. Users can copy and share the URL.
 *
 * If false, only internal state is changed and DOM is rebuilt, no reload is required.
 *   Advantage: it can work indefinitely without connection to backend.
 */
const RELOAD_ON_SUBMIT = true;

function parseSentenceType(s) {
    if (s != null) {
        const sLower = s.toLowerCase();
        for (let i in SENTENCE_TYPES) {
            if (SENTENCE_TYPES[i].toLowerCase() == sLower) {
                return SENTENCE_TYPES[i];
            }
        }
    }
    return SENTENCE_TYPES[0];
}

function addPartClasses(colorPrefix, aux, partClasses) {
    if (aux) {
        partClasses.push(colorPrefix + "800");
        partClasses.push("font-medium");
    } else {
        partClasses.push(colorPrefix + "600");
        partClasses.push("font-bold");
    }
}

function highlightPhrasal(phrasal) {
    let htmlParts = [];
    let parts = phrasal.parts;
    var firstRegular = true;
    var firstAux = true;
    for (var i = 0; i < parts.length; ++i) {
        let part = parts[i];
        let pt = part.partType;
        let partClasses = [];
        if (!part.aux && firstRegular) {
            partClasses.push("pl-1");
            firstRegular = false;
        }
        if (part.aux && firstAux) {
            partClasses.push("pl-2");
            firstAux = false;
        }
        if (pt == PHRASAL_PART_TYPE.VerbBase) {
            addPartClasses("text-teal-", part.aux, partClasses);
        } else if (pt == PHRASAL_PART_TYPE.VerbTenseAffix) {
            addPartClasses("text-orange-", part.aux, partClasses);
        } else if (pt == PHRASAL_PART_TYPE.VerbPersonalAffix) {
            addPartClasses("text-indigo-", part.aux, partClasses);
        } else if (pt == PHRASAL_PART_TYPE.VerbNegation) {
            addPartClasses("text-red-", part.aux, partClasses);
        }
        htmlParts.push(
            <span class={partClasses.join(" ")}>
                {part.content}
            </span>
        );
    }
    return htmlParts
}

class ViewerApp extends React.Component {
    constructor(props) {
        super(props);
        this.state = this.readUrlState() || this.defaultState();

        this.onChange = this.onChange.bind(this);
        this.onSentenceTypeSelect = this.onSentenceTypeSelect.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
    }

    makeState(verb, lastEntered, sentenceType, tenses) {
        return {
            verb: verb,
            lastEntered: lastEntered,
            sentenceType: sentenceType,
            tenses: tenses,
        };
    }

    defaultState() {
        return this.makeState(
            /* verb */ "",
            /* lastEntered */ "",
            /* sentenceType */ SENTENCE_TYPES[0],
            /* tenses */ [],
        );
    }

    readUrlState() {
        const params = parseParams();
        const verb = params.verb;
        if (verb == null || verb.length <= 0) {
            return null;
        }
        const sentenceType = parseSentenceType(params.sentence_type);
        var tenses = [];
        try {
            tenses = generateVerbForms(verb.toLowerCase(), "", false, sentenceType);
        } catch (err) {
            console.log(`Error during form generation: ${err}`);
        }
        return this.makeState(
            verb,
            /* lastEntered */ verb,
            sentenceType,
            tenses,
        );
    }

    i18n(key) {
        return i18n(key, I18N_LANG_EN);
    }

    onChange(e) {
        this.setState({ lastEntered: e.target.value });
    }

    onSentenceTypeSelect(e) {
        this.setState({ sentenceType: e.target.value });
    }

    onSubmit(e) {
        e.preventDefault();
        if (RELOAD_ON_SUBMIT) {
            const url = buildViewerUrl(this.state.lastEntered, this.state.sentenceType);
            window.location.href = url;
        } else {
            let tenses = generateVerbForms(this.state.lastEntered, "", false, this.state.sentenceType);
            this.setState({ tenses });
        }
    }

    renderOneTense(tenseForms) {
        let rows = [];
        let tdBaseClass = "";
        for (var i = 0; i < tenseForms.forms.length; ++i) {
            let form = tenseForms.forms[i];
            rows.push(
                <tr class="border-t-2">
                    <td class={tdBaseClass}>{form.pronoun}</td>
                    <td class={tdBaseClass}>{highlightPhrasal(form.verbPhrase)}</td>
                </tr>
            );
        }
        return (
            <div class="px-6 flex flex-col">
                <h3 class="text-xl text-red-600 font-bold">{i18n(tenseForms.tenseNameKey, I18N_LANG_KZ)}</h3>
                <h4 class="text-gray-500">{i18n(tenseForms.tenseNameKey, I18N_LANG_EN)}</h4>
                <div class="pt-6">
                    <table class="w-full">
                        {rows}
                    </table>
                </div>
            </div>
        );
    }

    renderTenses() {
        let groupedTables = {};
        let groupNames = [];
        for (var i = 0; i < this.state.tenses.length; ++i) {
            let tense = this.state.tenses[i];
            let groupNameKey = tense.groupNameKey;
            let table = this.renderOneTense(tense);
            if (groupedTables[groupNameKey] == null) {
                groupNames.push(groupNameKey);
                groupedTables[groupNameKey] = [];
            }
            groupedTables[groupNameKey].push(table);
        }
        let groups = [];
        for (var i = 0; i < groupNames.length; ++i) {
            let groupNameKey = groupNames[i];
            groups.push(
                <div class="py-6 flex flex-wrap">
                    {groupedTables[groupNameKey]}
                </div>
            );
        }
        return (
            <div>
                {groups}
            </div>
        );
    }

    renderExampleVerbs() {
        // TODO pick randomly from a pool
        let exampleVerbs = ["жабу", "зерттеу"];
        let links = [];
        for (var i = 0; i < exampleVerbs.length; ++i) {
            let verb = exampleVerbs[i];
            let link = `/viewer.html?verb=${verb}`;
            links.push(
                <a
                    class="px-2 text-sm underline text-blue-600 hover:text-blue-800 visited:text-purple-600"
                    href={link} >
                    {verb}
                </a>
            )
        }
        return (
            <div>
                <span class="px-2 text-sm text-gray-600">{this.i18n("examples")}:</span>
                {links}
            </div>
        );
    }

    render () {
        return (
            <div class="py-6">
                <form onSubmit={this.onSubmit} class="py-2 flex justify-center">
                    <div class="px-2">
                        <input
                            type="text"
                            size="20"
                            maxlength="100"
                            value={this.state.lastEntered}
                            onChange={this.onChange}
                            placeholder="Enter verb, e.g. алу"
                            class="shadow appearance-none border rounded w-full py-2 px-3 text-2xl text-gray-700 focus:outline-none focus:shadow-outline"
                            autoFocus />
                        {this.renderExampleVerbs()}
                    </div>
                    <div class="px-2">
                        <select
                            required
                            value={this.state.sentenceType}
                            onChange={this.onSentenceTypeSelect}
                            class="text-gray-800 text-2xl px-4 py-2">
                            {renderOptionsWithI18nKeys(SENTENCE_TYPES, I18N_LANG_EN)}
                        </select>
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