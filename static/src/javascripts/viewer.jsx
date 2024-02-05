import React from 'react';
import { render } from 'react-dom';
import ViewerApp from './components/viewer_app';
import { I18N_LANG_RU, initUiLangSwitcher } from './lib/i18n';
import { initViewerMenuButton } from './lib/viewer_menu';

initViewerMenuButton();
initUiLangSwitcher();

const root = document.getElementById("viewer_root");

render(
    <ViewerApp lang={I18N_LANG_RU} />,
    root
);