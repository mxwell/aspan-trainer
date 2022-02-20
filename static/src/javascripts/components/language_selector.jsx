import React from 'react';
import { i18n } from '../lib/i18n';
import { ActionButtonForm } from './action_button_form';

class LanguageSelector extends React.Component {
    constructor(props) {
        super(props);
    }

    renderButtons() {
        let items = [];
        for (const key of this.props.langKeys) {
            const name = i18n("useThisLangInterface", key);
            const handler = function(e) {
                e.preventDefault();
                this.props.onLanguageSelection(key);
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

export default LanguageSelector;