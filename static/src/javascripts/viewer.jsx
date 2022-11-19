import React from 'react';
import { render } from 'react-dom';
import ViewerApp from './components/viewer_app';

const root = document.getElementById("viewer_root");

render(
    <ViewerApp />,
    root
);