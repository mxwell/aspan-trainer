import React from 'react';

import { renderOptionsWithKeysAndObj } from '../lib/react_util';

class TopicSelector extends React.Component {
    constructor(props) {
        super(props);
        this.handleTopicChange = this.handleTopicChange.bind(this);
        this.handleTopicConfirm = this.handleTopicConfirm.bind(this);
    }

    handleTopicChange(e) {
        this.props.onTopicChange(e.target.value);
    }

    handleTopicConfirm(e) {
        e.preventDefault();
        this.props.onTopicConfirm();
    }

    render() {
        return (
            <div class="w-full max-w-screen-md flex-col py-4">
                <form onSubmit={this.handleTopicConfirm} class="bg-white border-4 rounded px-8 pt-6 pb-8 mb-4 flex flex-col">
                    <div class="w-full flex justify-between py-4">
                        <label class="text-gray-600 text-2xl py-2">Topic:</label>
                        <select
                            required
                            onChange={this.handleTopicChange}
                            value={this.props.topic}
                            class="text-gray-800 text-2xl px-4 py-2">
                            {renderOptionsWithKeysAndObj(this.props.topicKeys, this.props.topicNames)}
                        </select>
                    </div>
                    <input
                        type="submit"
                        value="Confirm"
                        class="bg-blue-500 hover:bg-blue-700 text-white text-2xl font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    />
                </form>
            </div>
        );
    }
}

export default TopicSelector;