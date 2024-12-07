import React from 'react';
import { render } from 'react-dom';
import GcContribTop from './components/gc_contrib_top';
import { I18N_LANG_RU, initUiLangSelector } from './lib/i18n';

initUiLangSelector();

const gcContribTop = document.getElementById("gc_contrib_top");

render(
    <GcContribTop lang={I18N_LANG_RU} />,
    gcContribTop
);