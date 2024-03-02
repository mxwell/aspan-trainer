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

function isSsrPage() {
    return window.location.pathname.startsWith("/ssr/");
}

function extractSsrVerb() {
    const path = window.location.pathname;
    const slash = path.lastIndexOf("/");
    const ext = path.lastIndexOf(".html");
    if (slash < 0 || ext < 0 || slash + 1 >= ext) {
        return null;
    }
    return decodeURI(path.substring(slash + 1, ext)).replace(/_/g, " ");
}

function buildExplanationUrl(verb, tense, sentenceType, forceExceptional, person, number, lang) {
    let params = [
        `verb=${encodeURI(verb)}`,
        `tense=${tense}`,
        `sentence_type=${sentenceType}`,
        `person=${person}`,
        `number=${number}`
    ];
    if (forceExceptional) {
        params.push("exception=true");
    }
    const path = `/explanation_${lang}.html`;
    return `${path}?${params.join("&")}`;
}

function buildViewerUrl(verb, sentenceType, forceExceptional) {
    const path = isSsrPage() ? "/" : window.location.pathname;
    if (verb != null) {
        let params = [];
        params.push(`verb=${encodeURI(verb)}`);
        if (sentenceType != null) {
            params.push(`sentence_type=${sentenceType.toLowerCase()}`);
        }
        if (forceExceptional == true) {
            params.push(`exception=true`);
        }
        return `${path}?${params.join("&")}`;
    }
    return path;
}

export {
    buildExplanationUrl,
    buildViewerUrl,
    extractSsrVerb,
    isSsrPage,
    parseParams,
};
