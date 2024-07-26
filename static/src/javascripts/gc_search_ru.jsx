import React from 'react';
import { render } from 'react-dom';
import GcSearchApp from './components/gc_search_app';
import { I18N_LANG_RU, initUiLangSwitcher } from './lib/i18n';
import { initViewerMenuButton } from './lib/viewer_menu';

initViewerMenuButton();
initUiLangSwitcher();

const root = document.getElementById("gc_search_root");

render(
    <GcSearchApp lang={I18N_LANG_RU} />,
    root
);