import React from "react";
import { copyToClipboard } from "../lib/clipboard";

/**
 * props:
 * - url
 * - imgSize
 */
class ShareButton extends React.Component {
    constructor(props) {
        super(props);

        this.onClick = this.onClick.bind(this);
        this.onCopy = this.onCopy.bind(this);

        this.state = { reveal: false };
    }

    onClick(event) {
        event.preventDefault();
        const reveal = !this.state.reveal;
        this.setState({ reveal });
    }

    onCopy(event) {
        event.preventDefault();
        copyToClipboard(this.props.url);
    }

    render() {
        const revealClass = (
            this.state.reveal
            ? ""
            : "hidden"
        );
        const divClass = `absolute z-10 flex flex-row ${revealClass} border-2 p-2 bg-gray-100 rounded-l`;
        return (
            <span className="relative">
                <button
                    className="px-2"
                    onClick={this.onClick}>
                    <img className={this.props.imgSize} src="/share.svg" />
                </button>
                <div className={divClass}>
                    <input
                        type="text"
                        size="24"
                        readOnly="readOnly"
                        className="my-4 text-base text-white bg-teal-600 p-2 rounded"
                        value={this.props.url} />
                    <button
                        className="w-12 mx-4"
                        onClick={this.onCopy}>
                        <img className="h-16" src="/copy.svg" />
                    </button>
                </div>
            </span>
        );
    }
}

export {
    ShareButton,
};