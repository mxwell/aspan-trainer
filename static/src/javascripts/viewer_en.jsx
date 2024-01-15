import React from 'react';
import { render } from 'react-dom';
import ViewerApp from './components/viewer_app';
import { I18N_LANG_EN } from './lib/i18n';

const root = document.getElementById("viewer_root");

render(
    <ViewerApp lang={I18N_LANG_EN} />,
    root
);