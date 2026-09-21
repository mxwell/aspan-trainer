import React from 'react';
import { render } from 'react-dom';
import { I18N_LANG_EN, initUiLangSwitcher } from './lib/i18n';
import { initViewerMenuButton } from './lib/viewer_menu';
import YouzakhApp from './components/youzakh_app';

initViewerMenuButton();
initUiLangSwitcher();

const root = document.getElementById("youzakh_root");

render(
    <YouzakhApp lang={I18N_LANG_EN}/>,
    root
);
