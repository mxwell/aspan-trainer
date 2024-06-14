import React from "react";
import { GymLevel } from "../lib/gym_level";
import { GymStart } from "./gym_start";

const APP_STATE_START = 1;
const APP_STATE_LEVEL_SELECTED = 2;

/**
 * props:
 * - lang
 */
class GymApp extends React.Component {
    constructor(props) {
        super(props);

        this.onLevelSelect = this.onLevelSelect.bind(this);

        this.state = this.loadState();
    }

    makeState(levels) {
        return {
            appState: APP_STATE_START,
            levels: levels,
        };
    }

    loadState() {
        let levels = [
            new GymLevel("presentTransitive", true, false, null),
            new GymLevel("presentSimple", false, false, null),
            new GymLevel("presentContinuous", false, false, null),
            new GymLevel("presentColloquial", false, false, null),
            new GymLevel("past", false, false, null),
            new GymLevel("remotePast", false, false, null),
            new GymLevel("pastUncertain", false, false, null),
            new GymLevel("pastTransitive", false, false, null),
            new GymLevel("intentionFuture", false, false, null),
            new GymLevel("possibleFuture", false, false, null),
        ];
        // TODO load stats from local storage
        return this.makeState(levels);
    }

    onLevelSelect(level, action) {
        console.log(`Selected level ${level} with action=${action}`);
    }

    render() {
        const appState = this.state.appState;
        if (appState === APP_STATE_START) {
            return (
                <GymStart
                    lang={this.props.lang}
                    levels={this.state.levels}
                    onSelect={this.onLevelSelect}
                    />
            );
        } else {
            return (
                <p>Unsupported state</p>
            );
        }
    }
}

export { GymApp };