import React from 'react';
import { render } from 'react-dom';
import { I18N_LANG_EN } from './lib/i18n';
import GcFeedApp from './components/gc_feed_app';

const root = document.getElementById("gc_feed_root");

render(
    <GcFeedApp lang={I18N_LANG_EN} />,
    root
);