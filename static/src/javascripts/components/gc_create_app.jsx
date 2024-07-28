import React from "react";
import { closeButton } from "./close_button";
import { TransDirection, buildDirectionByKeyMap } from "../lib/gc";
import { i18n } from "../lib/i18n";

const DIRECTIONS = [
    new TransDirection("kk", "ru"),
    new TransDirection("kk", "en"),
];

const DIRECTION_BY_KEY = buildDirectionByKeyMap(DIRECTIONS);

/**
 * props:
 * - lang
 */
class GcCreateApp extends React.Component {
    constructor(props) {
        super(props);

        this.onDirectionChange = this.onDirectionChange.bind(this);
        this.onDirectionReset = this.onDirectionReset.bind(this);

        this.state = this.defaultState();
    }

    makeState(direction) {
        return {
            direction: direction,
        };
    }

    defaultState() {
        return this.makeState(
            /* direction */ null,
        );
    }

    i18n(key) {
        return i18n(key, this.props.lang);
    }

    onDirectionChange(event) {
        let key = event.target.value;
        console.log(`onDirectionChange: key ${key}`);
        let direction = DIRECTION_BY_KEY[key];
        if (direction) {
            this.setState({ direction });
        }
    }

    onDirectionReset(event) {
        event.preventDefault();
        this.setState(this.defaultState());
    }

    renderDirectionPart(direction) {
        if (direction == null) {
            let selectOptions = [
                <option key="start" value="">{this.i18n("select")}</option>
            ];
            for (let d of DIRECTIONS) {
                const key = d.toKey();
                selectOptions.push(
                    <option key={key} value={key}>
                        {this.i18n(key)}
                    </option>
                );
            }
            return (
                <form className="flex flex-row w-full bg-gray-200 rounded">
                    <p className="px-4 py-4 text-2xl">
                        {this.i18n("transDirection")}:
                    </p>
                    <select
                        required
                        onChange={this.onDirectionChange}
                        value=""
                        className="text-gray-800 text-2xl mx-2 px-4 py-2">
                        {selectOptions}
                    </select>
                </form>
            );
        } else {
            const key = direction.toKey();
            return (
                <div className="flex flex-row justify-between w-full bg-gray-200 rounded">
                    <span className="px-4 py-4 text-2xl">
                        {this.i18n("transDirection")}:
                    </span>
                    <span className="py-4 text-2xl">
                        {this.i18n(key)}
                    </span>
                    {closeButton({ onClick: this.onDirectionReset })}
                </div>
            );
        }
    }

    renderForm() {
        const direction = this.state.direction;
        return (
            <div>
                {this.renderDirectionPart(direction)}
            </div>
        )
    }

    render() {
        return (
            <div>
                <h1 className="my-4 text-center text-4xl italic text-gray-600">
                    {this.i18n("titleGcCreate")}
                </h1>
                {this.renderForm()}
            </div>
        );
    }
}


export default GcCreateApp;