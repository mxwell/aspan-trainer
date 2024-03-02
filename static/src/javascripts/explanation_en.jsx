import React from 'react';
import { render } from 'react-dom';
import ExplanationApp from './components/explanation_app';
import { I18N_LANG_EN, initUiLangSwitcher } from './lib/i18n';
import { initViewerMenuButton } from './lib/viewer_menu';

initViewerMenuButton();
initUiLangSwitcher();

const root = document.getElementById("explanation_root");

render(
    <ExplanationApp lang={I18N_LANG_EN} />,
    root
);