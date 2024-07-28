import React from 'react';
import { render } from 'react-dom';
import { I18N_LANG_RU, initUiLangSwitcher } from './lib/i18n';
import { initViewerMenuButton } from './lib/viewer_menu';
import GcCreateApp from './components/gc_create_app';

initViewerMenuButton();
initUiLangSwitcher();

const root = document.getElementById("gc_create_root");

render(
    <GcCreateApp lang={I18N_LANG_RU} />,
    root
);