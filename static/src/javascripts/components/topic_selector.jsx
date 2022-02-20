import React from 'react';

import { ActionButtonForm } from './action_button_form';

class TopicSelector extends React.Component {
    constructor(props) {
        super(props);
    }

    renderButtons() {
        let items = [];
        for (const key of this.props.topicKeys) {
            const name = this.props.topicNames[key];
            const handler = function(e) {
                e.preventDefault();
                this.props.onTopicSelection(key);
            };
            handler = handler.bind(this);
            items.push(<ActionButtonForm
                onSubmit={handler}
                actionName={name}
            />);
        }
        return items;
    }

    render() {
        return (
            <div class="w-full max-w-screen-md flex-col py-4">
                {this.renderButtons()}
            </div>
        );
    }
}

export default TopicSelector;