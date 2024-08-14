import React from "react";

export function editButton(props) {
    return (
        <button
            className="m-2 p-2 inline-block bg-gray-600 hover:bg-gray-900 rounded"
            onClick={props.onClick}>
            <img src="/edit.svg" className="h-6" alt="edit button" />
        </button>
    );
}