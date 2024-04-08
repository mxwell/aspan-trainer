import React from "react";

export function closeButton(props) {
    return (
        <button
            className="inline-block bg-gray-600 hover:bg-gray-900 text-white font-bold rounded px-3 py-1 mr-2 mb-2"
            onClick={props.onClick}
        >X</button>
    );
}