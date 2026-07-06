import React from 'react';
import { render } from 'react-dom';
import { I18N_LANG_RU, initUiLangSwitcher } from './lib/i18n';
import { initViewerMenuButton } from './lib/viewer_menu';
import WatchApp from './components/watch_app';

initViewerMenuButton();
initUiLangSwitcher();

const root = document.getElementById("watch_root");

render(
    <WatchApp lang={I18N_LANG_RU}/>,
    root
);