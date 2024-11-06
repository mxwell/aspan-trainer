function catCompletion(suggestion) {
    const completion = suggestion.completion;
    let parts = [];
    if (completion) {
        for (let i = 0; i < completion.length; ++i) {
            parts.push(completion[i].text);
        }
    }
    return parts.join("");
}

export {
    catCompletion,
};