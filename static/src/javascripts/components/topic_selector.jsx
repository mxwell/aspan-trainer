import React from 'react';
import { i18n } from '../lib/i18n';
import { ActionButtonForm } from './action_button_form';

class TopicSelector extends React.Component {
    constructor(props) {
        super(props);
    }

    renderButtons() {
        let items = [];
        const lang = this.props.lang;
        for (const key of this.props.topicKeys) {
            const name = i18n(key, lang);
            let handler = function(e) {
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
        var langReset = function(e) {
            e.preventDefault();
            this.props.onLanguageReset();
        };
        langReset = langReset.bind(this);
        return (
            <div class="w-full max-w-screen-md flex-col py-4">
                {this.renderButtons()}
                <div class="pt-10">
                    <ActionButtonForm
                        onSubmit={langReset}
                        actionName={i18n("buttonChangeLanguage", this.props.lang)}
                        secondary={true}
                    />
                </div>
            </div>
        );
    }
}

export default TopicSelector;