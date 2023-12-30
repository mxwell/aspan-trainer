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
import { makeSuggestRequest } from '../lib/requests';
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
const ENABLE_SUGGEST = false;
const DEFAULT_SUGGESTIONS = [];
const DEFAULT_SUGGESTION_POS = -1;

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
            <span
                className={partClasses.join(" ")}
                key={`part${htmlParts.length}`}>
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
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onBgClick = this.onBgClick.bind(this);
        this.onSuggestionClick = this.onSuggestionClick.bind(this);
        this.handleSuggestResponse = this.handleSuggestResponse.bind(this);
        this.handleSuggestError = this.handleSuggestError.bind(this);
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
            suggestions: DEFAULT_SUGGESTIONS,
            currentFocus: DEFAULT_SUGGESTION_POS,
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

    async handleSuggestResponse(context, responseJsonPromise) {
        let response = await responseJsonPromise;
        let lastEntered = this.state.lastEntered;
        if (lastEntered == context.prevEntered || lastEntered == context.lastEntered) {
            let suggestions = [];
            for (let i = 0; i < response.length; ++i) {
                let item = response[i];
                if (item.text && item.text.length > 0) {
                    suggestions.push(item);
                }
            }
            if (suggestions.length < response.length) {
                console.log(`Got ${suggestions.length} suggestions after filtering.`);
            }
            let currentFocus = DEFAULT_SUGGESTION_POS;
            this.setState({ suggestions, currentFocus });
        } else {
            console.log(`Suggestions are too old, lastEntered is ${lastEntered}.`);
        }
    }

    async handleSuggestError(context, responseTextPromise) {
        let responseText = await responseTextPromise;
        console.log(`Got error from suggest: ${responseText}, lastEntered was ${context.lastEntered}.`);
        this.clearSuggestions();
    }

    onChange(e) {
        let lastEntered = e.target.value;
        if (ENABLE_SUGGEST) {
            if (lastEntered.length > 0) {
                makeSuggestRequest(
                    lastEntered,
                    this.handleSuggestResponse,
                    this.handleSuggestError,
                    {
                        prevEntered: this.state.lastEntered,
                        lastEntered: lastEntered,
                    }
                );
            } else {
                this.clearSuggestions();
            }
        }
        this.setState({ lastEntered });
    }

    moveActiveSuggestion(posChange) {
        if (posChange == 0) return;
        let suggestions = this.state.suggestions;
        let prevFocus = this.state.currentFocus;
        let currentFocus = prevFocus + posChange;
        if (currentFocus >= suggestions.length || suggestions.length == 0) {
            currentFocus = 0;
        } else if (currentFocus < 0) {
            currentFocus = suggestions.length - 1;
        }
        this.setState({ currentFocus });
    }

    clearSuggestions() {
        this.setState({
            suggestions: DEFAULT_SUGGESTIONS,
        });
    }

    activateSuggestion(lastEntered) {
        this.setState({ lastEntered });
        this.clearSuggestions();
    }

    onKeyDown(e) {
        if (e.keyCode == 40) {  // arrow down
            this.moveActiveSuggestion(1);
        } else if (e.keyCode == 38) { // arrow up
            this.moveActiveSuggestion(-1);
        } else if (e.keyCode == 27) { // esc
            this.clearSuggestions();
        } else if (e.keyCode == 13) { // enter
            let suggestions = this.state.suggestions;
            let currentFocus = this.state.currentFocus;
            if (0 <= currentFocus && currentFocus < suggestions.length) {
                e.preventDefault();
                let lastEntered = suggestions[currentFocus].data.base;
                this.activateSuggestion(lastEntered);
            }
        }
    }

    onBgClick(e) {
        this.clearSuggestions();
    }

    onSuggestionClick(verb, e) {
        e.stopPropagation();
        let lastEntered = verb;
        this.activateSuggestion(lastEntered);
    }

    onTenseTitleClick(e) {
        let titleId = e.target.id || e.target.parentElement.id;
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

    renderFormRows(tenseForms) {
        let rows = [];
        for (var i = 0; i < tenseForms.forms.length; ++i) {
            let form = tenseForms.forms[i];
            rows.push(
                <tr
                    className="border-t-2 text-4xl lg:text-base"
                    key={`row_${rows.length}`} >
                    <td>{form.pronoun}</td>
                    <td>{highlightPhrasal(form.verbPhrase)}</td>
                </tr>
            );
        }
        return rows;
    }

    renderOneTense(tenseForms) {
        let tenseNameKey = tenseForms.tenseNameKey;

        let collapse = this.state.collapse;
        let shown = this.state.shown.indexOf(tenseNameKey) >= 0;
        var clickListener = collapse ? this.onTenseTitleClick : null;
        var icon = collapse ? (
            <span className="pt-6 pr-4 lg:pt-1 lg:pr-1">
                <img src={shown ? "expand_up.svg" : "expand_down.svg"} />
            </span>
        ) : null;

        var content = null;
        var titleClasses = "text-red-400 border-b-2";
        if (!collapse || shown) {
            content = (
                <div className="pb-4 lg:py-6">
                    <h4 className="text-4xl lg:text-base text-gray-500">{this.i18n(tenseForms.tenseNameKey)}</h4>
                    <table className="lg:w-full">
                        <tbody>
                            {this.renderFormRows(tenseForms)}
                        </tbody>
                    </table>
                </div>
            );
            titleClasses = "text-red-600";
        }
        if (collapse) {
            titleClasses += " cursor-pointer flex"
        }

        return (
            <div className="px-6 flex flex-col" key={tenseNameKey}>
                <h3
                    onClick={clickListener}
                    id={`${tenseNameKey}_title`}
                    className={"text-5xl lg:text-xl font-bold " + titleClasses}>
                    {icon}
                    <span>
                        {i18n(tenseNameKey, I18N_LANG_KZ)}
                    </span>
                </h3>
                {content}
            </div>
        );
    }

    renderImage() {
        return (
            <div className="py-40 flex justify-center">
                <img src="/bg1.png"></img>
            </div>
        );
    }

    renderTenses() {
        if (this.state.tenses.length == 0) {
            return this.renderImage();
        }
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
                <div
                    className="py-6 flex sm:flex-col lg:flex-row lg:flex-wrap"
                    key={groupNameKey} >
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

    renderSuggestions() {
        let suggestions = this.state.suggestions;
        if (suggestions.length == 0) {
            return null;
        }

        let currentFocus = this.state.currentFocus;

        let items = [];
        for (var i = 0; i < suggestions.length; ++i) {
            let verb = suggestions[i].data.base;
            let texts = suggestions[i].text;
            let divClasses = "p-2 border-b-2 border-gray-300 text-2xl lg:text-xl";
            if (i == currentFocus) {
                divClasses += " bg-blue-500 text-white";
            } else {
                divClasses += " bg-white text-gray-700";
            }
            let parts = [];
            for (var j = 0; j < texts.length; ++j) {
                let text = texts[j];
                if (text.hl) {
                    parts.push(<strong key={parts.length}>{text.text}</strong>);
                } else {
                    parts.push(<span key={parts.length}>{text.text}</span>);
                }
            }
            parts.push(<i key={parts.length}>→ {verb}</i>)
            items.push(
                <div
                    onClick={(e) => { this.onSuggestionClick(verb, e) }}
                    key={i}
                    className={divClasses} >
                    {parts}
                </div>
            );
        }
        return (
            <div className="absolute z-50 left-0 right-0 border-l-2 border-r-2 border-gray-300">
                {items}
            </div>
        );
    }

    renderExampleVerbs() {
        let verbs = this.state.examples;
        if (verbs.length < 2) {
            return null;
        }
        let items = [];
        items.push(
            <span
                className="text-3xl lg:text-sm text-gray-600"
                key={`example${items.length}`} >
                {this.i18n("examples")}:
            </span>
        );
        for (var i = 0; i < verbs.length; ++i) {
            let verb = verbs[i];
            let link = `${document.location.pathname}?verb=${verb}`;
            if (i > 0) {
                items.push(
                    <span
                        className="text-3xl lg:text-sm text-gray-600"
                        key={`example${items.length}`} >
                        {this.i18n("or")}
                    </span>
                )
            }
            items.push(
                <a
                    className="px-6 lg:px-2 text-3xl lg:text-sm text-blue-600 hover:text-blue-800 visited:text-purple-600"
                    key={`example${items.length}`}
                    href={link} >
                    {verb}
                </a>
            );
        }
        return (
            <div className="py-4 lg:py-0">
                {items}
            </div>
        );
    }

    render () {
        return (
            <div className="md:py-6" onClick={this.onBgClick}>
                <form onSubmit={this.onSubmit} className="px-3 py-2 flex flex-col lg:flex-row">
                    <div className="lg:px-2">
                        <div className="relative">
                            <input
                                type="text"
                                size="20"
                                maxLength="100"
                                value={this.state.lastEntered}
                                onChange={this.onChange}
                                onKeyDown={this.onKeyDown}
                                placeholder={this.i18n("hintEnterVerb")}
                                className="shadow appearance-none border rounded w-full p-2 text-4xl lg:text-2xl text-gray-700 focus:outline-none focus:shadow-outline"
                                autoFocus />
                            {this.renderSuggestions()}
                        </div>
                        {this.renderExampleVerbs()}
                    </div>
                    <select
                        required
                        value={this.state.sentenceType}
                        onChange={this.onSentenceTypeSelect}
                        className="text-gray-800 text-4xl lg:text-2xl lg:mx-2 mb-6 p-2 lg:px-4">
                        {renderOptionsWithI18nKeys(SENTENCE_TYPES, DEFAULT_LANG)}
                    </select>
                    <input
                        type="submit"
                        value={this.i18n("buttonSubmit")}
                        className="bg-blue-500 hover:bg-blue-700 text-white text-4xl lg:text-2xl uppercase mb-6 font-bold px-4 rounded focus:outline-none focus:shadow-outline"
                    />
                </form>
                {this.renderTenses()}
            </div>
        );
    }
}

export default ViewerApp;