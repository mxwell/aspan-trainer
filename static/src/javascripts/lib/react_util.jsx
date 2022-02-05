import React from 'react';

function renderOptions(keys, obj) {
    var lines = [];
    for (let key of keys) {
        lines.push(<option key={key} value={key}>{obj[key]}</option>);
    }
    return lines;
}

export {
    renderOptions,
};