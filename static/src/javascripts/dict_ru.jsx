import React from 'react';
import { render } from 'react-dom';
import { I18N_LANG_RU, initUiLangSwitcher } from './lib/i18n';
import { initViewerMenuButton } from './lib/viewer_menu';
import DictApp from './components/dict_app';

initViewerMenuButton();
initUiLangSwitcher();

const root = document.getElementById("dict_root");

render(
    <DictApp lang={I18N_LANG_RU}/>,
    root
);