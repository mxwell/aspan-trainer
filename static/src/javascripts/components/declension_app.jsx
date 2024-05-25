import React from 'react';
import { buildDeclensionUrl, parseParams } from '../lib/url';
import { i18n } from '../lib/i18n';
import { generateDeclensionTables } from '../lib/declension';
import { PHRASAL_PART_TYPE } from '../lib/aspan';

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

        this.state = this.readUrlState() || this.defaultState();
    }

    makeState(subject, lastEntered, declTables) {
        return {
            subject: subject,
            lastEntered: lastEntered,
            declTables: declTables
        };
    }

    defaultState() {
        return this.makeState("", "", []);
    }

    readUrlState() {
        const params = parseParams();
        const subject = params.subject;
        if (subject == null || subject.length <= 0) {
            return null;
        }
        let declTables = generateDeclensionTables(subject);
        return this.makeState(subject, subject, declTables);
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

    reloadToState(subject) {
        if (subject == null || subject.length <= 0) {
            console.log("Not reloading: empty subject");
            return;
        }
        const url = buildDeclensionUrl(subject, this.props.lang);
        window.location.href = url;
    }

    onSubmit(event) {
        event.preventDefault();
        this.reloadToState(this.state.lastEntered);
    }

    renderExampleForms() {
        // TODO impl.
        return null;
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
            </div>
        );
    }

    render() {
        return (
            <div>
                {this.renderForm()}
                {this.renderDeclTables()}
            </div>
        );
    }
}

export default DeclensionApp;