import React from "react";
import { i18n } from "../lib/i18n";

/**
 * props:
 * - lang
 * - levels: array of GymLevels
 * - stats: array of GymLevelStats
 * - callback onSelect(level, action), where action is one of {practice,test}
 */
class GymStart extends React.Component {
    constructor(props) {
        if (props.levels.length != props.stats.length) {
            throw new Error(`Expected ${props.levels.length} stats but got ${props.stats.length}`);
        }
        super(props);

        this.onLevelClick = this.onLevelClick.bind(this);
        this.onPracticeClick = this.onPracticeClick.bind(this);
        this.onTestClick = this.onTestClick.bind(this);

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

    onPracticeClick(e) {
        e.preventDefault();
        this.props.onSelect(this.state.selectedLevel, "practice");
    }

    onTestClick(e) {
        e.preventDefault();
        this.props.onSelect(this.state.selectedLevel, "test");
    }

    renderActions(gymLevel, levelStats) {
        if (!gymLevel.available) {
            const parentName = this.i18n(gymLevel.parentKey);
            return (
                <p className="italic text-center m-4 max-w-sm">
                    {this.i18n("levelAvailAfterTempl")(parentName)}
                </p>
            );
        }
        const testStatus = (
            levelStats.testWins > 0
            ? this.i18n("testPassed")
            : this.i18n("testNotPassed")
        );
        return (
            <div className="flex flex-row justify-evenly">
                <div className="border p-4">
                    <h3 className="text-2xl">
                        {this.i18n("practice")}
                        <button
                            type="submit"
                            onClick={this.onPracticeClick}
                            className="text-white font-bold mx-2 px-2 rounded focus:outline-none focus:shadow-outline bg-blue-500 hover:bg-blue-700">
                            →
                        </button>
                    </h3>
                    <p>{this.i18n("practiceRunsTempl")(levelStats.practiceRuns)}</p>
                </div>
                <div className="border p-4">
                    <h3 className="text-2xl">
                        {this.i18n("test")}
                        <button
                            type="submit"
                            onClick={this.onTestClick}
                            className="text-white font-bold mx-2 px-2 rounded focus:outline-none focus:shadow-outline bg-blue-500 hover:bg-blue-700">
                            →
                        </button>
                    </h3>
                    <p>{this.i18n("testRunsTempl")(levelStats.testRuns)}</p>
                    <p>{this.i18n("testWinsTempl")(levelStats.testWins)}</p>
                    <strong>{testStatus}</strong>
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
        const levelStats = this.props.stats[levelId];
        return (
            <div className="border-2 border-black my-6">
                <h2 className="m-4 text-3xl text-center max-w-sm">
                    {this.i18n(level.levelKey)}
                </h2>
                {this.renderActions(level, levelStats)}
            </div>
        );
    }

    render() {
        return (
            <div>
                <h1 className="m-4 text-4xl">{this.i18n("verbGym")}</h1>
                <p className="m-4 italic">{this.i18n("clickToSelect")}</p>
                {this.renderList()}
                {this.renderPanel()}
            </div>
        );
    }
}

export { GymStart };