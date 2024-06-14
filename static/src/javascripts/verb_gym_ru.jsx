import React from 'react';
import { render } from 'react-dom';
import { I18N_LANG_RU, initUiLangSwitcher } from './lib/i18n';
import { initViewerMenuButton } from './lib/viewer_menu';
import { GymApp } from './components/gym_app';

initViewerMenuButton();
initUiLangSwitcher();

const root = document.getElementById("gym_root");

render(
    <GymApp lang={I18N_LANG_RU} />,
    root
);