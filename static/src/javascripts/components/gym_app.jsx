import React from "react";
import { GymLevel, GymLevelStats, zeroStats } from "../lib/gym_level";
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
            new GymLevel("presentTransitive", null, true, true, new GymLevelStats(25, 5, 1)),
            new GymLevel("presentSimple", "presentTransitive", true, false, zeroStats()),
            new GymLevel("presentContinuous", "presentSimple", false, false, zeroStats()),
            new GymLevel("presentColloquial", "presentContinuous", false, false, zeroStats()),
            new GymLevel("past", "presentTransitive", false, false, zeroStats()),
            new GymLevel("remotePast", "past", false, false, zeroStats()),
            new GymLevel("pastUncertain", "remotePast", false, false, zeroStats()),
            new GymLevel("pastTransitive", "pastUncertain", false, false, zeroStats()),
            new GymLevel("intentionFuture", "presentTransitive", false, false, zeroStats()),
            new GymLevel("possibleFuture", "intentionFuture", false, false, zeroStats()),
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