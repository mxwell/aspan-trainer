import React from 'react';
import {
    PHRASAL_PART_TYPE
} from '../lib/aspan';
import {
    I18N_LANG_EN,
    I18N_LANG_KK,
    I18N_LANG_RU,
    i18n
} from '../lib/i18n';
import { getRandomInt, pickRandom } from '../lib/random';
import { renderOptionsWithI18nKeys } from "../lib/react_util";
import { makeSuggestRequest } from '../lib/requests';
import {
    buildViewerUrl,
    extractSsrVerb,
    isSsrPage,
    parseParams
} from "../lib/url";
import {
    checkOptionalExceptionVerb,
    createSideQuizTask,
    generateVerbForms,
} from '../lib/verb_forms';
import SideQuiz from './side_quiz';

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
const ENABLE_SUGGEST = false;
const ENABLE_TRANSLATIONS = false;
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

function pickExamples(chosenVerb, exampleCount) {
    if (PRESET_VIEWER_VERBS.length < exampleCount + 1) {
        return [];
    }
    let verbs = [];
    while (verbs.length < exampleCount) {
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

        this.onChange = this.onChange.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onBgClick = this.onBgClick.bind(this);
        this.onSuggestionClick = this.onSuggestionClick.bind(this);
        this.handleSuggestResponse = this.handleSuggestResponse.bind(this);
        this.handleSuggestError = this.handleSuggestError.bind(this);
        this.handleTranslateResponse = this.handleTranslateResponse.bind(this);
        this.handleTranslateError = this.handleTranslateError.bind(this);
        this.onTenseTitleClick = this.onTenseTitleClick.bind(this);
        this.onSentenceTypeSelect = this.onSentenceTypeSelect.bind(this);
        this.onSubmit = this.onSubmit.bind(this);

        this.onQuizSelection = this.onQuizSelection.bind(this);
        this.onQuizCompletion = this.onQuizCompletion.bind(this);

        this.state = this.readUrlState() || this.defaultState();
    }

    makeState(verb, forceExceptional, lastEntered, sentenceType, translation, tenses, warning, showVerbSwitcher) {
        let collapse = checkForCollapse();
        let shown = getInitiallyShown(collapse, tenses);
        let quizState = this.buildSideQuizState(collapse, verb);
        return {
            verb: verb,
            forceExceptional: forceExceptional,
            lastEntered: lastEntered,
            warning: warning,
            showVerbSwitcher: showVerbSwitcher,
            sentenceType: sentenceType,
            enableTranslation: this.checkTranslationEnabled(),
            translation: translation,
            tenses: tenses,
            examples: pickExamples(verb, 2),
            collapse: collapse,
            shown: shown,
            suggestions: DEFAULT_SUGGESTIONS,
            currentFocus: DEFAULT_SUGGESTION_POS,
            quizState: quizState,
        };
    }

    defaultState() {
        return this.makeState(
            /* verb */ "",
            /* forceExceptional */ false,
            /* lastEntered */ "",
            /* sentenceType */ SENTENCE_TYPES[0],
            /* translation */ null,
            /* tenses */ [],
            /* warning */ null,
            /* exceptionWarning */ null,
        );
    }

    checkTranslationEnabled() {
        return ENABLE_SUGGEST && ENABLE_TRANSLATIONS && (this.props.lang != I18N_LANG_KK);
    }

    readUrlState() {
        if (isSsrPage()) {
            const verb = extractSsrVerb();
            const url = buildViewerUrl(verb, SENTENCE_TYPES[0], false);
            window.location.href = url;
            return;
        }
        const params = parseParams();
        const verb = params.verb;
        if (verb == null || verb.length <= 0) {
            return null;
        }
        const forceExceptional = params.exception == "true"
        const sentenceType = parseSentenceType(params.sentence_type);
        var tenses = [];
        var warning = null;
        var showVerbSwitcher = false;
        try {
            const verbL = verb.toLowerCase();
            if (this.checkTranslationEnabled()) {
                this.requestTranslation(verbL);
            }
            tenses = generateVerbForms(verbL, "", forceExceptional, sentenceType);
            setPageTitle(verb);
            if (checkOptionalExceptionVerb(verb)) {
                warning = this.i18n("chooseVerbExceptionOrNot");
                showVerbSwitcher = true;
            }
        } catch (err) {
            console.log(`Error during form generation: ${err}`);
            warning = `${this.i18n("failed_recognize_verb")}: ${verb}`;
        }
        return this.makeState(
            verb,
            forceExceptional,
            /* lastEntered */ verb,
            sentenceType,
            /* translation */ null,
            tenses,
            warning,
            showVerbSwitcher,
        );
    }

    buildSideQuizState(collapse, chosenVerb) {
        if (collapse) {
            return null;
        }
        let verb = pickExamples(chosenVerb, 1)[0];
        let task = createSideQuizTask(verb, true, SENTENCE_TYPES[0]);
        if (task == null) {
            return null;
        }
        return {
            taskDescription: this.i18n("what_verb_form"),
            taskSubject: task.subject,
            cases: task.caseKeys,
            correct: task.correct,
            selected: -1,
            completed: false,
        };
    }

    i18n(key) {
        return i18n(key, this.props.lang);
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

    async handleTranslateResponse(context, responseJsonPromise) {
        let response = await responseJsonPromise;
        let verb = context.verb;
        let parts = [];
        for (let i = 0; i < response.length; ++i) {
            let item = response[i].data;
            let glosses = this.extractGlosses(item);
            if (item.base == verb && glosses) {
                for (let j = 0; j < glosses.length; ++j) {
                    parts.push(glosses[j]);
                }
                break;
            }
        }
        const wiktionaryLang = (this.props.lang == I18N_LANG_RU) ? "ru" : "en";
        const translation = {
            meanings: parts,
            src_link: `https://${wiktionaryLang}.wiktionary.org/wiki/${verb}`,
            src_title: this.i18n("wiktionary_title"),
        };
        this.setState({ translation });
    }

    async handleTranslateError(context, responseTextPromise) {
        let responseText = await responseTextPromise;
        console.log(`Got error from suggest: ${responseText}, verb for translation was ${context.verb}.`);
    }

    requestTranslation(verb) {
        if (verb.length > 0) {
            makeSuggestRequest(
                verb,
                this.handleTranslateResponse,
                this.handleTranslateError,
                { verb }
            );
        }
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

    reloadToState(verb, sentenceType, forceExceptional) {
        const url = buildViewerUrl(verb, sentenceType, forceExceptional);
        window.location.href = url;
    }

    onSentenceTypeSelect(e) {
        const sentenceType = e.target.value;
        if (this.state.tenses.length == 0 || this.state.lastEntered != this.state.verb) {
            this.setState({ sentenceType });
        } else {
            this.reloadToState(this.state.verb, sentenceType, this.state.forceExceptional);
        }
    }

    onSubmit(e) {
        e.preventDefault();
        const forceExceptional = this.state.forceExceptional && (this.state.verb == this.state.lastEntered);
        if (RELOAD_ON_SUBMIT) {
            this.reloadToState(this.state.lastEntered, this.state.sentenceType, forceExceptional);
        } else {
            let tenses = generateVerbForms(this.state.lastEntered, "", forceExceptional, this.state.sentenceType);
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
                <img src={shown ? "/expand_up.svg" : "/expand_down.svg"} />
            </span>
        ) : null;

        var content = null;
        var titleClasses = "text-red-400 border-b-2";
        if (!collapse || shown) {
            let subtitle = (this.props.lang != I18N_LANG_KK)
                ? (<h4 className="text-4xl lg:text-base text-gray-500">{this.i18n(tenseForms.tenseNameKey)}</h4>)
                : null;
            content = (
                <div className="pb-4 lg:py-6">
                    {subtitle}
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
                        {i18n(tenseNameKey, I18N_LANG_KK)}
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

    renderSwitcher() {
        if (!this.state.showVerbSwitcher) {
            return null;
        }
        const oppositeUrl = buildViewerUrl(
            this.state.verb,
            this.state.sentenceType,
            !this.state.forceExceptional
        );
        const textKey = this.state.forceExceptional ? "switch_to_regular" : "switch_to_exception";
        return (
            <p className="my-4">
                <a className="underline" href={oppositeUrl}>{this.i18n(textKey)}</a>
            </p>
        );
    }

    renderWarning() {
        let warning = this.state.warning;
        if (warning == null) {
            return null;
        }
        return (
            <div className="text-3xl lg:text-sm text-orange-600 p-5">
                {warning}
                {this.renderSwitcher()}
            </div>
        );
    }

    renderTranslationEntry(translation) {
        if (translation == null) {
            return null;
        } else if (translation.meanings.length == 0) {
            return this.i18n("no_translation");
        } else {
            return translation.meanings.join(", ");
        }
    }

    renderTranslationSource(translation) {
        if (translation == null) {
            return null;
        } else {
            return (
                <span className="pl-5 text-2xl lg:text-xs" title={translation.src_title}>
                    <a href={translation.src_link} target="blank_">[↗]</a>
                </span>
            );
        }
    }

    renderTranslation() {
        if (!this.state.enableTranslation || this.state.verb.length == 0) {
            return null;
        }
        let translation = this.state.translation;
        return (
            <fieldset className="text-3xl lg:text-base lg:mt-5 mx-3 lg:mx-5 p-5 text-gray-700 border-2 border-gray-500">
                <legend className="ml-5 px-3 text-sm lg:text-xs text-gray-500">{this.i18n("translation_by_wiktionary")}</legend>
                <span className="italic pl-5">
                    {this.renderTranslationEntry(translation)}
                </span>
                {this.renderTranslationSource(translation)}
            </fieldset>
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
                <h2 className="px-6 text-3xl lg:text-4xl italic text-gray-600">{`${this.i18n("conjugation_kz_verb")} «${this.state.verb}»`}</h2>
                {groups}
            </div>
        );
    }

    extractGlosses(data) {
        let lang = this.props.lang;
        if (lang == I18N_LANG_RU) {
            return data.ruwkt;
        } else if (lang == I18N_LANG_EN) {
            return data.enwkt;
        } else if (lang == I18N_LANG_KK) {
            return data.enwkt;
        } else {
            return null;
        }
    }

    renderSuggestions() {
        let suggestions = this.state.suggestions;
        if (suggestions.length == 0) {
            return null;
        }

        let enableTranslation = this.state.enableTranslation;
        let currentFocus = this.state.currentFocus;

        let items = [];
        for (var i = 0; i < suggestions.length; ++i) {
            let data = suggestions[i].data;
            let isTranslatedVerb = data.translation && data.translation.length > 0;
            if (isTranslatedVerb && !ENABLE_TRANSLATIONS) {
                continue;
            }
            let verb = data.base;
            let texts = suggestions[i].text;
            let divClasses = "p-2 border-b-2 border-gray-300 text-2xl lg:text-xl";
            if (i == currentFocus) {
                divClasses += " bg-blue-500 text-white";
            } else {
                divClasses += " bg-white text-gray-700";
            }
            let parts = [];
            let textFragments = [];
            for (var j = 0; j < texts.length; ++j) {
                let text = texts[j];
                if (text.hl) {
                    parts.push(<strong key={parts.length}>{text.text}</strong>);
                } else {
                    parts.push(<span key={parts.length}>{text.text}</span>);
                }
                textFragments.push(text.text);
            }
            if (verb != textFragments.join("")) {
                let arrow = isTranslatedVerb ? "⇢" : "→";
                parts.push(<span key={parts.length}> {arrow} {verb}</span>);
            }
            if (ENABLE_TRANSLATIONS && !isTranslatedVerb) {
                let glosses = this.extractGlosses(data);
                if (glosses) {
                    parts.push(<i className="text-gray-500" key={parts.length}> ≈ {glosses.join(", ")}</i>);
                }
            }
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
                {this.i18n("examples")}:&nbsp;
            </span>
        );
        for (var i = 0; i < verbs.length; ++i) {
            let verb = verbs[i];
            const link = buildViewerUrl(verb, SENTENCE_TYPES[0], false);
            if (i > 0) {
                items.push(
                    <span
                        className="text-3xl lg:text-sm text-gray-600"
                        key={`example${items.length}`} >
                        &nbsp;{this.i18n("or")}&nbsp;
                    </span>
                )
            }
            items.push(
                <a
                    className="px-2 lg:px-1 text-3xl lg:text-sm text-blue-600 hover:text-blue-800 visited:text-purple-600"
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

    onQuizCompletion() {
        let quizState = this.buildSideQuizState(this.state.collapse, this.state.verb);
        this.setState({ quizState });
    }

    onQuizSelection(position) {
        let quizState = this.state.quizState;
        quizState.selected = position;
        this.setState ({ quizState });
        setTimeout(this.onQuizCompletion, 2000);
    }

    renderQuiz() {
        let quizState = this.state.quizState;
        if (quizState && !quizState.completed) {
            const subject = quizState.taskSubject;
            const subjectAfterCompletion = highlightPhrasal(subject);
            return (
                <div className="flex flex-col justify-start pl-16 pt-32">
                    <SideQuiz
                        lang={this.props.lang}
                        taskDescription={quizState.taskDescription}
                        taskSubject={subject.raw}
                        subjectAfterCompletion={subjectAfterCompletion}
                        cases={quizState.cases}
                        correct={quizState.correct}
                        selected={quizState.selected}
                        completed={quizState.completed}
                        onQuizSelection={this.onQuizSelection}
                    />
                </div>
            );
        } else {
            return null;
        }
    }

    render () {
        return (
            <div className="flex">
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
                            {renderOptionsWithI18nKeys(SENTENCE_TYPES, this.props.lang)}
                        </select>
                        <input
                            type="submit"
                            value={this.i18n("buttonSubmit")}
                            className="bg-blue-500 hover:bg-blue-700 text-white text-4xl lg:text-2xl uppercase mb-6 font-bold px-4 rounded focus:outline-none focus:shadow-outline"
                        />
                    </form>
                    {this.renderWarning()}
                    {this.renderTranslation()}
                    {this.renderTenses()}
                </div>
                {this.renderQuiz()}
            </div>
        );
    }
}

export default ViewerApp;