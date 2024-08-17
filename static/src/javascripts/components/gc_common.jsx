import React from "react";
import { ellipsize } from "../lib/gc";

function renderComment(text, className, targetLength) {
    return (
        text.length > 0
        ? (<span className={className}>
            "{ellipsize(text, targetLength)}"
        </span>)
        : null
    );
}

export {
    renderComment,
}