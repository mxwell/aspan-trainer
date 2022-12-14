import React from 'react';
import { i18n } from './i18n';

function renderOptionsWithKeysAndObj(keys, obj) {
    var lines = [];
    for (let key of keys) {
        lines.push(<option key={key} value={key}>{obj[key]}</option>);
    }
    return lines;
}

function renderOptionsWithKeys(keys) {
    var lines = [];
    for (let key of keys) {
        lines.push(<option key={key} value={key}>{key}</option>);
    }
    return lines;
}

function renderOptionsWithI18nKeys(keys, lang) {
    var lines = [];
    for (let key of keys) {
        lines.push(<option key={key} value={key}>{i18n(key, lang)}</option>);
    }
    return lines;
}

function renderOptionsWithNames(names) {
    var lines = [];
    for (let i = 0; i < names.length; ++i) {
        lines.push(<option key={i} value={i}>{names[i]}</option>);
    }
    return lines;
}

export {
    renderOptionsWithKeysAndObj,
    renderOptionsWithKeys,
    renderOptionsWithI18nKeys,
    renderOptionsWithNames,
};