import React from 'react';
import { render } from 'react-dom';
import DeclensionApp from './components/declension_app';
import { I18N_LANG_EN, initUiLangSwitcher } from './lib/i18n';
import { initViewerMenuButton } from './lib/viewer_menu';

initViewerMenuButton();
initUiLangSwitcher();

const root = document.getElementById("declension_root");

render(
    <DeclensionApp lang={I18N_LANG_EN} />,
    root
);