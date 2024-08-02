import React from "react";
import { ellipsize } from "../lib/gc";

function renderComment(text, className) {
    return (
        text.length > 0
        ? (<span className={className}>
            "{ellipsize(text)}"
        </span>)
        : null
    );
}

export {
    renderComment,
}