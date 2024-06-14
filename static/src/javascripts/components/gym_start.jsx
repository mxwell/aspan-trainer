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

        this.state = {
            selectedLevel: null,
        };
    }

    i18n(key) {
        return i18n(key, this.props.lang);
    }

    renderList() {
        let listItems = [];
        for (let i = 0; i < this.props.levels.length; i++) {
            const level = this.props.levels[i];
            listItems.push(
                <li key={i}>
                    <button>
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

    renderPanel() {
        return null;
    }

    render() {
        return (
            <div>
                {this.renderList()}
                {this.renderPanel()}
            </div>
        );
    }
}

export { GymStart };