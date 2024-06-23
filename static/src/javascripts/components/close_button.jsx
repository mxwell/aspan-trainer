import React from "react";

export function closeButton(props) {
    return (
        <button
            className="inline-block bg-gray-600 hover:bg-gray-900 text-white text-3xl font-bold rounded px-5 py-1 mx-2 my-2"
            onClick={props.onClick}
        >X</button>
    );
}