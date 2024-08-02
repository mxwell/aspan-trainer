import React from "react";
import { i18n } from "../lib/i18n";
import { closeButton } from "./close_button";
import { PARTS_OF_SPEECH, ellipsize } from "../lib/gc";

/**
 * props:
 * - lang
 * - wordLang
 * - selectedPos
 * - comment
 * - commentRequired
 * - excVerb
 * - selectCallback
 * - commentCallback
 * - excVerbCallback
 * - submitCallback
 * - resetCallback
 */
class GcWordCreate extends React.Component {
    constructor(props) {
        super(props);
    }

    i18n(key) {
        return i18n(key, this.props.lang);
    }

    renderForm() {
        let radios = [];
        for (let item of PARTS_OF_SPEECH) {
            const hint = this.i18n(`hint${item}`);
            const autoFocus = (
                radios.length == 0
                ? "autoFocus"
                : null
            );
            radios.push(
                <div
                    className="my-2"
                    key={radios.length} >
                    <input
                        type="radio"
                        id={item}
                        onChange={(e) => { this.props.selectCallback(item) }}
                        className="focus:shadow-outline"
                        autoFocus={autoFocus}
                        name="wordPosSelector" />
                    <label
                        className="mx-2"
                        htmlFor={item} >
                        <span className="text-blue-500 italic">
                            {item}
                        </span>
                        <span className="text-sm pl-2">
                            {hint}
                        </span>
                    </label>
                </div>
            );
        }
        const excVerbCheckbox = (
            (this.props.wordLang == "kk")
            ? (<div className="text-xl mx-4">
                <input
                    type="checkbox"
                    id="excVerb"
                    onChange={this.props.excVerbCallback} />
                <label
                    className="mx-2"
                    htmlFor="excVerb">
                    {this.i18n("feVerb")}
                </label>
            </div>)
            : (<span />)
        );
        return (
            <form
                onSubmit={this.props.submitCallback}
                className="my-2 p-2 w-full bg-gray-200 rounded">
                <fieldset className="m-2 flex flex-col border-2 border-gray-600 p-2 rounded text-xl">
                    <legend className="px-2 text-base">{this.i18n("selectPos")}</legend>
                    {radios}
                </fieldset>
                <div className="m-2 p-2 flex flex-col border-2 rounded">
                    <div className="flex flex-row justify-between">
                        <span className="py-2 text-xl">
                            {this.i18n("comment")}:
                        </span>
                        <input
                            type="text"
                            size="20"
                            maxLength="128"
                            value={this.props.comment}
                            onChange={this.props.commentCallback}
                            className="shadow appearance-none border rounded p-2 text-xl text-gray-700 focus:outline-none focus:shadow-outline"
                            />
                    </div>
                    <p className="text-gray-700 text-xs text-right">
                        {this.i18n("commentNote")}
                    </p>
                </div>
                <div className="flex flex-row justify-between">
                    {excVerbCheckbox}
                    <button
                        type="submit"
                        className="bg-blue-500 hover:bg-blue-700 text-white text-4xl font-bold mx-2 px-4 rounded focus:outline-none focus:shadow-outline">
                        →
                    </button>
                </div>
            </form>
        );
    }

    renderPos(pos, excVerb) {
        if (pos) {
            const spanClass = "text-blue-500 text-xl italic";
            if (excVerb > 0) {
                return (<span className={spanClass}>
                    {pos},&nbsp;{this.i18n("feVerb")}
                </span>);
            }
            return (<span className={spanClass}>
                {pos}
            </span>);
        }
        return null;
    }

    render() {
        const selectedPos = this.props.selectedPos;
        const excVerb = this.props.excVerb;
        if (selectedPos == null) {
            return this.renderForm();
        }
        const comment = (
            this.props.comment.length > 0
            ? (<span className="py-4 py-4 text-xl text-gray-700 italic">
                "{ellipsize(this.props.comment)}"
            </span>)
            : null
        );
        return (
            <div className="my-2 flex flex-row justify-between w-full bg-gray-200 rounded">
                <span className="px-4 py-4 text-2xl">
                    {this.renderPos(selectedPos, excVerb)}
                </span>
                {comment}
                {closeButton({ onClick: this.props.resetCallback })}
            </div>
        );
    }
}

export default GcWordCreate;