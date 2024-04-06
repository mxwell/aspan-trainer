import React from 'react';
import { render } from 'react-dom';
import TopApp from './components/top_app';
import { I18N_LANG_EN, initUiLangSwitcher } from './lib/i18n';
import { initViewerMenuButton } from './lib/viewer_menu';

initViewerMenuButton();
initUiLangSwitcher();

const root = document.getElementById("top_root");

render(
    <TopApp lang={I18N_LANG_EN} />,
    root
);