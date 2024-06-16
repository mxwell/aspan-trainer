import React from "react";
import { i18n } from "../lib/i18n";

/**
 * props:
 * - lang
 * - levels: array of GymLevels
 * - callback onSelect(level, action), where action is one of {practice,test}
 */
class GymStart extends React.Component {
    constructor(props) {
        super(props);

        this.onLevelClick = this.onLevelClick.bind(this);

        this.state = {
            selectedLevel: null,
        };
    }

    i18n(key) {
        return i18n(key, this.props.lang);
    }

    onLevelClick(e, selectedLevel) {
        e.preventDefault();
        this.setState({ selectedLevel });
    }

    renderList() {
        let listItems = [];
        for (let i = 0; i < this.props.levels.length; i++) {
            const level = this.props.levels[i];
            const imgSrc = (
                level.available
                ? (
                    level.completed
                    ? "/check_box.svg"
                    : "/check_box_blank.svg"
                )
                : "/check_box_indet.svg"
            );
            listItems.push(
                <li key={i} className="flex flex-row m-2 text-xl">
                    <img src={imgSrc} />
                    <button
                        onClick={(e) => this.onLevelClick(e, i)}
                        >
                        {this.i18n(level.levelKey)}
                    </button>
                </li>
            );
        }
        return (
            <ul>
                {listItems}
            </ul>
        );
    }

    renderActions(gymLevel) {
        if (!gymLevel.available) {
            return (
                <p className="italic text-center">{this.i18n("levelNotAvailableYet")}</p>
            );
        }
        // TODO
        return (
            <div className="flex flex-row justify-evenly">
                <div>
                    <h3>{this.i18n("practice")}</h3>
                </div>
                <div>
                    <h3>{this.i18n("test")}</h3>
                </div>
            </div>
        );
    }

    renderPanel() {
        const levelId = this.state.selectedLevel;
        if (levelId == null) {
            return null;
        }
        if (!(0 <= levelId && levelId < this.props.levels.length)) {
            console.log(`Invalid selectedLevel: ${levelId}`);
            return null;
        }
        const level = this.props.levels[levelId];
        return (
            <div className="border-2 border-black p-4">
                <h2 className="m-4 text-3xl text-center">
                    {this.i18n(level.levelKey)}
                </h2>
                {this.renderActions(level)}
            </div>
        );
    }

    render() {
        return (
            <div>
                <h1 className="m-4 text-4xl text-center">{this.i18n("verbGym")}</h1>
                <p className="m-4 italic">{this.i18n("clickToSelect")}</p>
                {this.renderList()}
                {this.renderPanel()}
            </div>
        );
    }
}

export { GymStart };