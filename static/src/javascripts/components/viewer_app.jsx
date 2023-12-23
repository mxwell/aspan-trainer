import React from 'react';
import {
    PHRASAL_PART_TYPE
} from '../lib/aspan';
import {
    I18N_LANG_EN,
    I18N_LANG_KZ,
    I18N_LANG_RU,
    i18n
} from '../lib/i18n';
import { pickRandom } from '../lib/random';
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
const DEFAULT_LANG = I18N_LANG_RU;

const DEFAULT_TITLE = "Kazakh Verb";
const PRESET_VIEWER_VERBS = [
    /* common */
    "бару", "келу", "алу", "беру", "жазу",
    /* end with vowel */
    "жасау", "зерттеу", "ойнау", "билеу", "жаю",
    /* end with бвгғд */
    "тігу", "тебу", "шабу",
    /* exceptions */
    "абыржу", "аршу", "қобалжу", "оқу",
    /* exceptions of different kind */
    "жаю", "қою", "сүю",
    /* end with руйл */
    "қуыру", "демалу", "жуу", "пісіру",
    /* end with unvoiced consonant */
    "көмектесу", "айту", "кесу", "көшу",
    /* end with мнң */
    "еріну", "үйрену", "қуану",
];

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

function addPartClasses(auxColorPrefix, colorPrefix, aux, partClasses) {
    if (aux) {
        partClasses.push(auxColorPrefix);
        partClasses.push("font-medium");
    } else {
        partClasses.push(colorPrefix);
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
            addPartClasses("text-teal-800", "text-teal-600", part.aux, partClasses);
        } else if (pt == PHRASAL_PART_TYPE.VerbTenseAffix) {
            addPartClasses("text-orange-800", "text-orange-600", part.aux, partClasses);
        } else if (pt == PHRASAL_PART_TYPE.VerbPersonalAffix) {
            addPartClasses("text-indigo-800", "text-indigo-600", part.aux, partClasses);
        } else if (pt == PHRASAL_PART_TYPE.VerbNegation) {
            addPartClasses("text-red-800", "text-red-600", part.aux, partClasses);
        }
        htmlParts.push(
            <span class={partClasses.join(" ")}>
                {part.content}
            </span>
        );
    }
    return htmlParts
}

function setPageTitle(verb) {
    let verbOk = (typeof verb == "string") && 0 < verb.length && verb.length < 20;
    let title = verbOk ? `${verb} – ${DEFAULT_TITLE}` : DEFAULT_TITLE;
    document.title = title;
}

function checkForCollapse() {
    return window.matchMedia('screen and (max-width: 1024px)').matches;
}

function getInitiallyShown(collapse, tenses) {
    let shown = [];
    if (collapse) {
        let n = Math.min(2, tenses.length);
        for (var i = 0; i < n; ++i) {
            shown.push(tenses[i].tenseNameKey);
        }
    }
    return shown;
}

function pickExamples(chosenVerb) {
    if (PRESET_VIEWER_VERBS.length < 3) {
        return [];
    }
    let verbs = [];
    while (verbs.length < 2) {
        while (true) {
            let verb = pickRandom(PRESET_VIEWER_VERBS);
            if (verb == chosenVerb) continue;
            if (verbs.indexOf(verb) >= 0) continue;
            verbs.push(verb);
            break;
        }
    }
    return verbs;
}

class ViewerApp extends React.Component {
    constructor(props) {
        super(props);
        this.state = this.readUrlState() || this.defaultState();

        this.onChange = this.onChange.bind(this);
        this.onTenseTitleClick = this.onTenseTitleClick.bind(this);
        this.onSentenceTypeSelect = this.onSentenceTypeSelect.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
    }

    makeState(verb, lastEntered, sentenceType, tenses) {
        let collapse = checkForCollapse();
        let shown = getInitiallyShown(collapse, tenses);
        return {
            verb: verb,
            lastEntered: lastEntered,
            sentenceType: sentenceType,
            tenses: tenses,
            examples: pickExamples(verb),
            collapse: collapse,
            shown: shown,
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
            setPageTitle(verb);
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
        return i18n(key, DEFAULT_LANG);
    }

    onChange(e) {
        this.setState({ lastEntered: e.target.value });
    }

    onTenseTitleClick(e) {
        let titleId = e.target.id;
        if ((typeof titleId != "string") || !titleId.endsWith("_title")) {
            return
        }
        let tenseNameKey = titleId.substring(0, titleId.length - 6);
        let shown = this.state.shown;
        let pos = shown.indexOf(tenseNameKey);
        if (pos < 0) {
            shown.push(tenseNameKey);
            this.setState({ shown: shown });
        } else {
            let filtered = shown.filter(function(item) { return item != tenseNameKey; });
            this.setState({ shown: filtered });
        }
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
                <tr class="border-t-2 text-4xl lg:text-base">
                    <td class={tdBaseClass}>{form.pronoun}</td>
                    <td class={tdBaseClass}>{highlightPhrasal(form.verbPhrase)}</td>
                </tr>
            );
        }
        let tenseNameKey = tenseForms.tenseNameKey;

        let collapse = this.state.collapse;
        var clickListener = collapse ? this.onTenseTitleClick : null;
        var content = null;
        var titleClasses = "text-red-400 border-b-2";
        if (!collapse || this.state.shown.indexOf(tenseNameKey) >= 0) {
            content = (
                <div class="pb-4 lg:py-6">
                    <h4 class="text-4xl lg:text-base text-gray-500">{this.i18n(tenseForms.tenseNameKey)}</h4>
                    <table class="lg:w-full">
                        {rows}
                    </table>
                </div>
            );
            titleClasses = "text-red-600";
        }

        return (
            <div class="px-6 flex flex-col">
                <h3
                    onClick={clickListener}
                    id={`${tenseNameKey}_title`}
                    class={"text-5xl lg:text-xl font-bold " + titleClasses}>
                    {i18n(tenseNameKey, I18N_LANG_KZ)}
                </h3>
                {content}
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
                <div class="py-6 flex sm:flex-col lg:flex-row lg:flex-wrap">
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
        let verbs = this.state.examples;
        if (verbs.length < 2) {
            return null;
        }
        let items = [
            <span class="text-3xl lg:text-sm text-gray-600">{this.i18n("examples")}:</span>
        ];
        for (var i = 0; i < verbs.length; ++i) {
            let verb = verbs[i];
            let link = `${document.location.pathname}?verb=${verb}`;
            if (i > 0) {
                items.push(
                    <span class="text-3xl lg:text-sm text-gray-600">{this.i18n("or")}</span>
                )
            }
            items.push(
                <a
                    class="px-6 lg:px-2 text-3xl lg:text-sm text-blue-600 hover:text-blue-800 visited:text-purple-600"
                    href={link} >
                    {verb}
                </a>
            );
        }
        return (
            <div class="py-4 lg:py-0">
                {items}
            </div>
        );
    }

    render () {
        return (
            <div class="md:py-6">
                <form onSubmit={this.onSubmit} class="px-3 py-2 flex flex-col lg:flex-row">
                    <div class="lg:px-2">
                        <input
                            type="text"
                            size="20"
                            maxlength="100"
                            value={this.state.lastEntered}
                            onChange={this.onChange}
                            placeholder={this.i18n("hintEnterVerb")}
                            class="shadow appearance-none border rounded w-full p-2 text-4xl lg:text-2xl text-gray-700 focus:outline-none focus:shadow-outline"
                            autoFocus />
                        {this.renderExampleVerbs()}
                    </div>
                    <select
                        required
                        value={this.state.sentenceType}
                        onChange={this.onSentenceTypeSelect}
                        class="text-gray-800 text-4xl lg:text-2xl lg:mx-2 mb-6 p-2 lg:px-4">
                        {renderOptionsWithI18nKeys(SENTENCE_TYPES, DEFAULT_LANG)}
                    </select>
                    <input
                        type="submit"
                        value={this.i18n("buttonSubmit")}
                        class="bg-blue-500 hover:bg-blue-700 text-white text-4xl lg:text-2xl uppercase mb-6 font-bold px-4 rounded focus:outline-none focus:shadow-outline"
                    />
                </form>
                {this.renderTenses()}
            </div>
        );
    }
}

export default ViewerApp;