import React from 'react';
import { render } from 'react-dom';
import GcSearchApp from './components/gc_search_app';
import { I18N_LANG_EN, initUiLangSelector } from './lib/i18n';

initUiLangSelector();

const root = document.getElementById("gc_search_root");

render(
    <GcSearchApp lang={I18N_LANG_EN} />,
    root
);