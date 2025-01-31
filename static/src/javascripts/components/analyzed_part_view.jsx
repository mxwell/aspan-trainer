import React from "react";
import { SENTENCE_TYPES } from "../lib/sentence";
import { i18n, I18N_LANG_RU } from "../lib/i18n";
import { reproduceAdj, reproduceNoun, reproducePronoun, reproduceVerb } from "../lib/analyzer";
import { highlightAdjPhrasal, highlightDeclensionPhrasal, highlightPhrasal } from "../lib/highlight";

function copyToClipboard(text) {
    console.log(`Copying ${text}`);
    navigator.clipboard.writeText(text);
}

/**
 * props:
 * - analyzedPart: AnalyzedPart
 * - grammar: bool
 * - translations: bool
 * - hintCallback: function(cue: string)
 * - lang
 */
class AnalyzedPartView extends React.Component {
    constructor(props) {
        super(props);

        this.onPrev = this.onPrev.bind(this);
        this.onNext = this.onNext.bind(this);

        this.state = { index: 0 };
    }

    i18n(key) {
        return i18n(key, this.props.lang);
    }

    renderWithoutAnalysis(content) {
        return (
            <div
                className="flex flex-col justify-top">
                <div className="text-center text-2xl bg-gray-200 mt-10">
                    <pre>{content}</pre>
                </div>
            </div>
        );
    }

    onPrev(event) {
        event.preventDefault();
        let index = this.state.index;
        if (index > 0) {
            index -= 1;
        }
        this.setState({ index });
    }

    onNext(event) {
        event.preventDefault();
        let index = this.state.index;
        if (index + 1 < this.props.analyzedPart.detectedForms.length) {
            index += 1;
        }
        this.setState({ index });
    }

    getFormNameKey(pos, detectedForm) {
        if (pos == "n" || pos == "p") {
            const septik = detectedForm.septik;
            if (septik != null && septik != "Atau") {
                return `analyzerSeptik_${septik}`;
            }
        } else if (pos == "v") {
            const tense = detectedForm.tense;
            if (tense != null) {
                return `analyzerTense_${tense}`;
            }
        }
        return null;
    }

    highlightDetectedForm(detectedForm) {
        const pos = detectedForm.pos;
        if (pos == "n") {
            const phrasal = reproduceNoun(detectedForm);
            return highlightDeclensionPhrasal(phrasal);
        } else if (pos == "p" && detectedForm.septik != null) {
            const phrasal = reproducePronoun(detectedForm);
            return highlightDeclensionPhrasal(phrasal);
        } else if (pos == "j" && detectedForm.wordgen != null && detectedForm.wordgen.length > 0) {
            const phrasal = reproduceAdj(detectedForm);
            return highlightAdjPhrasal(phrasal);
        } else if (pos == "v") {
            const phrasal = reproduceVerb(detectedForm);
            return highlightPhrasal(phrasal, -1);
        } else {
            return [
                <span key="only">{detectedForm.base}</span>
            ];
        }
    }

    renderBaseWithChevrons(base, index, total) {
        const hasPrev = index > 0;
        const hasNext = index + 1 < total;
        if (!hasPrev && !hasNext) {
            return (
                <strong
                    className="cursor-pointer text-center"
                    onClick={(e) => { copyToClipboard(base); }}>
                    {base}
                </strong>
            );
        }
        const prevButton = (
            hasPrev
            ? (<button className="px-1" onClick={this.onPrev}>&lt;</button>)
            : <span className="px-1 text-white">&lt;</span>
        );
        const nextButton = (
            hasNext
            ? (<button className="px-1" onClick={this.onNext}>&gt;</button>)
            : <span className="px-1 text-white">&gt;</span>
        );
        return (
            <div className="flex flex-row justify-between wider-analyzed-part">
                {prevButton}
                <strong
                    className="cursor-pointer"
                    onClick={(e) => { copyToClipboard(base); }}>
                    {base}
                </strong>
                {nextButton}
            </div>
        );
    }

    renderTranslations(detectedForm) {
        if (!this.props.translations) return null;

        const glosses = this.props.lang == I18N_LANG_RU ? detectedForm.ruGlosses : [];
        if (glosses.length == 0) return null;

        let htmlItems = [];
        for (const gloss of glosses) {
            htmlItems.push(
                <li key={htmlItems.length} className="list-disc list-inside">{gloss}</li>
            );
        }
        return (
            <ul className="mt-4 text-gray-600">
                {htmlItems}
            </ul>
        );
    }

    renderDetails(detectedForm, index, total) {
        if (!this.props.grammar) return null;

        const base = this.renderBaseWithChevrons(detectedForm.base, index, total);
        const pos = detectedForm.pos;
        const posName = this.i18n(`pos_${pos}`);
        const exceptionalClause = (
            detectedForm.excVerb == 1
            ? (<p className="italic">{this.i18n("exceptionVerb")}</p>)
            : null
        );
        const formNameKey = this.getFormNameKey(pos, detectedForm);
        const formElement = (
            formNameKey != null
            ? (<div className="italic flex flex-row">
                <span>{this.i18n(formNameKey)}</span>
                <img
                    src="/info.svg"
                    onClick={(e) => this.props.hintCallback(formNameKey)}
                    className="cursor-pointer px-2" />
            </div>)
            : null
        );
        const negation = (
            detectedForm.sentenceType == SENTENCE_TYPES[1]
            ? <p className="italic">{this.i18n("analyzerNegation")}</p>
            : null
        );
        const grammarPerson = (
            detectedForm.grammarPerson
            ? (<p className="italic">{this.i18n(`analyzer_${detectedForm.grammarPerson}`)}</p>)
            : null
        );
        const grammarNumber = (
            detectedForm.grammarNumber == "Plural"
            ? (<p className="italic">{this.i18n("analyzer_Plural")}</p>)
            : null
        );
        const wordgenNameKey = (
            (detectedForm.wordgen != null && detectedForm.wordgen.length > 0)
            ? `analyzerWordgen_${detectedForm.wordgen}`
            : null
        )
        const wordgen = (
            (wordgenNameKey != null)
            ? (<div className="italic flex flex-row">
                <span>{this.i18n(wordgenNameKey)}</span>
                <img
                    src="/info.svg"
                    onClick={(e) => this.props.hintCallback(wordgenNameKey)}
                    className="cursor-pointer px-2" />
            </div>)
            : null
        );
        const poss = (
            (detectedForm.possPerson != null && detectedForm.possNumber != null)
            ? (<p className="italic">{this.i18n(`analyzerPoss_${detectedForm.possPerson}_${detectedForm.possNumber}`)}</p>)
            : null
        );
        return (
            <div className="flex flex-col border-2 border-gray-300 text-sm p-2">
                {base}
                <p className="">{posName}</p>
                {exceptionalClause}
                {formElement}
                {negation}
                {grammarPerson}
                {grammarNumber}
                {wordgen}
                {poss}
                {this.renderTranslations(detectedForm)}
            </div>
        );
    }

    renderWithAnalysis(detectedForm, index, total) {
        return (
            <div
                className="flex flex-col justify-top">
                <div className="text-center text-2xl bg-gray-200 mt-10">
                    {this.highlightDetectedForm(detectedForm)}
                </div>
                {this.renderDetails(detectedForm, index, total)}
            </div>
        );
    }

    render() {
        const index = this.state.index;
        const analyzedPart = this.props.analyzedPart;
        const detectedForms = analyzedPart.detectedForms;
        const total = detectedForms.length;
        if (index >= total) {
            return this.renderWithoutAnalysis(analyzedPart.token);
        }
        return this.renderWithAnalysis(detectedForms[index], index, total);
    }
}

export {
    AnalyzedPartView,
};