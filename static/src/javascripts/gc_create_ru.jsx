import React from 'react';
import { render } from 'react-dom';
import { I18N_LANG_RU } from './lib/i18n';
import GcCreateApp from './components/gc_create_app';

const root = document.getElementById("gc_create_root");

render(
    <GcCreateApp lang={I18N_LANG_RU} />,
    root
);