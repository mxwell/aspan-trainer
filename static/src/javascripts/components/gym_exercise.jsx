import React from "react";
import { closeButton } from "./close_button";
import { PART_TYPE_KEY, PART_TYPE_PLAIN } from "../lib/gym_level";
import { i18n } from "../lib/i18n";
import { GymLevelStats, updateGymLevelStats } from "../lib/gym_storage";
import { generateTasksByLevelKey } from "../lib/verb_gym_gen";

const SCORE_CORRECT = 10;
const SCORE_INCORRECT = 0;

function printStatement(statement) {
    const htmlParts = [];
    for (let i = 0; i < statement.parts.length; i++) {
        const part = statement.parts[i];
        if (part.partType === PART_TYPE_PLAIN) {
            htmlParts.push(<span key={i}>{part.text}</span>);
        } else if (part.partType === PART_TYPE_KEY) {
            htmlParts.push(<span key={i}>[ {part.text} ]</span>);
        } else {
            throw new Error(`Unknown part type: ${part.partType}`);
        }
    }
    return htmlParts;
}

class GymTaskResult {
    constructor(answer, score) {
        this.answer = answer;
        this.score = score;
    }
}

/**
 * props:
 * - lang: string
 * - name: string
 * - level: GymLevel
 * - testRun: boolean
 * - finishCallback: function
 */
class GymExercise extends React.Component {
    constructor(props) {
        super(props);

        this.onChange = this.onChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.onNext = this.onNext.bind(this);
        this.completeRun = this.completeRun.bind(this);

        this.state = this.defaultState();
    }

    i18n(key) {
        return i18n(key, this.props.lang);
    }

    makeState(tasks, progress) {
        return {
            tasks: tasks,
            progress: progress,
            lastEntered: "",
            correct: null,
            submitTime: null,
        }
    }

    defaultState() {
        const tasks = generateTasksByLevelKey(this.props.level.levelKey);
        if (tasks == null) {
            throw new Error(`Unsupported levelKey: ${this.props.level.levelKey}`);
        }
        return this.makeState(
            /* tasks */ tasks,
            /* progress */ [],
        );
    }

    onChange(event) {
        const lastEntered = event.target.value;
        this.setState({ lastEntered });
    }

    onSubmit(event) {
        event.preventDefault();
        console.log("onSubmit");
        const lastEntered = this.state.lastEntered.trim();
        if (lastEntered.length == 0) {
            return;
        }
        if (this.state.correct !== null) {
            const now = new Date();
            const submitTime = this.state.submitTime;
            if (submitTime != null && now - submitTime > 600) {
                this.advance(this.state.correct);
            } else {
                console.log("onSubmit: too early to advance");
            }
            return;
        }
        const taskIndex = this.state.progress.length;
        const task = this.state.tasks[taskIndex];
        const correctAnswers = task.correctAnswers;
        if (correctAnswers.length == 0) {
            console.log("onSubmit: no correct answers");
            return;
        }
        const correct = correctAnswers.indexOf(lastEntered) >= 0;
        if (this.props.testRun) {
            this.advance(correct);
        } else {
            const submitTime = new Date();
            this.setState({ correct, submitTime });
        }
    }

    renderStatement(statement) {
        const metaSentType = statement.metaParts["SentenceType"];
        const sentType = (
            metaSentType
            ? (
                <p className="text-4xl lg:text-2xl m-2 text-center text-gray-500">
                    {this.i18n("SentenceType")}:&nbsp;{this.i18n(metaSentType)}
                </p>
            )
            : null
        );
        const negateAux = statement.metaParts["negateAux"] == true;
        const negation = (
            (metaSentType == "Negative" && negateAux)
            ? (
                <p className="text-4xl lg:text-2xl m-2 text-center text-gray-500">
                    {this.i18n("negateAux")}
                </p>
            )
            : null
        );
        const specialBehavior = (
            statement.metaParts["forceExceptional"] == true
            ? (
                <p className="text-4xl lg:text-2xl m-2 text-center text-gray-500">
                    {this.i18n("verbSpecialBehavior")}
                </p>
            )
            : null
        );
        return (
            <div className="flex flex-col">
                {sentType}
                {negation}
                {specialBehavior}
                <p className="text-5xl lg:text-3xl m-2 text-center text-gray-600">
                    {printStatement(statement)}
                </p>
            </div>
        );
    }

    renderFeedback(task, correct) {
        if (this.props.testRun) {
            return null;
        }
        if (correct == null) {
            /* render something invisible to maintain the layout */
            return <p className="m-4 p-2 text-5xl lg:text-4xl invisible">n/a</p>;
        } else if (correct == true) {
            return <p className="m-4 p-2 text-5xl lg:text-4xl text-center text-green-400">{this.i18n("feedbackCorrect")}</p>;
        } else {
            const correctAnswers = task.correctAnswers;
            const expected = correctAnswers.length > 0 ? correctAnswers[0] : this.i18n("feedbackUnknownAnswer");
            return (
                <p className="m-4 p-2 text-5xl lg:text-4xl text-center text-red-400">
                    {this.i18n("feedbackWrongAndHereIsCorrect")}&nbsp;<strong>{expected}</strong>
                </p>
            );
        }
    }

    renderButton(key, onClick) {
        return (
            <button
                className="text-white text-5xl lg:text-3xl my-4 font-bold px-4 rounded focus:outline-none focus:shadow-outline bg-blue-500 hover:bg-blue-700"
                onClick={onClick}>
                {this.i18n(key)}
            </button>
        );
    }

    checkTestWin(progress) {
        let total = progress.length;
        let totalScore = 0;
        for (let i = 0; i < total; i++) {
            totalScore += progress[i].score;
        }
        const threshold = (total - 1) * SCORE_CORRECT;
        return totalScore >= threshold;
    }

    completeRun() {
        const progress = this.state.progress;
        if (progress.length < this.state.tasks.length) {
            return;
        }
        console.log("completeRun: Saving level stats");
        const newStats = (
            this.props.testRun
            ? new GymLevelStats(0, 1, this.checkTestWin(progress) ? 1 : 0)
            : new GymLevelStats(1, 0, 0)
        );
        updateGymLevelStats(this.props.name, this.props.level.levelKey, newStats);
    }

    advance(curCorrect) {
        const result = new GymTaskResult(
            this.state.lastEntered,
            curCorrect ? SCORE_CORRECT : SCORE_INCORRECT,
        );
        const progress = this.state.progress.concat([result]);
        const lastEntered = "";
        const correct = null;
        const submitTime = null;
        this.setState(
            { progress, lastEntered, correct, submitTime },
            () => {
                window.scrollTo(0, 0);
                this.completeRun();
            }
        );
    }

    onNext(event) {
        event.preventDefault();
        console.log("onNext");
        const curCorrect = this.state.correct;
        if (curCorrect == null) {
            console.log("onNext: not answered yet");
            return;
        }
        this.advance(curCorrect);
    }

    renderNextButton(answered) {
        if (!answered || this.props.testRun) {
            return null;
        }
        return this.renderButton("btnNext", this.onNext);
    }

    renderTask(taskIndex, total) {
        const task = this.state.tasks[taskIndex];
        const correct = this.state.correct;
        const answered = correct !== null;
        const enabled = correct == null;
        const inputExtraClass = (
            enabled || this.props.testRun
            ? ""
            : (
                correct
                ? " border-green-400"
                : " border-red-400"
            )
        );

        const inputClass = `shadow appearance-none border-2 rounded w-full m-4 p-2 text-5xl lg:text-3xl text-gray-700 text-center focus:outline-none focus:shadow-outline${inputExtraClass}`;
        const buttonEnabled = enabled && this.state.lastEntered.length > 0;
        const buttonExtraClass = buttonEnabled ? "bg-blue-500 hover:bg-blue-700" : "bg-gray-500";
        const buttonClass = `text-white text-5xl lg:text-3xl my-4 font-bold px-4 rounded focus:outline-none focus:shadow-outline ${buttonExtraClass}`;
        return (
            <div className="px-3 py-2 flex flex-col">
                <div className="flex justify-between bg-gray-200">
                    <h1 className="text-4xl lg:text-3xl m-4 text-center text-gray-700">{taskIndex + 1} / {total}</h1>
                    <h1 className="text-4xl lg:text-3xl m-4 text-center text-gray-700">{this.i18n(this.props.level.levelKey)}</h1>
                    {closeButton({ onClick: this.props.finishCallback })}
                </div>
                {this.renderStatement(task.statement)}
                <form onSubmit={this.onSubmit} className="flex">
                    <input
                        type="text"
                        size="80"
                        maxLength="256"
                        readOnly={enabled ? null : "readOnly"}
                        value={this.state.lastEntered}
                        onChange={this.onChange}
                        placeholder={this.i18n("hintEnterAnswer")}
                        className={inputClass}
                        autoFocus />
                    <button
                        type="submit"
                        className={buttonClass}>
                        →
                    </button>
                </form>
                {this.renderFeedback(task, correct)}
                {this.renderNextButton(answered)}
            </div>
        );
    }

    renderTestResult(totalScore, threshold) {
        if (!this.props.testRun) {
            return null;
        }
        const win = totalScore >= threshold;
        const colorClass = win ? "text-green-600" : "text-red-600";
        const verdictKey = win ? "testPassed" : "testFailed";
        return (
            <h2 className={`text-5xl lg:text-3xl text-center m-4 ${colorClass}`}>
                {this.i18n(verdictKey)}
            </h2>
        );
    }

    renderFinished(tasks, total) {
        if (total != this.state.progress.length) {
            throw new Error(`Got ${this.state.progress.length} results for ${total} tasks`);
        }
        let totalScore = 0;
        let tableRows = [];
        for (let i = 0; i < total; i++) {
            const task = tasks[i];
            const taskResult = this.state.progress[i];
            totalScore += taskResult.score;
            const scoreClass = taskResult.score > 0 ? "text-green-400" : "null";
            const scoreText = taskResult.score > 0 ? `+${taskResult.score}` : taskResult.score;

            const row = (
                <tr
                    className="border-t-2 text-2xl"
                    key={i}>
                    <td>{i + 1}</td>
                    <td>{task.correctAnswers.join(", ")}</td>
                    <td>{taskResult.answer}</td>
                    <td className={scoreClass}>{scoreText}</td>
                </tr>
            );
            tableRows.push(row);
        }
        const maxScore = total * SCORE_CORRECT;
        const thresholdScore = (total - 1) * SCORE_CORRECT;
        const scoreString = `${totalScore} / ${maxScore}`;
        return (
            <div className="flex flex-col">
                <h1 className="text-3xl lg:text-xl text-center text-gray-600 mt-4">{this.i18n(this.props.level.levelKey)}</h1>
                <h2 className="text-5xl lg:text-3xl text-center text-gray-600 m-4">{this.i18n("roundCleared")}</h2>
                {this.renderTestResult(totalScore, thresholdScore)}
                <table className="table-auto text-center my-10">
                    <thead>
                        <tr className="border-t-2 text-4xl lg:text-2xl">
                            <th className="px-4">#</th>
                            <th className="px-4">{this.i18n("columnExpected")}</th>
                            <th className="px-4">{this.i18n("columnYourAnswers")}</th>
                            <th className="px-4">{this.i18n("columnScore")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tableRows}
                    </tbody>
                </table>
                <p className="text-4xl lg:text-2xl text-center m-4">{this.i18n("youScored")}&nbsp;<strong>{scoreString}</strong></p>
                {this.renderButton("btnFinish", this.props.finishCallback)}
            </div>
        );
    }

    render() {
        const tasks = this.state.tasks;
        const taskIndex = this.state.progress.length;
        const total = tasks.length;
        if (taskIndex < total) {
            return this.renderTask(taskIndex, total);
        }
        return this.renderFinished(tasks, total);
    }
}

export {
    GymExercise,
};