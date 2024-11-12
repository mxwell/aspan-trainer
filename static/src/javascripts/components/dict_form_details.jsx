import React from "react";
import { i18n } from "../lib/i18n";
import { highlightDeclensionPhrasal, highlightPhrasal } from "../lib/highlight";
import { reproduceNoun, reproduceVerb } from "../lib/analyzer";
import { SENTENCE_TYPES } from "../lib/sentence";

/**
 * props:
 * - detectedForm
 * - lang
 */
class DictFormDetails extends React.Component {
    constructor(props) {
        super(props);

        this.onDetailsClick = this.onDetailsClick.bind(this);

        this.state = { expand: false };
    }

    i18n(key) {
        return i18n(key, this.props.lang);
    }

    onDetailsClick(e) {
        const expand = !this.state.expand;
        this.setState({ expand });
    }

    highlightDetectedForm() {
        const detectedForm = this.props.detectedForm;
        const pos = detectedForm.pos;
        if (pos == "n") {
            const phrasal = reproduceNoun(detectedForm);
            return highlightDeclensionPhrasal(phrasal);
        } else if (pos == "v" && detectedForm.tense != "infinitive") {
            const phrasal = reproduceVerb(detectedForm);
            return highlightPhrasal(phrasal, -1);
        } else {
            return [
                <span key="base">{detectedForm.base}</span>
            ];
        }
    }

    renderFormDetails() {
        if (!this.state.expand) {
            return null;
        }

        const detectedForm = this.props.detectedForm;

        let featureHtmls = [];
        let pos = detectedForm.pos;
        if (pos == "n") {
            const septik = detectedForm.septik;
            if (detectedForm.grammarNumber == "Plural") {
                featureHtmls.push(
                    <li className="list-disc ml-4" key={featureHtmls.length}>
                        {this.i18n("analyzer_Plural")}
                    </li>
                );
            }
            if (detectedForm.grammarPerson) {
                featureHtmls.push(
                    <li className="list-disc ml-4" key={featureHtmls.length}>
                        {this.i18n(`analyzerPoss_${detectedForm.grammarPerson}`)}
                    </li>
                );
            }
            if (septik != null && septik != 0) {
                featureHtmls.push(
                    <li className="list-disc ml-4" key={featureHtmls.length}>
                        {this.i18n(`analyzerSeptik_${septik}`)}
                    </li>
                );
            }
        } else if (pos == "v") {
            if (detectedForm.sentenceType == SENTENCE_TYPES[1]) {
                featureHtmls.push(
                    <li className="list-disc ml-4" key={featureHtmls.length}>
                        {this.i18n("analyzerNegation")}
                    </li>
                );
            }
            const tense = detectedForm.tense;
            if (tense != null && tense != "infinitive") {
                featureHtmls.push(
                    <li className="list-disc ml-4" key={featureHtmls.length}>
                        {this.i18n(`analyzerTense_${tense}`)}
                    </li>
                );
            }
            if (detectedForm.grammarPerson) {
                featureHtmls.push(
                    <li className="list-disc ml-4" key={featureHtmls.length}>
                        {this.i18n(`analyzer_${detectedForm.grammarPerson}`)}
                    </li>
                );
            }
            if (detectedForm.grammarNumber == "Plural") {
                featureHtmls.push(
                    <li className="list-disc ml-4" key={featureHtmls.length}>
                        {this.i18n("analyzer_Plural")}
                    </li>
                );
            }
        }

        if (featureHtmls.length == 0) {
            return null;
        }
        return (
            <ul className="text-3xl lg:text-sm">
                {featureHtmls}
            </ul>
        );
    }

    render() {
        let expandButton = null;
        let formDetails = null;
        if (this.state.expand) {
            formDetails = this.renderFormDetails();
        } else {
            expandButton = (<span
                className="cursor-pointer px-1 lg:text-sm text-gray-600"
                key="button"
                onClick={this.onDetailsClick}>
                [+]
            </span>);
        }
        return (
            <div className="mx-4 flex flex-col">
                <div className="flex flex-row">
                    {this.highlightDetectedForm()}
                    {expandButton}
                </div>
                {formDetails}
            </div>
        );
    }
}

export {
    DictFormDetails,
};