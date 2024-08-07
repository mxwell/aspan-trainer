import React from 'react';
import { render } from 'react-dom';
import { I18N_LANG_RU } from './lib/i18n';
import GcReviewsApp from './components/gc_reviews_app';

const root = document.getElementById("gc_reviews_root");

render(
    <GcReviewsApp lang={I18N_LANG_RU} />,
    root
);