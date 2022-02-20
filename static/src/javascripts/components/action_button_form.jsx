import React from "react";

const SECONDARY_CLASS = "py-2 px-4 rounded focus:outline-none focus:shadow-outline";
const PRIMARY_CLASS = `bg-blue-500 hover:bg-blue-700 text-white text-2xl font-bold ${SECONDARY_CLASS}`;

function getButtonClass(secondary) {
    if (secondary) {
        return SECONDARY_CLASS;
    }
    return PRIMARY_CLASS;
}

export function ActionButtonForm(props) {
    return (
        <form onSubmit={props.onSubmit} class="py-4 flex flex-col">
            <input
                type="submit"
                value={props.actionName}
                class={getButtonClass(props.secondary)}
            />
        </form>
    );
}