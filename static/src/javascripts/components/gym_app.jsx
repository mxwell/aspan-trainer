import React from "react";
import { GymLevel } from "../lib/gym_level";
import { GymStart } from "./gym_start";
import { GymExercise } from "./gym_exercise";
import { loadAllGymStats } from "../lib/gym_storage";

const APP_STATE_START = 1;
const APP_STATE_LEVEL_SELECTED = 2;

// TODO Move verb specific parts outside of the gym code
const LEVEL_KEYS = [
    "presentTransitive",
    "presentSimple",
    "presentContinuous",
    "presentColloquial",
    "past",
    "remotePast",
    "pastUncertain",
    "pastTransitive",
    "intentionFuture",
    "possibleFuture",
];

const LEVEL_PARENTS = {
    presentTransitive: null,
    presentSimple: "presentTransitive",
    presentContinuous: "presentSimple",
    presentColloquial: "presentContinuous",
    past: "presentTransitive",
    remotePast: "past",
    pastUncertain: "remotePast",
    pastTransitive: "pastUncertain",
    intentionFuture: "presentTransitive",
    possibleFuture: "intentionFuture",
};

/**
 * props:
 * - lang
 * - name
 */
class GymApp extends React.Component {
    constructor(props) {
        super(props);

        this.onLevelSelect = this.onLevelSelect.bind(this);
        this.closeLevelWithReload = this.closeLevelWithReload.bind(this);

        this.state = this.loadState();
    }

    makeState(levels, stats) {
        return {
            appState: APP_STATE_START,
            levels: levels,
            stats: stats,
            selectedLevelIndex: null,
        };
    }

    loadState() {
        const stats = loadAllGymStats(this.props.name, LEVEL_KEYS);
        const completed = new Set();
        for (let i = 0; i < LEVEL_KEYS.length; i++) {
            if (stats[i].levelCompleted()) {
                completed.add(LEVEL_KEYS[i]);
            }
        }

        const levels = [];
        for (const levelKey of LEVEL_KEYS) {
            const parent = LEVEL_PARENTS[levelKey];
            levels.push(new GymLevel(
                levelKey,
                parent,
                parent == null || completed.has(parent),
                completed.has(levelKey),
            ));
        }
        return this.makeState(levels, stats);
    }

    onLevelSelect(level, action) {
        console.log(`Selected level ${level} with action=${action}`);
        if (action == "practice") {
            this.setState({
                appState: APP_STATE_LEVEL_SELECTED,
                selectedLevelIndex: level,
            });
        } else {
            // TODO
            console.log(`Unsupported action ${action}`);
        }
    }

    closeLevelWithReload() {
        console.log("Closing level with reload");
        this.setState(this.loadState());
    }

    render() {
        const appState = this.state.appState;
        if (appState === APP_STATE_START) {
            return (
                <GymStart
                    lang={this.props.lang}
                    levels={this.state.levels}
                    stats={this.state.stats}
                    onSelect={this.onLevelSelect}
                    />
            );
        } else if (appState == APP_STATE_LEVEL_SELECTED) {
            const level = this.state.levels[this.state.selectedLevelIndex];
            return (
                <GymExercise
                    lang={this.props.lang}
                    name={this.props.name}
                    level={level}
                    finishCallback={this.closeLevelWithReload}
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