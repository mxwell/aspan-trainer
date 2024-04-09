import React from 'react';
import { i18n } from '../lib/i18n';

class SideQuizState {
    constructor(commonDescription, tasks, taskIndex, selected, correctCount) {
        this.commonDescription = commonDescription;
        this.tasks = tasks;
        this.taskIndex = taskIndex;
        this.selected = selected;
        this.correctCount = correctCount;
    }
    answerIsSelected() {
        return this.selected >= 0;
    }
    selectAnswer(index) {
        return new SideQuizState(
            this.commonDescription,
            this.tasks,
            this.taskIndex,
            index,
            this.correctCount
        );
    }
    advance() {
        if (this.taskIndex >= this.tasks.length) {
            return null;
        }
        const task = this.tasks[this.taskIndex];
        const correctInc = task.correct == this.selected ? 1 : 0;
        return new SideQuizState(
            this.commonDescription,
            this.tasks,
            this.taskIndex + 1,
            -1,
            this.correctCount + correctInc
        );
    }
}

function initialSideQuizState(commonDescription, tasks) {
    return new SideQuizState(commonDescription, tasks, 0, -1, false, 0);
}

/**
 * props - lang, sideQuizStateCreator (returns SideQuizState)
 */
class SideQuiz extends React.Component {
    constructor(props) {
        super(props);

        this.onNext = this.onNext.bind(this);
        this.onRestart = this.onRestart.bind(this);

        this.state = {
            quizState: props.sideQuizStateCreator()
        };
    }

    i18n(key) {
        return i18n(key, this.props.lang);
    }

    onClick(e, position) {
        e.preventDefault();
        const curQuizState = this.state.quizState;
        if (curQuizState.answerIsSelected()) {
            console.log("Answer is already selected");
            return;
        }
        const quizState = curQuizState.selectAnswer(position);
        this.setState({ quizState });
    }

    onNext(e) {
        e.preventDefault();
        const quizState = this.state.quizState.advance();
        if (quizState == null) {
            console.log(`Quiz is finished, nothing to do`);
        } else {
            this.setState({ quizState });
        }
    }

    onRestart(e) {
        e.preventDefault();
        console.log("Restarting quiz");
        this.setState({
            quizState: this.props.sideQuizStateCreator()
        });
    }

    renderSubject(task, selected) {
        if (selected >= 0) {
            return task.completedSubject;
        } else {
            return task.rawSubject;
        }
    }

    renderCases(task, selected, invisible) {
        let listItems = [];
        const cases = task.caseKeys;
        const correct = task.correct;
        for (let i = 0; i < cases.length; ++i) {
            let text = this.i18n(cases[i]);
            let classes = "p-2 my-1";
            if (invisible) {
                classes += " invisible";
            }
            if (i == selected) {
                if (i == correct) {
                    classes += " bg-green-600";
                } else {
                    classes += " bg-red-600";
                }
            } else if (selected >= 0 && i == correct) {
                classes += " bg-green-600";
            } else {
                classes += " bg-white text-teal-500";
                if (selected < 0) {
                    classes += " hover:bg-gray-200";
                }
            }
            listItems.push(
                <button
                    className={classes}
                    onClick={(e) => { this.onClick(e, i); }}
                    key={listItems.length}>
                    {text}
                </button>
            );
        }

        return (
            <div className="flex flex-col py-4">
                {listItems}
            </div>
        );
    }

    renderTask(quizState, task) {
        const selected = quizState.selected;
        return (
            <div className="bg-teal-400 p-5 text-white side-quiz-container">
                <h5 className="text-center pb-4">{i18n("side_quiz", this.props.lang)}</h5>
                <h4 className="text-2xl text-center">{quizState.commonDescription}</h4>
                <h3 className="text-4xl text-center">{this.renderSubject(task, selected)}</h3>
                {this.renderCases(task, selected, false)}
                <div className="flex justify-end">
                    <button
                        className="bg-white text-teal-500 hover:bg-gray-200 p-2"
                        onClick={this.onNext} >
                        {this.i18n("next")}
                    </button>
                </div>
            </div>
        );
    }

    getJudgementKey(scoreRatio) {
        if (scoreRatio >= 0.9) {
            return "resultExcellent";
        } else if (scoreRatio >= 0.7) {
            return "resultGood";
        } else if (scoreRatio >= 0.3) {
            return "roomForImprovement";
        } else {
            return "shouldTryAgain";
        }
    }

    renderFinal(quizState) {
        const score = quizState.correctCount;
        const total = quizState.tasks.length;
        const task = quizState.tasks[0];
        return (
            <div className="bg-teal-400 p-5 text-white side-quiz-container">
                <h5 className="text-center pb-4">{i18n("side_quiz", this.props.lang)}</h5>
                <h4 className="text-2xl text-center">{this.i18n("yourScore")}: {score} / {total}</h4>
                <h4 className="text-xl my-4 text-center">{this.i18n(this.getJudgementKey(score / total))}</h4>
                {this.renderCases(task, -1, true)}
                <div className="flex justify-start">
                    <button
                        className="bg-white text-teal-500 hover:bg-gray-200 p-2"
                        onClick={this.onRestart} >
                        {this.i18n("restartQuiz")}
                    </button>
                </div>
            </div>
        );
    }

    render() {
        const quizState = this.state.quizState;
        if (quizState == null) {
            return null;
        }
        const tasks = quizState.tasks;
        if (quizState.taskIndex < tasks.length) {
            return this.renderTask(quizState, tasks[quizState.taskIndex]);
        } else {
            return this.renderFinal(quizState);
        }
    }
}

export {
    SideQuiz,
    initialSideQuizState
};