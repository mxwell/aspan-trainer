import React from "react";
import { TransDirection, buildDirectionByKeyMap } from "../lib/gc";
import { i18n } from "../lib/i18n";
import { trimAndLowercase, validateDictWord } from "../lib/input_validation";
import { gcAddReview, gcAddWord, gcGetUntranslated, gcGetWords, getCurrentGcToken } from "../lib/gc_api";
import GcWordStart from "./gc_word_start";
import GcWordSelection from "./gc_word_selection";
import GcWordCreate from "./gc_word_create";
import { buildGcCreatePrefilledUrl, buildGcLoginUrl, buildGcReviewsUrl, parseParams } from "../lib/url";
import { editButton } from "./edit_button";

const DIRECTIONS = [
    new TransDirection("kk", "ru"),
    new TransDirection("kk", "en"),
];

const DIRECTION_BY_KEY = buildDirectionByKeyMap(DIRECTIONS);

function checkIfDuplicate(existingWords, pos, excVerb, comment) {
    for (let word of existingWords) {
        const duplicate = (
            word.pos == pos
            && word.exc_verb == excVerb
            && word.comment == comment
        );
        if (duplicate) {
            console.log(`checkIfDuplicate: duplicate: pos ${pos}, excVerb ${excVerb}, comment ${comment}`);
            return true;
        }
    }
    return false;
}

function orderTranslations(foundTranslations, preferredTranslationPos) {
    if (foundTranslations == null) {
        return null;
    }
    let head = [];
    let tail = [];
    for (let translation of foundTranslations) {
        if (translation.pos == preferredTranslationPos) {
            head.push(translation);
        } else {
            tail.push(translation);
        }
    }
    return head.concat(tail);
}

/**
 * props:
 * - lang
 */
class GcCreateApp extends React.Component {
    constructor(props) {
        super(props);

        this.onDirectionSelect = this.onDirectionSelect.bind(this);
        this.onDirectionReset = this.onDirectionReset.bind(this);
        this.onWordChange = this.onWordChange.bind(this);
        this.handleGetUntranslatedResponse = this.handleGetUntranslatedResponse.bind(this);
        this.handleGetUntranslatedError = this.handleGetUntranslatedError.bind(this);
        this.handleGetWordsResponse = this.handleGetWordsResponse.bind(this);
        this.handleGetWordsError = this.handleGetWordsError.bind(this);
        this.onWordSubmit = this.onWordSubmit.bind(this);
        this.onWordReset = this.onWordReset.bind(this);
        this.onWordSelect = this.onWordSelect.bind(this);
        this.onWordSelectionSubmit = this.onWordSelectionSubmit.bind(this);
        this.onWordSelectionReset = this.onWordSelectionReset.bind(this);
        this.onNewWordPosSelect = this.onNewWordPosSelect.bind(this);
        this.onNewWordCommentChange = this.onNewWordCommentChange.bind(this);
        this.onExcVerbChange = this.onExcVerbChange.bind(this);
        this.onNewWordSubmit = this.onNewWordSubmit.bind(this);
        this.onNewWordReset = this.onNewWordReset.bind(this);

        this.onTranslationChange = this.onTranslationChange.bind(this);
        this.onTranslationSubmit = this.onTranslationSubmit.bind(this);
        this.onTranslationReset = this.onTranslationReset.bind(this);
        this.onTranslationSelect = this.onTranslationSelect.bind(this);
        this.onTranslationSelectionSubmit = this.onTranslationSelectionSubmit.bind(this);
        this.onTranslationSelectionReset = this.onTranslationSelectionReset.bind(this);
        this.onNewTranslationPosSelect = this.onNewTranslationPosSelect.bind(this);
        this.onNewTranslationCommentChange = this.onNewTranslationCommentChange.bind(this);
        this.onNewTranslationSubmit = this.onNewTranslationSubmit.bind(this);
        this.onNewTranslationReset = this.onNewTranslationReset.bind(this);

        this.onReferenceChange = this.onReferenceChange.bind(this);

        this.handleAddWordResponse = this.handleAddWordResponse.bind(this);
        this.handleAddWordError = this.handleAddWordError.bind(this);
        this.handleAddReviewResponse = this.handleAddReviewResponse.bind(this);
        this.handleAddReviewError = this.handleAddReviewError.bind(this);
        this.onCreate = this.onCreate.bind(this);
        this.onRestart = this.onRestart.bind(this);

        this.state = this.readUrlState() || this.defaultState();
    }

    makeState(direction, lastEnteredWord, invalidWord) {
        return {
            untranslated: null,
            direction: direction,
            word: null,
            lastEnteredWord: lastEnteredWord,
            invalidWord: invalidWord,
            foundWords: null,
            preselectedWordId: null,
            selectedWordId: null,
            preselectedPos: null,
            selectedPos: null,
            comment: "",
            preExcVerb: false,
            excVerb: null,
            translation: null,
            lastEnteredTranslation: "",
            invalidTranslation: false,
            foundTranslations: null,
            preselectedTranslationId: null,
            selectedTranslationId: null,
            preselectedTranslationPos: null,
            selectedTranslationPos: null,
            translationComment: "",
            reference: "",
            creating: false,
            reviewId: null,
            error: false,
            createError: null,
        };
    }

    defaultState() {
        return this.makeState(
            /* direction */ null,
            /* lastEnteredWord */ "",
            /* invalidWord */ false,
        );
    }

    readUrlState() {
        const token = getCurrentGcToken();
        if (token == null) {
            this.redirToLogin();
            return;
        }

        const params = parseParams();
        const src = params.src;
        const dst = params.dst;
        if (src == null || dst == null) {
            this.startGetUntranslated();
            return null;
        }
        const dirKey = `${src}${dst}`;
        const direction = DIRECTION_BY_KEY[dirKey];
        if (direction == null) {
            console.log(`readUrlState: invalid direction ${dirKey}`);
            return null;
        }
        const word = params.w;
        if (word != null && word.length > 64) {
            console.log(`readUrlState: too long word in params`);
            return null;
        }
        const invalidWord = !validateDictWord(word, src);
        return this.makeState(
            direction,
            /* lastEnteredWord */ word,
            invalidWord,
        );
    }

    i18n(key) {
        return i18n(key, this.props.lang);
    }

    redirToLogin() {
        const returnPath = window.location.pathname + window.location.search;
        const url = buildGcLoginUrl(this.props.lang, returnPath);
        window.location.href = url;
    }

    isLocked() {
        return (
            this.state.creating
            || this.state.reviewId != null
            || this.state.createError != null
        );
    }

    onDirectionSelect(index) {
        const direction = DIRECTIONS[index];
        if (direction == null) {
            console.log("onDirectionSelect: null direction");
            return;
        }
        this.setState({ direction });
    }

    onDirectionReset(event) {
        event.preventDefault();
        this.setState(this.defaultState());
    }

    onWordChange(lastEnteredWord) {
        const direction = this.state.direction;
        const s = trimAndLowercase(lastEnteredWord);
        const invalidWord = !validateDictWord(s, direction.src);
        this.setState({ lastEnteredWord, invalidWord });
    }

    async handleGetUntranslatedResponse(context, responseJsonPromise) {
        const response = await responseJsonPromise;
        const message = response.message;
        if (message != "ok") {
            console.log(`handleGetUntranslatedResponse: error message: ${message}`);
            return;
        }
        const untranslated = response.words;
        this.setState({ untranslated });
    }

    async handleGetUntranslatedError(context, responseTextPromise) {
        let responseText = await responseTextPromise;
        console.log(`Got error from get_untranslated: ${responseText}`);
    }

    startGetUntranslated() {
        gcGetUntranslated(
            "ru",
            this.handleGetUntranslatedResponse,
            this.handleGetUntranslatedError,
            {}
        );
    }

    async handleGetWordsResponse(context, responseJsonPromise) {
        const response = await responseJsonPromise;
        const words = response.words;
        console.log(`Got words: ${JSON.stringify(words)}`);
        const selected = words.length == 0 ? 0 : null;
        if (context.isTranslation == true) {
            const foundTranslations = orderTranslations(words, this.getPreferredTranslationPos());
            this.setState({ foundTranslations: foundTranslations, selectedTranslationId: selected })
        } else {
            this.setState({ foundWords: words, selectedWordId: selected });
        }
    }

    async handleGetWordsError(context, responseTextPromise) {
        let responseText = await responseTextPromise;
        console.log(`Got error from get_words: ${responseText}, params were: ${context.w}, ${context.word}, ${context.lang}, ${context.isTranslation}`);
        const error = true;
        this.setState({ error });
    }

    startGetWords(word, lang, isTranslation) {
        gcGetWords(
            word,
            lang,
            /* withTranslations */ !isTranslation,
            this.handleGetWordsResponse,
            this.handleGetWordsError,
            {
                word,
                lang,
                isTranslation,
            }
        );
    }

    onWordSubmit(event) {
        event.preventDefault();
        const lastEntered = this.state.lastEnteredWord;
        const word = trimAndLowercase(lastEntered);
        if (word.length == 0) {
            console.log(`onWordSubmit: empty input [${lastEntered}]`)
            return;
        }
        this.startGetWords(word, this.state.direction.src, false);
        this.setState({ word });
    }

    onWordReset(event) {
        event.preventDefault();
        if (this.isLocked()) {
            console.log("Ignoring click while form is locked");
            return;
        }
        this.setState({
            word: null,
            foundWords: null,
            preselectedWordId: null,
            selectedWordId: null,
            preselectedPos: null,
            selectedPos: null,
            preExcVerb: null,
            excVerb: null,
            selectedTranslationId: null,
            error: null,
        });
    }

    onWordSelect(index) {
        const preselectedWordId = index;
        this.setState({ preselectedWordId });
    }

    onWordSelectionSubmit(event) {
        event.preventDefault();
        const selectedWordId = this.state.preselectedWordId;
        this.setState({ selectedWordId });
    }

    onWordSelectionReset(event) {
        event.preventDefault();
        if (this.isLocked()) {
            console.log("Ignoring click while form is locked");
            return;
        }
        this.setState({
            selectedWordId: null,
            preselectedPos: null,
            selectedPos: null,
            preExcVerb: null,
            excVerb: null,
            selectedTranslationId: null,
        });
    }

    onNewWordPosSelect(pos) {
        const preselectedPos = pos;
        this.setState({ preselectedPos });
    }

    onNewWordCommentChange(event) {
        let comment = event.target.value;
        this.setState({ comment });
    }

    onExcVerbChange(event) {
        const preExcVerb = event.target.checked;
        this.setState({ preExcVerb });
    }

    onNewWordSubmit(event) {
        event.preventDefault();
        const selectedPos = this.state.preselectedPos;
        const excVerb = selectedPos == "VERB" && this.state.preExcVerb;
        if (checkIfDuplicate(this.state.foundWords, selectedPos, excVerb, this.state.comment)) {
            return;
        }
        this.setState({ selectedPos, excVerb });
    }

    onNewWordReset(event) {
        event.preventDefault();
        if (this.isLocked()) {
            console.log("Ignoring click while form is locked");
            return;
        }
        this.setState({
            preselectedPos: null,
            selectedPos: null,
            preExcVerb: null,
            excVerb: null,
            selectedTranslationId: null,
            selectedTranslationPos: null,
        });
    }

    onTranslationChange(lastEnteredTranslation) {
        const direction = this.state.direction;
        const s = trimAndLowercase(lastEnteredTranslation);
        const invalidTranslation = !validateDictWord(s, direction.dst);
        this.setState({ lastEnteredTranslation, invalidTranslation });
    }

    onTranslationSubmit(event) {
        event.preventDefault();
        const lastEntered = this.state.lastEnteredTranslation;
        const translation = trimAndLowercase(lastEntered);
        if (translation.length == 0) {
            console.log(`onTranslationSubmit: empty input [${lastEntered}]`)
            return;
        }
        this.startGetWords(translation, this.state.direction.dst, true);
        this.setState({ translation });
    }

    onTranslationReset(event) {
        event.preventDefault();
        if (this.isLocked()) {
            console.log("Ignoring click while form is locked");
            return;
        }
        this.setState({
            translation: null,
            foundTranslations: null,
            preselectedTranslationId: null,
            selectedTranslationId: null,
            preselectedTranslationPos: null,
            selectedTranslationPos: null,
            error: null,
        });
    }

    onTranslationSelect(index) {
        const preselectedTranslationId = index;
        this.setState({ preselectedTranslationId });
    }

    onTranslationSelectionSubmit(event) {
        event.preventDefault();
        const selectedTranslationId = this.state.preselectedTranslationId;
        this.setState({ selectedTranslationId });
    }

    onTranslationSelectionReset(event) {
        event.preventDefault();
        if (this.isLocked()) {
            console.log("Ignoring click while form is locked");
            return;
        }
        this.setState({
            selectedTranslationId: null,
            preselectedTranslationPos: null,
            selectedTranslationPos: null,
        });
    }

    onNewTranslationPosSelect(pos) {
        const preselectedTranslationPos = pos;
        this.setState({ preselectedTranslationPos });
    }

    onNewTranslationCommentChange(event) {
        let translationComment = event.target.value;
        this.setState({ translationComment });
    }

    getWordInfo(foundWords, selectedWordId) {
        if (foundWords != null && selectedWordId != null && selectedWordId < foundWords.length) {
            return foundWords[selectedWordId];
        }
        return null;
    }

    getTranslatedWordIdsFromWordInfo(wordInfo) {
        if (wordInfo != null && wordInfo.translated_word_ids != null) {
            return wordInfo.translated_word_ids;
        }
        return [];
    }

    getReviewWordIdsFromWordInfo(wordInfo) {
        if (wordInfo != null && wordInfo.review_word_ids != null) {
            return wordInfo.review_word_ids;
        }
        return [];
    }

    getPreferredTranslationPos() {
        const foundWords = this.state.foundWords;
        const selectedWordId = this.state.selectedWordId;
        const selectedPos = this.state.selectedPos;
        const wordInfo = this.getWordInfo(foundWords, selectedWordId);
        if (wordInfo != null) {
            return wordInfo.pos;
        }
        return selectedPos;
    }

    onNewTranslationSubmit(event) {
        event.preventDefault();
        const selectedTranslationPos = this.state.preselectedTranslationPos || this.getPreferredTranslationPos();
        if (checkIfDuplicate(this.state.foundTranslations, selectedTranslationPos, false, this.state.translationComment)) {
            return;
        }
        this.setState({ selectedTranslationPos });
    }

    onNewTranslationReset(event) {
        event.preventDefault();
        if (this.isLocked()) {
            console.log("Ignoring click while form is locked");
            return;
        }
        this.setState({
            preselectedTranslationPos: null,
            selectedTranslationPos: null,
        });
    }

    onReferenceChange(event) {
        const reference = event.target.value;
        this.setState({ reference });
    }

    async handleAddReviewResponse(context, responseJsonPromise) {
        const response = await responseJsonPromise;
        const message = response.message;
        if (message != "ok") {
            console.log(`handleAddReviewResponse: error message: ${message}`);
            this.setCreateError(context, null);
            return;
        }
        const reviewId = response.review_id;
        if (reviewId == null) {
            console.log("handleAddReviewResponse: null reviewId");
            this.setCreateError(context, null);
            return;
        }
        console.log(`Created with ID: ${reviewId}`);
        const creating = false;
        this.setState({ creating, reviewId });
    }

    async handleAddReviewError(context, responseTextPromise) {
        let responseText = await responseTextPromise;
        console.log(`Got error from add_review: ${responseText}`);
        try {
            const response = JSON.parse(responseText);
            if (response.message == "duplicate") {
                this.setCreateError(context, this.i18n("translationAlreadyExists"));
                return;
            }
        } catch (e) {
            console.log("handleAddReviewError: failed to parse as JSON");
        }
        this.setCreateError(context, null);
    }

    startAddReview(wordId, translationWordId, reference) {
        console.log(`startAddReview: ${wordId} -> ${translationWordId}, '${reference}'`);
        gcAddReview(
            wordId,
            translationWordId,
            reference,
            this.handleAddReviewResponse,
            this.handleAddReviewError,
            {},
        );
    }

    createErrorMessage(context) {
        const isTranslation = context.isTranslation;
        if (isTranslation == true) {
            return "failed to store translation word"
        } else if (isTranslation == false) {
            return "failed to store original word";
        }
        return "failed to store translation";
    }

    setCreateError(context, errorMessage) {
        const creating = false;
        const createError = errorMessage || this.createErrorMessage(context)
        this.setState({ creating, createError });
    }

    async handleAddWordResponse(context, responseJsonPromise) {
        const response = await responseJsonPromise;
        const message = response.message;
        if (message != "ok") {
            console.log(`handleAddWordResponse: error message: ${message}, ctx: ${context.isTranslation}`);
            this.setCreateError(context, null);
            return;
        }
        const wordId = response.word_id;
        if (wordId == null) {
            console.log("handleAddWordResponse: null wordId");
            this.setCreateError(context, null);
            return;
        }
        console.log(`handleAddWordResponse: wordId ${wordId}`);
        if (context.isTranslation == true) {
            const srcWordId = context.srcWordId;
            const reference = context.reference;
            if (srcWordId == null) {
                console.log("handleAddWordResponse: null srcWordId");
                this.setCreateError(context, null);
                return;
            }
            this.startAddReview(srcWordId, wordId, reference);
        } else {
            this.createTranslationWordIfNeeded(wordId);
        }
    }

    async handleAddWordError(context, responseTextPromise) {
        let responseText = await responseTextPromise;
        console.log(`Got error from add_word: ${responseText}, ctx: ${context.isTranslation}`);
        this.setCreateError(context, null);
    }

    startAddWord(word, pos, excVerb, lang, comment, context) {
        gcAddWord(
            word,
            pos,
            excVerb,
            lang,
            comment,
            this.handleAddWordResponse,
            this.handleAddWordError,
            context,
        );
    }

    createTranslationWordIfNeeded(wordId) {
        console.log(`createTranslationWordIfNeeded: wordId ${wordId}`);
        const foundTranslations = this.state.foundTranslations;
        const selectedTranslationId = this.state.selectedTranslationId;
        const reference = this.state.reference;
        if (selectedTranslationId < foundTranslations.length) {
            this.startAddReview(wordId, foundTranslations[selectedTranslationId].word_id, reference);
        } else {
            this.startAddWord(
                this.state.translation,
                this.state.selectedTranslationPos,
                /* excVerb */ false,
                this.state.direction.dst,
                this.state.translationComment,
                {
                    isTranslation: true,
                    srcWordId: wordId,
                    reference: reference,
                }
            );
        }
    }

    createWordIfNeeded() {
        const foundWords = this.state.foundWords;
        const selectedWordId = this.state.selectedWordId;
        if (selectedWordId < foundWords.length) {
            this.createTranslationWordIfNeeded(foundWords[selectedWordId].word_id);
        } else {
            this.startAddWord(
                this.state.word,
                this.state.selectedPos,
                this.state.excVerb,
                this.state.direction.src,
                this.state.comment,
                {
                    isTranslation: false,
                }
            );
        }
    }

    onCreate(event) {
        event.preventDefault();
        if (this.state.creating) {
            console.log("onCreate: ignoring click while performing creation");
            return;
        }
        const creating = true;
        this.setState({ creating });
        this.createWordIfNeeded();
    }

    onRestart(event) {
        event.preventDefault();
        this.setState(this.makeState(this.state.direction, /* lastEnteredWord */ "", /* invalidWord */ false));
    }

    renderUntranslated() {
        const untranslated = this.state.untranslated;
        if (untranslated == null || untranslated.length == 0) {
            return null;
        }
        let buttons = [];
        for (let word of untranslated) {
            const url = buildGcCreatePrefilledUrl(word, "kk", "ru", this.props.lang);
            buttons.push(
                <a href={url}
                    className=""
                    key={buttons.length}>
                    <button className="border-4 hover:bg-gray-100 text-gray-600 text-3xl w-full my-2 p-4 rounded-2xl">
                        {word}
                    </button>
                </a>
            );
        }
        return (
            <div className="flex flex-col mt-10">
                <h3 className="my-4 text-center text-3xl italic text-gray-600">
                    {this.i18n("orAddTranslationToRu")}
                </h3>
                {buttons}
            </div>
        );
    }

    renderDirectionPart(direction) {
        if (direction == null) {
            let buttons = [];
            for (let index in DIRECTIONS) {
                const d = DIRECTIONS[index];
                const key = d.toFullKey();
                const title = this.i18n(key);
                const colors = (
                    index % 2 == 0
                    ? "bg-blue-500 hover:bg-blue-700"
                    : "bg-indigo-500 hover:bg-indigo-700"
                )
                buttons.push(
                    <button
                        className={`${colors} text-white text-xl m-2 p-4 w-1/2 rounded focus:outline-none focus:shadow-outline`}
                        onClick={(e) => { this.onDirectionSelect(index) }}
                        key={buttons.length}>
                        {title}
                    </button>
                );
            }
            return (
                <div>
                    <div className="my-2 p-2 w-full flex flex-col bg-gray-200 rounded">
                        <h3 className="my-2 text-center text-2xl">
                            {this.i18n("transDirection")}:
                        </h3>
                        <div className="flex flex-row w-full">
                            {buttons}
                        </div>
                    </div>
                    {this.renderUntranslated()}
                </div>
            );
        } else {
            const key = direction.toKey();
            return (
                <div className="my-2 flex flex-row justify-between w-full bg-gray-200 rounded">
                    <span className="px-4 py-4 text-2xl">
                        {this.i18n("transDirection")}:
                    </span>
                    <span className="py-4 text-2xl">
                        {this.i18n(key)}
                    </span>
                    {editButton({ onClick: this.onDirectionReset })}
                </div>
            );
        }
    }

    renderWordPart(direction, word) {
        if (direction == null) {
            return null;
        }
        return (
            <GcWordStart
                lang={this.props.lang}
                wordLang={direction.src}
                lastEntered={this.state.lastEnteredWord}
                invalidWord={this.state.invalidWord}
                word={word}
                srcWordId={null}
                changeCallback={this.onWordChange}
                submitCallback={this.onWordSubmit}
                resetCallback={this.onWordReset} />
        );
    }

    renderWordSelection(word, foundWords, selectedWordId) {
        if (word == null) {
            return null;
        }
        return (
            <GcWordSelection
                lang={this.props.lang}
                foundWords={foundWords}
                selectedWordId={selectedWordId}
                translatedWordIds={[]}
                reviewWordIds={[]}
                selectCallback={this.onWordSelect}
                submitCallback={this.onWordSelectionSubmit}
                resetCallback={this.onWordSelectionReset} />
        );
    }

    renderNewWordDetails(direction, foundWords, selectedWordId, selectedPos, comment, excVerb) {
        if (foundWords == null || selectedWordId != foundWords.length) {
            return null;
        }
        return (
            <GcWordCreate
                lang={this.props.lang}
                wordLang={direction.src}
                preferredPos={null}
                selectedPos={selectedPos}
                comment={comment}
                excVerb={excVerb}
                selectCallback={this.onNewWordPosSelect}
                commentCallback={this.onNewWordCommentChange}
                excVerbCallback={this.onExcVerbChange}
                submitCallback={this.onNewWordSubmit}
                resetCallback={this.onNewWordReset} />
        );
    }

    renderTranslationPart(readyForTranslation, srcWordId, direction, translation) {
        if (!readyForTranslation) {
            return null;
        }
        return (
            <GcWordStart
                lang={this.props.lang}
                wordLang={direction.dst}
                lastEntered={this.state.lastEnteredTranslation}
                invalidWord={this.state.invalidTranslation}
                word={translation}
                srcWordId={srcWordId}
                changeCallback={this.onTranslationChange}
                submitCallback={this.onTranslationSubmit}
                resetCallback={this.onTranslationReset} />
        );
    }

    renderTranslationSelection(readyForTranslation, translation, foundTranslations, selectedTranslationId, translatedWordIds, reviewWordIds) {
        if (!readyForTranslation || translation == null) {
            return null;
        }
        return (
            <GcWordSelection
                lang={this.props.lang}
                foundWords={foundTranslations}
                selectedWordId={selectedTranslationId}
                translatedWordIds={translatedWordIds}
                reviewWordIds={reviewWordIds}
                selectCallback={this.onTranslationSelect}
                submitCallback={this.onTranslationSelectionSubmit}
                resetCallback={this.onTranslationSelectionReset} />
        );
    }

    renderTranslationCreate(readyForTranslation, direction, foundTranslations, selectedTranslationId, preferredPos, selectedTranslationPos, translationComment) {
        if (!readyForTranslation || foundTranslations == null || selectedTranslationId != foundTranslations.length) {
            return null;
        }
        return (
            <GcWordCreate
                lang={this.props.lang}
                wordLang={direction.dst}
                preferredPos={preferredPos}
                selectedPos={selectedTranslationPos}
                comment={translationComment}
                excVerb={false}
                selectCallback={this.onNewTranslationPosSelect}
                commentCallback={this.onNewTranslationCommentChange}
                excVerbCallback={() => {}}
                submitCallback={this.onNewTranslationSubmit}
                resetCallback={this.onNewTranslationReset} />
        );
    }

    renderCreateButton(readyToCreate) {
        if (!readyToCreate) {
            return null;
        }
        if (this.state.creating) {
            return (
                <div
                    className="my-4 w-full text-2xl text-center italic">
                    {this.i18n("creatingReview")}
                </div>
            );
        }
        const reviewId = this.state.reviewId;
        if (reviewId != null) {
            return (
                <div className="w-full flex flex-col">
                    <p
                        className="my-4 text-2xl text-green-600 text-center italic">
                        {this.i18n("createdReviewTempl")(reviewId)}
                    </p>
                    <form
                        onSubmit={this.onRestart}
                        className="flex flex-row justify-center">
                        <button
                            type="submit"
                            className="bg-blue-500 hover:bg-blue-700 p-2 rounded focus:outline-none focus:shadow-outline"
                            autoFocus>
                            <img src="/restart.svg" alt="restart button" />
                        </button>
                    </form>
                    <a href={buildGcReviewsUrl(0, /* dir */ null, /* approvesMin */ null, this.props.lang)}
                        className="my-4 text-xl text-green-400 text-center underline">{this.i18n("titleReviews")}
                    </a>
                </div>
            );
        }
        const createError = this.state.createError;
        if (createError != null) {
            return (
                <div
                    className="my-4 w-full text-2xl text-center text-red-600 italic">
                    {this.i18n("service_error")}:&nbsp;{createError}
                </div>
            );
        }
        return (
            <form
                onSubmit={this.onCreate}
                className="my-4 flex flex-col w-full bg-gray-200 rounded">
                <div className="m-2 p-2 flex flex-col border-2 rounded">
                    <div className="flex flex-row justify-between">
                        <span className="py-2 text-xl">
                            {this.i18n("reference")}:
                        </span>
                        <input
                            type="text"
                            size="32"
                            maxLength="128"
                            value={this.state.reference}
                            placeholder={this.i18n("refPlaceHolder")}
                            onChange={this.onReferenceChange}
                            className="shadow appearance-none border rounded mx-2 p-2 text-xl text-gray-700 focus:outline-none focus:shadow-outline"
                            autoFocus
                            />
                    </div>
                    <p className="text-gray-700 text-xs">
                        {this.i18n("referenceNote")}
                    </p>
                </div>
                <div className="my-2 flex flex-row justify-center">
                    <button
                        type="submit"
                        className="bg-blue-500 hover:bg-blue-700 text-white text-2xl font-bold px-6 py-2 rounded focus:outline-none focus:shadow-outline">
                        {this.i18n("createReview")}
                    </button>
                </div>
            </form>
        );
    }

    renderForm() {
        if (this.state.error) {
            return (
                <p className="text-red-600">{this.i18n("service_error")}</p>
            );
        }

        const direction = this.state.direction;
        const word = this.state.word;
        const foundWords = this.state.foundWords;
        const selectedWordId = this.state.selectedWordId;
        const selectedPos = this.state.selectedPos;
        const comment = this.state.comment;
        const excVerb = this.state.excVerb;
        const readyForTranslation = (
            foundWords != null
            && selectedWordId != null
            && (selectedWordId < foundWords.length || selectedPos != null)
        );
        const srcWordInfo = this.getWordInfo(foundWords, selectedWordId);
        const srcWordId = (
            srcWordInfo != null
            ? srcWordInfo.word_id
            : null
        );
        const translation = this.state.translation;
        const foundTranslations = this.state.foundTranslations;
        const selectedTranslationId = this.state.selectedTranslationId;
        const translatedWordIds = this.getTranslatedWordIdsFromWordInfo(srcWordInfo);
        const reviewWordIds = this.getReviewWordIdsFromWordInfo(srcWordInfo);
        const preferredTranslationPos = this.getPreferredTranslationPos();
        const selectedTranslationPos = this.state.selectedTranslationPos;
        const translationComment = this.state.translationComment;
        const readyToCreate = (
            readyForTranslation
            && foundTranslations != null
            && selectedTranslationId != null
            && (selectedTranslationId < foundTranslations.length || selectedTranslationPos != null)
        );
        return (
            <div>
                {this.renderDirectionPart(direction)}
                {this.renderWordPart(direction, word)}
                {this.renderWordSelection(word, foundWords, selectedWordId)}
                {this.renderNewWordDetails(direction, foundWords, selectedWordId, selectedPos, comment, excVerb)}
                {this.renderTranslationPart(readyForTranslation, srcWordId, direction, translation)}
                {this.renderTranslationSelection(readyForTranslation, translation, foundTranslations, selectedTranslationId, translatedWordIds, reviewWordIds)}
                {this.renderTranslationCreate(readyForTranslation, direction, foundTranslations, selectedTranslationId, preferredTranslationPos, selectedTranslationPos, translationComment)}
                {this.renderCreateButton(readyToCreate)}
            </div>
        );
    }

    render() {
        return (
            <div className="lg:w-1/2">
                <h1 className="my-4 text-center text-4xl italic text-gray-600">
                    {this.i18n("titleGcCreate")}
                </h1>
                <div className="my-4 text-center">
                    <a
                        className="text-xl text-green-600 underline"
                        href="https://youtu.be/BP8qF5gh47o">
                        {this.i18n("videoTutorial")}
                    </a>
                </div>
                {this.renderForm()}
            </div>
        );
    }
}


export default GcCreateApp;