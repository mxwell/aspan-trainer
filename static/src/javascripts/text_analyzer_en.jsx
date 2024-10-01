import React from 'react';
import { render } from 'react-dom';
import { I18N_LANG_EN, initUiLangSwitcher } from './lib/i18n';
import { initViewerMenuButton } from './lib/viewer_menu';
import AnalyzerApp from './components/analyzer_app';

initViewerMenuButton();
initUiLangSwitcher();

const root = document.getElementById("analyzer_root");

render(
    <AnalyzerApp lang={I18N_LANG_EN}/>,
    root
);