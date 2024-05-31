import React from 'react';
import { buildDeclensionUrl, parseParams } from '../lib/url';
import { i18n } from '../lib/i18n';
import { declensionAlternativeInfo, generateDeclensionTables } from '../lib/declension';
import { PHRASAL_PART_TYPE } from '../lib/aspan';
import { getRandomInt, pickRandom } from '../lib/random';

const PRESET_NOUNS = [
    "алма",
    "ақпарат",
    "ауыз",
    "әйел",
    "дауыс хат",
    "дүкен",
    "кофеұсатқыш",
    "септік",
    "түйме",
    "ыдыс",
];

function pickExamples(exampleCount) {
    if (PRESET_NOUNS.length <= exampleCount) {
        return PRESET_NOUNS;
    }
    let examples = [];
    let remaining = PRESET_NOUNS.length;
    for (let i = 0; i < exampleCount; ++i) {
        let pos = getRandomInt(remaining - 1);
        let index = 0;
        for (let j = 0; j < pos; ++j) {
            while (index < PRESET_NOUNS.length && examples.includes(PRESET_NOUNS[index])) {
                index += 1;
            }
            index += 1;
        }
        while (index < PRESET_NOUNS.length && examples.includes(PRESET_NOUNS[index])) {
            index += 1;
        }
        if (index >= PRESET_NOUNS.length) {
            examples.push(pickRandom(PRESET_NOUNS));
        } else {
            examples.push(PRESET_NOUNS[index]);
            remaining -= 1;
        }
    }
    return examples;
}

function highlightPhrasal(phrasal) {
    let htmlParts = [];
    let parts = phrasal.parts;
    for (let i = 0; i < parts.length; ++i) {
        let part = parts[i];
        let pt = part.partType;
        let partClasses = "";
        // TODO support more part types
        if (pt == PHRASAL_PART_TYPE.NounBase) {
            partClasses = "text-teal-600 font-bold";
        } else if (pt == PHRASAL_PART_TYPE.PluralAffix) {
            partClasses = "text-pink-600 font-bold";
        } else if (pt == PHRASAL_PART_TYPE.PossessiveAffix) {
            partClasses = "text-indigo-600 font-bold";
        } else if (pt == PHRASAL_PART_TYPE.SeptikAffix) {
            partClasses = "text-orange-600 font-bold";
        }
        htmlParts.push(
            <span
                className={partClasses}
                key={htmlParts.length}>
                {part.content}
            </span>
        );
    }
    return htmlParts;
}

/**
 * props:
 * - lang
 */
class DeclensionApp extends React.Component {
    constructor(props) {
        super(props);

        this.onChange = this.onChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.switchBetweenDeclensions = this.switchBetweenDeclensions.bind(this);

        this.state = this.readUrlState() || this.defaultState();
    }

    makeState(subject, declAltInfo, forceAlternative, lastEntered, examples, declTables) {
        return {
            subject: subject,
            declAltInfo: declAltInfo,
            forceAlternative: forceAlternative,
            lastEntered: lastEntered,
            examples: examples,
            declTables: declTables
        };
    }

    defaultState() {
        const examples = pickExamples(2);
        return this.makeState("", null, false, "", examples, []);
    }

    readUrlState() {
        const params = parseParams();
        const subject = params.subject;
        if (subject == null || subject.length <= 0) {
            return null;
        }
        const forceAlternative = params.alternative == "true"
        const declAltInfo = declensionAlternativeInfo(subject);
        let declTables = generateDeclensionTables(subject, forceAlternative);
        return this.makeState(subject, declAltInfo, forceAlternative, subject, [], declTables);
    }

    i18n(key) {
        return i18n(key, this.props.lang);
    }

    changeInputText(lastEntered) {
        this.setState({ lastEntered });
    }

    onChange(event) {
        let lastEntered = event.target.value;
        this.changeInputText(lastEntered);
    }

    reloadToState(subject, forceAlternative) {
        if (subject == null || subject.length <= 0) {
            console.log("Not reloading: empty subject");
            return;
        }
        const url = buildDeclensionUrl(subject, forceAlternative, this.props.lang);
        window.location.href = url;
    }

    onSubmit(event) {
        event.preventDefault();
        this.reloadToState(this.state.lastEntered, false);
    }

    renderExampleForms() {
        if (this.state.lastEntered.length > 0) {
            return null;
        }
        const examples = this.state.examples;
        if (examples.length == 0) {
            return null;
        }
        let items = [];
        items.push(
            <span
                className="px-2 lg:px-1 text-3xl lg:text-lg text-gray-600"
                key={items.length} >
                {this.i18n("examples")}:&nbsp;
            </span>
        );
        for (let i = 0; i < examples.length; ++i) {
            let example = examples[i];
            const link = buildDeclensionUrl(example, false, this.props.lang);
            if (i > 0) {
                items.push(
                    <span
                        className="text-3xl lg:text-lg text-gray-600"
                        key={items.length}>
                        &nbsp;{this.i18n("or")}&nbsp;
                    </span>
                );
            }
            items.push(
                <a
                    className="px-2 lg:px-1 text-3xl lg:text-lg text-blue-600 hover:text-blue-800 visited:text-purple-600"
                    key={items.length}
                    href={link} >
                    {example}
                </a>
            );
        }
        return (
            <div className="mx-2 py-4 lg:py-0">
                {items}
            </div>
        );
    }

    switchBetweenDeclensions(e) {
        e.preventDefault();
        this.reloadToState(this.state.subject, !this.state.forceAlternative);
    }

    renderSwitcher() {
        const declAltInfo = this.state.declAltInfo;
        if (declAltInfo == null) {
            return null;
        }

        let regChecked = null;
        let altChecked = null;
        let regHandler = null;
        let altHandler = null;
        if (this.state.forceAlternative) {
            altChecked = "checked";
            regHandler = this.switchBetweenDeclensions;
        } else {
            regChecked = "checked";
            altHandler = this.switchBetweenDeclensions;
        }

        return (
            <div className="text-3xl lg:text-lg p-5">
                <p className="text-orange-600">{this.i18n("word_two_declensions_templ")(declAltInfo.noun)}</p>
                <fieldset>
                    <div className="my-2">
                        <input type="radio" id="reg" checked={regChecked} onChange={regHandler} />
                        <label
                            className="mx-2"
                            htmlFor="reg">
                            {this.i18n("word_decl_drop_vowel_templ")(declAltInfo.noun)}&nbsp;«<strong>{declAltInfo.dropVowelMeaning}</strong>»
                        </label>
                    </div>
                    <div className="my-2">
                        <input type="radio" id="alt" checked={altChecked} onChange={altHandler} />
                        <label
                            className="mx-2"
                            htmlFor="alt">
                            {this.i18n("word_decl_keep_vowel_templ")(declAltInfo.noun)}&nbsp;«<strong>{declAltInfo.keepVowelMeaning}</strong>»
                        </label>
                    </div>
                </fieldset>
            </div>
        );
    }

    renderForm() {
        return (
            <form onSubmit={this.onSubmit} className="px-3 py-2 flex flex-col">
                <div className="flex">
                    <input
                        type="text"
                        size="20"
                        maxLength="100"
                        value={this.state.lastEntered}
                        onChange={this.onChange}
                        placeholder={this.i18n("hint_enter_word")}
                        className="shadow appearance-none border rounded mx-2 p-2 text-4xl lg:text-2xl text-gray-700 focus:outline-none focus:shadow-outline"
                        autoFocus />
                    <button
                        type="submit"
                        className="bg-blue-500 hover:bg-blue-700 text-white text-4xl font-bold px-4 rounded focus:outline-none focus:shadow-outline">
                        →
                    </button>
                </div>
                {this.renderExampleForms()}
            </form>
        );
    }

    renderTableRows(declTable) {
        let rows = [];
        for (let i = 0; i < declTable.forms.length; ++i) {
            const form = declTable.forms[i];
            const septik = this.i18n(`septik_${form.septik}`);
            // TODO render an alternative form
            rows.push(
                <tr
                    className="border-t-2 text-4xl lg:text-base"
                    key={`row_${rows.length}`} >
                    <td className="italic pr-4">{septik}</td>
                    <td>{highlightPhrasal(form.phrasal)}</td>
                </tr>
            );
        }
        return rows;
    }

    renderIconsRow(icons) {
        if (icons == null || icons.length == 0) {
            return null;
        }

        let items = [];
        for (const icon of icons) {
            items.push(
                <img
                    key={items.length}
                    src={icon}
                    className="m-2 w-32 h-32 lg:w-16 lg:h-16" />
            );
        }
        return (
            <div className="flex justify-center">
                {items}
            </div>
        );
    }

    renderOneTable(declTable) {
        const tableNameKey = declTable.tableNameKey;
        const content = (
            <div className="pb-4 lg:py-6">
                <table className="lg:w-full">
                    <tbody>
                        {this.renderTableRows(declTable)}
                    </tbody>
                </table>
            </div>
        );
        const title = (declTable.tableNameKey == null ? null : (
            <h4
                className="text-5xl lg:text-lg text-red-400">
                {this.i18n(tableNameKey)}
            </h4>
        ));
        return (
            <div className="px-6 flex flex-col" key={tableNameKey}>
                {title}
                {this.renderIconsRow(declTable.icons)}
                {content}
            </div>
        );
    }

    renderDeclTables() {
        const declTables = this.state.declTables;
        if (declTables.length == 0) {
            // TODO picture
            return null;
        }
        let groupedTables = {};
        let groupNames = [];
        for (let i = 0; i < declTables.length; ++i) {
            const declTable = declTables[i];
            const groupNameKey = declTable.groupNameKey;
            const table = this.renderOneTable(declTable);
            if (groupedTables[groupNameKey] == null) {
                groupedTables[groupNameKey] = [];
                groupNames.push(groupNameKey);
            }
            groupedTables[groupNameKey].push(table);
        }
        let groups = [];
        for (let i = 0; i < groupNames.length; ++i) {
            const groupNameKey = groupNames[i];
            if (groupNameKey.length > 0) {
                groups.push(
                    <h3
                        className="px-6 text-5xl lg:text-xl italic text-red-800">
                        {this.i18n(groupNameKey)}
                    </h3>
                );
            }
            const tables = groupedTables[groupNameKey];
            groups.push(
                <div
                    className="py-6 flex sm:flex-col lg:flex-row lg:flex-wrap"
                    key={groupNameKey}>
                    {tables}
                </div>
            );
        }
        return (
            <div>
                <h2 className="px-6 text-3xl lg:text-4xl italic text-gray-600">{`${this.i18n("declension_of")} «${this.state.subject}»`}</h2>
                {groups}
                <div className="m-4">
                    <p className="text-4xl lg:text-base">{this.i18n("altDeclSources")}:</p>
                    <ul>
                        <li className="list-disc mx-4 text-4xl lg:text-base">
                            <a className="text-green-600 underline" href="https://morpher.kz/" target="_blank">Morpher.kz</a>
                        </li>
                        <li className="list-disc mx-4 text-4xl lg:text-base">
                            <a className="text-green-600 underline" href="https://findhow.org/4083-sklonenie-po-padezham-kazaksha.html" target="_blank">FindHow.org</a>
                        </li>
                    </ul>
                </div>
            </div>
        );
    }

    render() {
        return (
            <div>
                {this.renderForm()}
                {this.renderSwitcher()}
                {this.renderDeclTables()}
            </div>
        );
    }
}

export default DeclensionApp;