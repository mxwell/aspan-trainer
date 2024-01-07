import React from 'react';
import { i18n } from '../lib/i18n';

class SideQuiz extends React.Component {
    constructor(props) {
        super(props);
    }

    onClick(e, position) {
        e.preventDefault();
        if (this.props.selected >= 0) {
            return;
        }
        this.props.onQuizSelection(position);
    }

    renderCases() {
        let listItems = [];

        let cases = this.props.cases;
        let lang = this.props.lang;
        let selected = this.props.selected;
        for (let i = 0; i < cases.length; ++i) {
            let text = i18n(cases[i], lang);
            let classes = "py-2 px-2 my-1";
            if (i == selected) {
                if (i == this.props.correct) {
                    classes += " bg-green-600";
                } else {
                    classes += " bg-red-600";
                }
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

    render() {
        if (this.props.completed) {
            return null;
        }
        return (
            <div className="bg-teal-400 p-5 text-white">
                <h5 className="text-center pb-4">{i18n("side_quiz", this.props.lang)}</h5>
                <h4 className="text-2xl text-center">{this.props.taskDescription}</h4>
                <h3 className="text-4xl text-center">{this.props.taskSubject}</h3>
                {this.renderCases()}
            </div>
        );
    }
}

export default SideQuiz;