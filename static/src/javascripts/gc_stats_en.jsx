import React from 'react';
import { render } from 'react-dom';
import { I18N_LANG_EN } from './lib/i18n';
import GcStatsApp from './components/gc_stats_app';

const root = document.getElementById("gc_stats_root");

render(
    <GcStatsApp lang={I18N_LANG_EN} />,
    root
);