function parseParams() {
    const search = location.search;
    if (search.length <= 0 || !search.startsWith("?")) {
        return {};
    }
    const tokens = search.substring(1).split("&");
    let result = {};
    for (let i = 0; i < tokens.length; i++) {
        const pair = tokens[i].split("=");
        if (pair.length !== 2) {
            continue;
        }
        result[pair[0]] = decodeURI(pair[1]);
    }
    return result;
}

function buildViewerUrl(verb, sentenceType) {
    const url = window.location.href;
    const qMark = url.indexOf("?");
    const prefix = (qMark >= 0) ? url.substring(0, qMark) : url;
    if (verb != null) {
        let params = [];
        params.push(`verb=${encodeURI(verb)}`);
        if (sentenceType != null) {
            params.push(`sentence_type=${sentenceType.toLowerCase()}`);
        }
        return `${prefix}?${params.join("&")}`;
    }
    return prefix;
}

export {
    buildViewerUrl,
    parseParams,
};
