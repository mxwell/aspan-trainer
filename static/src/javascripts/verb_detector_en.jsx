import React from 'react';
import { render } from 'react-dom';
import DetectorApp from './components/detector_app';
import { I18N_LANG_EN, initUiLangSwitcher } from './lib/i18n';
import { initViewerMenuButton } from './lib/viewer_menu';

initViewerMenuButton();
initUiLangSwitcher();

const root = document.getElementById("detector_root");

render(
    <DetectorApp lang={I18N_LANG_EN} onlyVerbs={true}/>,
    root
);