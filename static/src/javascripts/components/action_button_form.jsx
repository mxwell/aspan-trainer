import React from "react";

export function actionButtonForm(props) {
    return (
        <form onSubmit={props.onSubmit} class="py-4 flex flex-col">
            <input
                type="submit"
                value={props.actionName}
                class="bg-blue-500 hover:bg-blue-700 text-white text-2xl font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            />
        </form>
    );
}