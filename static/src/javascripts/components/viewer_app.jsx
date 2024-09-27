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
import { renderOptionsWithI18nKeys, renderOptionsWithKeys } from "../lib/react_util";
import { makeDetectRequest, makeSuggestRequest } from '../lib/requests';
import {
    buildDeclensionUrl,
    buildExplanationUrl,
    buildGcLandingUrl,
    buildParticipleDeclensionUrl,
    buildVerbDetectorUrl,
    buildVerbFormAudioUrl,
    buildVerbGymUrl,
    buildViewerUrl2,
    parseParams
} from "../lib/url";
import {
    getOptionalExceptionalVerbMeanings,
    createSideQuizTask,
    generateParticipleForms,
    generateVerbForms,
    generatePromoVerbForms,
    detectValidVerb,
} from '../lib/verb_forms';
import { SideQuiz, initialSideQuizState } from './side_quiz';
import { buildPersonNumberList } from '../lib/grammar_utils';
import { cleanWhitespace, hasMixedAlphabets, trimAndLowercase } from '../lib/input_validation';
import { unpackDetectResponse } from '../lib/detector';
import { AUX_VERBS, parseAuxVerb } from '../lib/aux_verbs';
import { generatePromoDeclensionForms } from '../lib/declension';
import { highlightDeclensionPhrasal } from '../lib/highlight';
import { Keyboard, backspaceTextInput, insertIntoTextInput } from './keyboard';
import { abIsLatin, ALPHABET_KEYS, parseAlphabetKey } from '../lib/ab';

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
const PERSON_NUMBER_LIST = buildPersonNumberList();

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
    let title = verbOk ? `${verb.toUpperCase()} – ${DEFAULT_TITLE}` : DEFAULT_TITLE;
    document.title = title;
}

function getVerbMainPart(verb) {
    const space = verb.lastIndexOf(" ");
    if (space == -1) {
        return verb;
    } else {
        return verb.substring(space + 1);
    }
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

function getSideQuizVerbs(chosenVerb, taskCount) {
    if (PRESET_VIEWER_VERBS.length < taskCount + 1) {
        throw new Error(`Not enough verbs for side quiz: ${PRESET_VIEWER_VERBS.length}`);
    }
    let offset = getRandomInt(PRESET_VIEWER_VERBS.length - 1);
    let verbs = [];
    for (let i = 0; i < taskCount; ++i) {
        if (PRESET_VIEWER_VERBS[offset] == chosenVerb) {
            offset = (offset + 1) % PRESET_VIEWER_VERBS.length;
        }
        verbs.push(PRESET_VIEWER_VERBS[offset]);
        offset = (offset + 1) % PRESET_VIEWER_VERBS.length;
    }
    return verbs;
}

class ViewerApp extends React.Component {
    constructor(props) {
        super(props);

        this.onInsert = this.onInsert.bind(this);
        this.onBackspace = this.onBackspace.bind(this);
        this.onKeyboardClick = this.onKeyboardClick.bind(this);
        this.onChange = this.onChange.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onBgClick = this.onBgClick.bind(this);
        this.onSuggestionClick = this.onSuggestionClick.bind(this);
        this.handleSuggestResponse = this.handleSuggestResponse.bind(this);
        this.handleSuggestError = this.handleSuggestError.bind(this);
        this.handleTranslateResponse = this.handleTranslateResponse.bind(this);
        this.handleTranslateError = this.handleTranslateError.bind(this);
        this.handleDetectResponse = this.handleDetectResponse.bind(this);
        this.handleDetectError = this.handleDetectError.bind(this);
        this.onTenseTitleClick = this.onTenseTitleClick.bind(this);
        this.playSound = this.playSound.bind(this);
        this.onPlusClick = this.onPlusClick.bind(this);
        this.onMinusClick = this.onMinusClick.bind(this);
        this.onQuestionClick = this.onQuestionClick.bind(this);
        this.switchBetweenRegularAndException = this.switchBetweenRegularAndException.bind(this);
        this.onAuxNegToggle = this.onAuxNegToggle.bind(this);
        this.onAuxVerbSelect = this.onAuxVerbSelect.bind(this);
        this.onAbSelect = this.onAbSelect.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.buildSideQuizState = this.buildSideQuizState.bind(this);

        this.state = this.requestInfo() || this.defaultState();
    }

    makeState(loading, verb, normalized, forceExceptional, abKey, known, auxVerb, auxNeg, lastEntered, sentenceType, translation, tenses, warning, meanings) {
        let collapse = checkForCollapse();
        let shown = getInitiallyShown(collapse, tenses);
        return {
            loading: loading,
            verb: verb,
            normalized: normalized,
            forceExceptional: forceExceptional,
            abKey: abKey,
            known: known,
            auxVerb: auxVerb,
            auxNeg: auxNeg,  // negation via the auxiliary verb change as opposed to the main verb change
            lastEntered: lastEntered,
            keyboard: false,
            detected: null,
            warning: warning,
            meanings: meanings,
            sentenceType: sentenceType,
            enableTranslation: ENABLE_TRANSLATIONS && this.props.lang != I18N_LANG_KK,
            translation: translation,
            tenses: tenses,
            tensesSentenceType: sentenceType,
            examples: pickExamples(verb, 2),
            collapse: collapse,
            shown: shown,
            suggestions: DEFAULT_SUGGESTIONS,
            currentFocus: DEFAULT_SUGGESTION_POS,
        };
    }

    makeInitialState(loading) {
        return this.makeState(
            /* loading */ loading,
            /* verb */ "",
            /* normalized */ null,
            /* forceExceptional */ false,
            /* abKey */ ALPHABET_KEYS[0],
            /* known */ false,
            /* auxVerb */ AUX_VERBS[0],
            /* auxNeg */ false,
            /* lastEntered */ "",
            /* sentenceType */ SENTENCE_TYPES[0],
            /* translation */ null,
            /* tenses */ [],
            /* warning */ null,
            /* meanings */ null,
        );
    }

    defaultState() {
        return this.makeInitialState(false);
    }

    loadingState() {
        return this.makeInitialState(true);
    }

    checkTranslationEnabled() {
        return ENABLE_SUGGEST && ENABLE_TRANSLATIONS;
    }

    requestInfo() {
        const params = parseParams();
        /* If we don't need translation, then we have everything and can render the page right away */
        if (!ENABLE_TRANSLATIONS) {
            return this.readUrlState(params, false, null);
        }
        const verb = params.verb;
        if (verb == null || verb.length <= 0) {
            return null;
        }
        const normalized = detectValidVerb(trimAndLowercase(verb));
        if (normalized == null) {
            return this.readUrlState(params, false, null);
        }
        this.requestTranslation(params, normalized);
        return this.loadingState();
    }

    readUrlState(params, known, translationVariants) {
        const verb = params.verb;
        if (verb == null || verb.length <= 0) {
            return null;
        }
        const forceExceptional = params.exception == "true"
        const abKey = parseAlphabetKey(params.ab);
        const auxVerb = parseAuxVerb(params.aux);
        const auxNeg = params.aux_neg == "true";
        const sentenceType = parseSentenceType(params.sentence_type);
        var tenses = [];
        var warning = null;
        if (hasMixedAlphabets(verb)) {
            warning = this.i18n("mixedAlphabets");
        }
        let meanings = null;
        const verbL = trimAndLowercase(verb);
        const normalized = detectValidVerb(verbL);
        let recognized = false;
        if (normalized != null) {
            try {
                const lat = abIsLatin(abKey);
                tenses = generateVerbForms(normalized, auxVerb, auxNeg, forceExceptional, sentenceType, lat);
                setPageTitle(verbL);
                meanings = getOptionalExceptionalVerbMeanings(normalized);
                if (meanings != null) {
                    const verbPart = getVerbMainPart(verbL);
                    warning = this.i18n("verbHasTwoMeaningsTempl")(verbPart);
                }
                recognized = true;
            } catch (err) {
                console.log(`Error during form generation: ${err}`);
            }
        }
        if (!recognized) {
            warning = `${this.i18n("failed_recognize_verb")}: ${verb}`;
            this.startDetection(verb);
        }
        let translation = null;
        if (translationVariants != null) {
            const index = forceExceptional ? 1 : 0;
            if (translationVariants[index] != null) {
                translation = translationVariants[index];
            }
        }
        return this.makeState(
            /* loading */ false,
            verb,
            normalized,
            forceExceptional,
            abKey,
            known,
            auxVerb,
            auxNeg,
            /* lastEntered */ verb,
            sentenceType,
            translation,
            tenses,
            warning,
            meanings,
        );
    }

    buildSideQuizState() {
        const chosenVerb = this.state.verb;
        const taskCount = 5;
        let verbs = getSideQuizVerbs(chosenVerb, taskCount);
        if (verbs.length < taskCount) {
            console.log(`Failed to pick ${taskCount} verbs for quiz: ${verbs.length}.`);
            return null;
        }
        let tasks = [];
        for (let i = 0; i < verbs.length; ++i) {
            let verb = verbs[i];
            let task = createSideQuizTask(verb, true, SENTENCE_TYPES[0]);
            if (task == null) {
                console.log(`Failed to create task for ${verb}, i ${i}.`)
                return null;
            }
            task.completedSubject = highlightPhrasal(task.subject);
            tasks.push(task);
        }
        return initialSideQuizState(
            this.i18n("what_verb_form"),
            tasks,
        );
    }

    i18n(key) {
        return i18n(key, this.props.lang);
    }

    onKeyboardClick(e) {
        e.preventDefault();
        const keyboard = !this.state.keyboard;
        this.setState({ keyboard });
    }

    updateText(change) {
        this.setState(
            { lastEntered: change.newText },
            () => {
                const vi = this.refs.verbInput;
                vi.selectionStart = change.newSelectionStart;
                vi.selectionEnd = change.newSelectionStart;
                vi.focus();
            }
        );
    }

    onInsert(fragment) {
        const textInput = this.refs.verbInput;
        const change = insertIntoTextInput(textInput, fragment);
        this.updateText(change);
    }

    onBackspace() {
        const textInput = this.refs.verbInput;
        const change = backspaceTextInput(textInput);
        this.updateText(change);
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
        let params = context.params;
        let verb = context.verb;
        let known = response.length > 0;
        let lang = this.props.lang;
        if (lang == I18N_LANG_KK) {
            this.setState(
                this.readUrlState(params, known, null)
            );
            return;
        }
        let translationVariants = null;
        for (let i = 0; i < response.length; ++i) {
            let item = response[i].data;
            if (item.base == verb) {
                let itemTranslationVariants = this.extractTranslationVariants(item, lang);
                if (itemTranslationVariants != null && itemTranslationVariants.length == 2) {
                    translationVariants = itemTranslationVariants;
                }
                break;
            }
        }
        this.setState(
            this.readUrlState(params, known, translationVariants)
        );
    }

    async handleTranslateError(context, responseTextPromise) {
        let responseText = await responseTextPromise;
        console.log(`Got error from suggest: ${responseText}, verb for translation was ${context.verb}.`);

        let params = context.params;
        let known = false;
        let translationVariants = null;
        this.setState(
            this.readUrlState(params, known, translationVariants)
        );
    }

    requestTranslation(params, verb) {
        if (verb.length > 0) {
            makeSuggestRequest(
                verb,
                this.handleTranslateResponse,
                this.handleTranslateError,
                { params, verb }
            );
        }
    }

    async handleDetectResponse(context, responseJsonPromise) {
        let response = await responseJsonPromise;
        let verb = this.state.verb;
        // TODO Use "form" from the response, instead of the context
        if (verb == context.detectRawForm) {
            if (response.words) {
                const detected = unpackDetectResponse(response.words);
                this.setState({ detected });
            } else {
                console.log("No words in detect response.");
            }
        } else {
            console.log(`Detections are too old, verb is ${verb}.`);
        }
    }

    async handleDetectError(context, responseTextPromise) {
        let responseText = await responseTextPromise;
        console.log(`Got error from detect: ${responseText}, detectRawForm was ${context.detectRawForm}.`);
        const detected = null;
        this.setState({ detected });
    }

    startDetection(rawForm) {
        const form = trimAndLowercase(rawForm);

        if (form.length == 0) {
            return;
        }

        const suggest = false;
        makeDetectRequest(
            form,
            suggest,
            this.handleDetectResponse,
            this.handleDetectError,
            {
                detectRawForm: rawForm,
            }
        );
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

    reloadToState(verb, sentenceType, forceExceptional, abKey, auxVerb, auxNeg) {
        const url = buildViewerUrl2(verb, sentenceType, forceExceptional, abKey, this.props.lang, auxVerb, auxNeg);
        window.location.href = url;
    }

    onSubmit(e) {
        e.preventDefault();
        const forceExceptional = this.state.forceExceptional && (this.state.verb == this.state.lastEntered);
        const lastEntered = cleanWhitespace(this.state.lastEntered);
        if (lastEntered.length == 0) {
            console.log("empty input after clean");
            return;
        }
        if (RELOAD_ON_SUBMIT) {
            this.reloadToState(lastEntered, this.state.sentenceType, forceExceptional, this.state.abKey, this.state.auxVerb, this.state.auxNeg);
        } else {
            let tenses = generateVerbForms(lastEntered, this.state.auxVerb, this.state.auxNeg, forceExceptional, this.state.sentenceType);
            let tensesSentenceType = this.state.sentenceType;
            this.setState({ tenses, tensesSentenceType });
        }
    }

    buildExplanationLinkCell(tense, persoNumberIndex) {
        const lang = this.props.lang;
        if (lang == I18N_LANG_KK) {
            return null;
        }
        if (tense != "presentTransitive") {
            return null;
        }
        const normalized = this.state.normalized;
        if (normalized == null) {
            return null;
        }
        let sentenceType = this.state.tensesSentenceType;
        let personNumber = PERSON_NUMBER_LIST[persoNumberIndex];
        let url = buildExplanationUrl(
            normalized,
            tense,
            sentenceType,
            this.state.forceExceptional,
            personNumber.person,
            personNumber.number,
            lang
        );
        return (
            <td>
                <a href={url}>[↗]</a>
            </td>
        );
    }

    buildDeclensionLinkCell(verbForm) {
        if (!verbForm.declinable) {
            return null;
        }
        const normalized = this.state.normalized;
        if (normalized == null) {
            return null;
        }
        const url = buildParticipleDeclensionUrl(normalized, verbForm.formKey, this.state.sentenceType, this.props.lang);
        return (
            <td className="pl-1">
                [<a
                    className="text-blue-600"
                    href={url}>
                    {this.i18n("declLink")}↗
                </a>]
            </td>
        );
    }

    playSound(audioUrl) {
        const audio = this.refs.audio;
        const audioSrc = this.refs.audioSrc;
        audioSrc.src = audioUrl;
        audio.load();
        audio.play();
    }

    renderAudio(normalized, fe, known, form) {
        if (!known) {
            return null;
        }
        const audioTextPrefix = (
            form.pronoun
            ? `${form.pronoun} `
            : ""
        );
        const audioText = `${audioTextPrefix}${form.verbPhrase.raw}`;
        const audioUrl = buildVerbFormAudioUrl(normalized, fe, audioText);
        return (
            <td>
                <img
                    className="h-12 lg:h-6"
                    onClick={() => this.playSound(audioUrl)}
                    src="/sound.svg" />
            </td>
        );
    }

    renderFormRows(tenseForms, tense, lat) {
        const normalized = this.state.normalized;
        const fe = this.state.forceExceptional;
        const known = this.state.known;

        let rows = [];
        for (var i = 0; i < tenseForms.forms.length; ++i) {
            let form = tenseForms.forms[i];
            const pronoun = (lat ? form.latPronoun : form.pronoun);
            const labelText = pronoun || this.i18n(form.formKey);
            const verbPhrase = (lat ? form.latVerbPhrase : form.verbPhrase);

            rows.push(
                <tr
                    className="border-t-2 text-4xl lg:text-base"
                    key={`row_${rows.length}`} >
                    <td>{labelText}</td>
                    <td>{highlightPhrasal(verbPhrase)}</td>
                    {this.renderAudio(normalized, fe, known, form)}
                    {this.buildExplanationLinkCell(tense, i)}
                    {this.buildDeclensionLinkCell(form)}
                </tr>
            );
        }
        return rows;
    }

    renderDeclensionForms(declensionForms) {
        let rows = [];
        for (let i = 0; i < declensionForms.length; ++i) {
            const phrasal = declensionForms[i].phrasal;
            rows.push(
                <tr
                    className="border-t-2 text-4xl lg:text-base"
                    key={i}>
                    <td>
                        {highlightDeclensionPhrasal(phrasal)}
                    </td>
                </tr>
            );
        }
        return rows;
    }

    renderOneTense(tenseForms, lat) {
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
            titleClasses = "text-red-500";
            if (collapse) {
                titleClasses += " cursor-pointer flex"
            }

            let subtitle = (this.props.lang != I18N_LANG_KK)
                ? (<h4 className="lg:max-w-xs pt-4 text-4xl lg:text-base text-gray-500">{this.i18n(`${tenseForms.tenseNameKey}Descr`)}</h4>)
                : null;
            content = (
                <div className="pb-4 lg:py-6">
                    <div className="lg:h-40">
                        <h3
                            onClick={clickListener}
                            id={`${tenseNameKey}_title`}
                            className={"text-5xl lg:text-lg font-bold lg:w-48 " + titleClasses}>
                            {icon}
                            <span>
                                {this.i18n(tenseNameKey)}
                            </span>
                        </h3>
                        {subtitle}
                        <div className="flex flex-row justify-between">
                            {this.renderNegationToggler(tenseNameKey)}
                            {this.renderAuxVerbSelector(tenseNameKey)}
                        </div>
                    </div>
                    <table className="lg:w-full">
                        <tbody>
                            {this.renderFormRows(tenseForms, tenseForms.tenseNameKey, lat)}
                        </tbody>
                    </table>
                </div>
            );
        } else {
            if (collapse) {
                titleClasses += " cursor-pointer flex"
            }
            content = (
                <h3
                    onClick={clickListener}
                    id={`${tenseNameKey}_title`}
                    className={"lg:h-10 text-5xl lg:text-lg font-bold lg:w-48 " + titleClasses}>
                    {icon}
                    <span>
                        {this.i18n(tenseNameKey)}
                    </span>
                </h3>
            );
        }

        return (
            <div className="px-6 flex flex-col" key={tenseNameKey}>
                {content}
            </div>
        );
    }

    renderNegationToggler(tenseNameKey) {
        if (this.state.sentenceType != "Negative") {
            return (<span></span>);
        }
        if (tenseNameKey != "presentContinuous" && tenseNameKey != "remotePast") {
            return (<span></span>);
        }
        return (
            <img
                className="mx-2 mt-2 h-10 lg:mt-0 lg:h-auto"
                src={this.state.auxNeg ? "/toggle_on.svg" : "/toggle_off.svg"}
                onClick={this.onAuxNegToggle}
                />
        );
    }

    onAuxNegToggle(e) {
        const auxNeg = !this.state.auxNeg;
        console.log(`Aux negation changed to ${auxNeg}.`)
        this.reloadToState(this.state.verb, this.state.sentenceType, this.state.forceExceptional, this.state.abKey, this.state.auxVerb, auxNeg);
    }

    renderAuxVerbSelector(tenseNameKey) {
        if (tenseNameKey != "presentContinuous") {
            return null;
        }
        return (
            <select
                required
                value={this.state.auxVerb}
                onChange={this.onAuxVerbSelect}
                className="text-4xl lg:text-base px-2 ml-2">
                {renderOptionsWithKeys(AUX_VERBS)}
            </select>
        );
    }

    onAuxVerbSelect(e) {
        const auxVerb = e.target.value;
        console.log(`Aux verb changed to ${auxVerb}.`)
        this.reloadToState(this.state.verb, this.state.sentenceType, this.state.forceExceptional, this.state.abKey, auxVerb, this.state.auxNeg);
    }

    renderSwitcher() {
        const meanings = this.state.meanings;
        if (meanings == null) {
            return null;
        }

        let regularChecked = null;
        let exceptionChecked = null;
        let regularHandler = null;
        let exceptionHandler = null;
        if (this.state.forceExceptional) {
            exceptionChecked = "checked";
            regularHandler = this.switchBetweenRegularAndException;
        } else {
            regularChecked = "checked";
            exceptionHandler = this.switchBetweenRegularAndException;
        }
        const verbPart = getVerbMainPart(this.state.verb);

        return (
            <fieldset>
                <div className="my-2">
                    <input type="radio" id="regular" checked={regularChecked} onChange={regularHandler} />
                    <label
                        className="mx-2"
                        htmlFor="regular">
                        {this.i18n("verbMeaningRegularPrefixTempl")(verbPart)}&nbsp;<strong>«{meanings[0].join(", ")}»</strong>&nbsp;{this.i18n("verbMeaningSuffix")}
                    </label>
                </div>
                <div className="my-2">
                    <input type="radio" id="exception" checked={exceptionChecked} onChange={exceptionHandler} />
                    <label
                        className="mx-2"
                        htmlFor="exception">
                        {this.i18n("verbMeaningExceptionPrefixTempl")(verbPart)}&nbsp;<strong>«{meanings[1].join(", ")}»</strong>&nbsp;{this.i18n("verbMeaningSuffix")}
                    </label>
                </div>
            </fieldset>
        );
    }

    switchBetweenRegularAndException(e) {
        e.preventDefault();
        this.reloadToState(this.state.verb, this.state.sentenceType, !this.state.forceExceptional, this.state.abKey, this.state.auxVerb, this.state.auxNeg);
    }

    renderDetectedVerbInvite() {
        const detected = this.state.detected;
        if (detected == null) {
            return null;
        }
        const sentenceType = detected.sentenceType || SENTENCE_TYPES[0];
        const forceExceptional = detected.isExceptional == true;
        const url = buildViewerUrl2(detected.verb, sentenceType, forceExceptional, this.state.abKey, this.props.lang, null, false);
        return (
            <p className="my-4">
                {this.i18n("entered_is_form")(detected.verb)}.&nbsp;
                <a className="underline text-orange-600" href={url}>{this.i18n("show_detected")(detected.verb)}</a>
            </p>
        );
    }

    renderSentenceTypeToggle() {
        const sentenceType = this.state.sentenceType;
        const active = "bg-blue-600 hover:bg-blue-700";
        const inactive = "bg-gray-400 hover:bg-gray-600";
        const plusClass = sentenceType == "Statement" ? active : inactive;
        const minusClass = sentenceType == "Negative" ? active : inactive;
        const questionClass = sentenceType == "Question" ? active : inactive;
        const commonClass = "text-white text-3xl lg:text-2xl font-bold border-2 h-12 w-12"
        return (
            <div className="flex flex-row mx-4 my-1">
                <button
                    className={`${plusClass} ${commonClass}`}
                    onClick={this.onPlusClick}
                    type="button">
                    +
                </button>
                <button
                    className={`${minusClass} ${commonClass}`}
                    onClick={this.onMinusClick}
                    type="button">
                    -
                </button>
                <button
                    className={`${questionClass} ${commonClass}`}
                    onClick={this.onQuestionClick}
                    type="button">
                    ?
                </button>
            </div>
        );
    }

    onPlusClick(e) {
        e.preventDefault();
        this.toggleSentenceType("Statement");
    }

    onMinusClick(e) {
        e.preventDefault();
        this.toggleSentenceType("Negative");
    }

    onQuestionClick(e) {
        e.preventDefault();
        this.toggleSentenceType("Question");
    }

    toggleSentenceType(sentenceType) {
        if (this.state.tenses.length == 0) {
            this.setState({ sentenceType });
        } else {
            this.reloadToState(this.state.verb, sentenceType, this.state.forceExceptional, this.state.abKey, this.state.auxVerb, this.state.auxNeg);
        }
    }

    renderKeyboard(keyboard, lat) {
        if (!keyboard) {
            return null;
        }
        return (
            <div className="mx-6 py-2 bg-gray-200">
                <Keyboard
                    insertCallback={this.onInsert}
                    backspaceCallback={this.onBackspace}
                    lat={lat} />
            </div>
        );
    }

    renderWarning() {
        let warning = this.state.warning;
        if (warning == null) {
            return null;
        }
        const detectedVerbInvite = this.renderDetectedVerbInvite();
        if (detectedVerbInvite != null) {
            return (
                <div className="text-3xl lg:text-sm p-5">
                    {detectedVerbInvite}
                </div>
            );
        }
        return (
            <div className="text-3xl lg:text-base p-5">
                <p className="text-orange-600">{warning}</p>
                {this.renderSwitcher()}
            </div>
        );
    }

    renderTranslationEntry(translation) {
        if (translation == null || translation.length == 0) {
            return this.i18n("no_translation");
        } else {
            return translation.join(", ");
        }
    }

    renderTranslationInvite() {
        const link = buildGcLandingUrl(this.props.lang);
        return (
            <span className="pl-5" title="Kazakh Verb Dictionary">
                <a href={link} target="blank_">
                    <img src="/edit_square.svg" alt="add translation" className="h-12 lg:h-6" />
                </a>
            </span>
        );
    }

    renderTranslation() {
        if (!this.state.enableTranslation || this.state.verb.length == 0) {
            return null;
        }
        let translation = this.state.translation;
        return (
            <fieldset className="text-3xl lg:text-base lg:mt-5 mx-3 lg:mx-5 p-5 text-gray-700 border-2 border-gray-500 flex flex-row">
                <legend className="ml-5 px-3 text-sm lg:text-xs text-gray-500">{this.i18n("translation")}</legend>
                <span className="italic pl-5">
                    {this.renderTranslationEntry(translation)}
                </span>
                {this.renderTranslationInvite()}
            </fieldset>
        );
    }

    onAbSelect(e) {
        const abKey = e.target.value;
        console.log(`AB key changed to ${abKey}.`)
        this.reloadToState(this.state.verb, this.state.sentenceType, this.state.forceExceptional, abKey, this.state.auxVerb, this.state.auxNeg);
    }

    renderAbSelector() {
        return (
            <div className="px-6 flex flex-row">
                <span className="text-4xl lg:text-base p-2">{this.i18n("alphabet")}</span>
                <select
                    required
                    value={this.state.abKey}
                    onChange={this.onAbSelect}
                    className="text-4xl lg:text-base p-2 ml-2">
                    {renderOptionsWithI18nKeys(ALPHABET_KEYS, this.props.lang)}
                </select>
            </div>
        );
    }

    renderTenses() {
        if (this.state.tenses.length == 0) {
            return this.renderLandingPage();
        }
        let groupedTables = {};
        let groupNames = [];
        const lat = abIsLatin(this.state.abKey);
        for (var i = 0; i < this.state.tenses.length; ++i) {
            let tense = this.state.tenses[i];
            let groupNameKey = tense.groupNameKey;
            let table = this.renderOneTense(tense, lat);
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
        const verb = this.state.verb;
        const descr = (
            this.state.known
            ? (<p className="px-6 py-2 text-3xl lg:text-base text-gray-600 lg:max-w-3xl">{this.i18n("conjTablesDescrTempl")(verb)}</p>)
            : null
        );
        return (
            <div>
                <h2 className="px-6 py-4 text-3xl lg:text-4xl italic lg:max-w-3xl">{this.i18n("conjInAllTensesTempl")(verb)}</h2>
                {descr}
                {this.renderAbSelector()}
                <audio preload="none" ref="audio"><source type="audio/mpeg" ref="audioSrc"/></audio>
                {groups}
            </div>
        );
    }

    renderLandingPage() {
        if (this.state.keyboard) {
            return null;
        }
        const lang = this.props.lang;
        const verb = "келу";
        const verbForms = generatePromoVerbForms(verb, false);
        const verbLink = buildViewerUrl2(verb, SENTENCE_TYPES[0], false, null, lang, null, false);
        const verbForm = "келмеймін";
        const subject = "келген";
        const declensionForms = generatePromoDeclensionForms(subject);
        return (
            <div className="flex flex-col lg:flex-row justify-center">
                <div className="max-w-sm lg:w-48 bg-red-100 p-4 m-10">
                    <h1 className="my-4 text-center text-5xl lg:text-lg font-bold text-red-500">
                        {this.i18n("titleConjugation")}
                    </h1>
                    <h2 className="text-center text-3xl lg:text-lg text-gray-500 bg-white border-gray-300 border-2">
                        {verb}
                    </h2>
                    <h2 className="text-center text-3xl lg:text-lg text-gray-500">↓</h2>
                    <table className="mx-4">
                        <tbody>
                            {this.renderFormRows(verbForms, "", false)}
                        </tbody>
                    </table>
                    <a
                        href={verbLink}>
                        <h2 className="mt-4 text-right text-3xl lg:text-base text-blue-600 underline">
                            {this.i18n("tryOut")}&nbsp;→
                        </h2>
                    </a>
                </div>
                <div className="max-w-sm lg:w-48 bg-red-100 p-4 m-10">
                    <h1 className="my-4 text-center text-5xl lg:text-lg font-bold text-red-500 text-center">
                        {this.i18n("title_verb_detector")}
                    </h1>
                    <h2 className="text-center text-3xl lg:text-lg text-gray-500 bg-white border-gray-300 border-2">
                        {verbForm}
                    </h2>
                    <h2 className="text-center text-3xl lg:text-lg text-gray-500">↓</h2>
                    <h2 className="text-center text-3xl lg:text-lg text-gray-700">
                        {verb}
                    </h2>
                    <a
                        href={buildVerbDetectorUrl(verbForm, lang)}>
                        <h2 className="mt-4 text-right text-3xl lg:text-base text-blue-600 underline">
                            {this.i18n("tryOut")}&nbsp;→
                        </h2>
                    </a>
                </div>
                <div className="max-w-sm lg:w-48 bg-red-100 p-4 m-10">
                    <h1 className="my-4 text-center text-5xl lg:text-lg font-bold text-red-500 text-center">
                        {this.i18n("titleDeclension")}
                    </h1>
                    <h2 className="text-center text-3xl lg:text-lg text-gray-500 bg-white border-gray-300 border-2">
                        {subject}
                    </h2>
                    <h2 className="text-center text-3xl lg:text-lg text-gray-500">↓</h2>
                    <table className="mx-4">
                        <tbody>
                            {this.renderDeclensionForms(declensionForms)}
                        </tbody>
                    </table>
                    <a
                        href={buildDeclensionUrl(subject, false, lang)}>
                        <h2 className="mt-4 text-right text-3xl lg:text-base text-blue-600 underline">
                            {this.i18n("tryOut")}&nbsp;→
                        </h2>
                    </a>
                </div>
                <div className="max-w-sm lg:w-48 bg-red-100 p-4 m-10">
                    <h1 className="my-4 text-center text-5xl lg:text-lg font-bold text-red-500 text-center">
                        {this.i18n("verbGym")}
                    </h1>
                    <h2 className="text-center text-3xl lg:text-lg text-gray-500">
                        «Сіз [ келу ]»
                    </h2>
                    <h2 className="text-center text-3xl lg:text-lg text-gray-500">↓</h2>
                    <h2 className="text-center text-3xl lg:text-lg text-gray-500 bg-white border-gray-300 border-2">
                        келесіз<span className="px-2 text-green-400">✅</span>
                    </h2>
                    <a
                        href={buildVerbGymUrl(lang)}>
                        <h2 className="mt-4 text-right text-3xl lg:text-base text-blue-600 underline">
                            {this.i18n("tryOut")}&nbsp;→
                        </h2>
                    </a>
                </div>
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

    extractTranslationVariants(data, lang) {
        if (lang == I18N_LANG_EN) {
            return [data.kvden, data.kvdenfe];
        } else if (lang == I18N_LANG_RU) {
            return [data.kvdru, data.kvdrufe];
        }
        return null;
    }

    renderSuggestions() {
        let suggestions = this.state.suggestions;
        if (suggestions.length == 0 || this.state.keyboard) {
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
            const link = buildViewerUrl2(verb, SENTENCE_TYPES[0], false, null, this.props.lang, null, false);
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

    renderQuiz() {
        const chosenVerb = this.state.verb;
        if (this.state.collapse || chosenVerb.length == 0) {
            return null;
        }
        return (
            <div className="flex flex-col justify-start pl-16 pt-32">
                <SideQuiz
                    lang={this.props.lang}
                    sideQuizStateCreator={this.buildSideQuizState}
                />
            </div>
        );
    }

    render () {
        if (this.state.loading) {
            return (
                <div>{this.i18n("isLoading")}</div>
            );
        }
        const keyboard = this.state.keyboard;
        const keyboardClass = (
            keyboard
            ? "px-2 bg-blue-600 hover:bg-blue-700 focus:outline-none"
            : "px-2 bg-gray-400 hover:bg-gray-600 focus:outline-none"
        );
        const lat = abIsLatin(this.state.abKey);
        return (
            <div className="flex">
                <div className="md:py-6 lg:max-w-6xl" onClick={this.onBgClick}>
                    <div className="px-6 py-4 text-3xl lg:text-base text-gray-700 lg:max-w-3xl">
                        <p>{this.i18n("useFormToFindVerbConj")}</p>
                    </div>
                    <form onSubmit={this.onSubmit} className="px-3 py-2 flex flex-col lg:flex-row">
                        <div className="lg:px-2">
                            <div className="relative">
                                <div className="flex flex-row">
                                    <input
                                        ref="verbInput"
                                        type="text"
                                        size="20"
                                        maxLength="100"
                                        value={this.state.lastEntered}
                                        onChange={this.onChange}
                                        onKeyDown={this.onKeyDown}
                                        placeholder={this.i18n("hintEnterVerb")}
                                        className="shadow appearance-none border rounded w-full p-2 text-4xl lg:text-2xl text-gray-700 focus:outline-none focus:shadow-outline"
                                        autoFocus />
                                    <button
                                        type="button"
                                        onClick={this.onKeyboardClick}
                                        className={keyboardClass}>
                                        <img src="/keyboard.svg" alt="keyboard show or hide" className="h-12" />
                                    </button>
                                </div>
                                {this.renderSuggestions()}
                            </div>
                            {this.renderExampleVerbs()}
                        </div>
                        <div className="flex flex-row justify-between">
                            {this.renderSentenceTypeToggle()}
                            <button
                                className="bg-blue-500 hover:bg-blue-700 text-white text-4xl lg:text-2xl uppercase mb-6 font-bold px-4 rounded focus:outline-none focus:shadow-outline"
                                type="submit">
                                {this.i18n("buttonSubmit")}
                            </button>
                        </div>
                    </form>
                    {this.renderKeyboard(keyboard, lat)}
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