import React from "react";
import { closeButton } from "./close_button";
import { PART_TYPE_KEY, PART_TYPE_PLAIN, generateTasks } from "../lib/gym_level";
import { i18n } from "../lib/i18n";

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

/**
 * props:
 * - lang: string
 * - level: GymLevel
 * - finishCallback: function
 */
class GymExercise extends React.Component {
    constructor(props) {
        super(props);

        this.state = this.defaultState();
    }

    i18n(key) {
        return i18n(key, this.props.lang);
    }

    makeState(tasks, progress) {
        return {
            tasks: tasks,
            progress: progress,
        }
    }

    defaultState() {
        const tasks = generateTasks(this.props.level.levelKey);
        return this.makeState(
            /* tasks */ tasks,
            /* progress */ [],
        );
    }

    renderTask(taskIndex, total) {
        const task = this.state.tasks[taskIndex];
        // TODO
        return (
            <div className="px-3 py-2 flex flex-col">
                <div className="flex justify-between">
                    <h1 className="text-5xl lg:text-4xl m-4 text-center text-gray-700">{taskIndex + 1} / {total}</h1>
                    <h1 className="text-5xl lg:text-4xl m-4 text-center text-gray-700">{this.i18n(this.props.level.levelKey)}</h1>
                    {closeButton({ onClick: this.props.finishCallback })}
                </div>
                <h2 className="text-5xl lg:text-3xl m-2 lg:max-w-2xl text-center text-gray-600">
                    {printStatement(task.statement)}
                </h2>
            </div>
        );
    }

    renderFinished(tasks, total) {
        // TODO
        return null;
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