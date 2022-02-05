import React from 'react';

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

export {
    renderOptionsWithKeysAndObj,
    renderOptionsWithKeys,
};