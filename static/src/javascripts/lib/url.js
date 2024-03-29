import { I18N_LANG_EN, I18N_LANG_RU } from "./i18n";

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

function buildUrl(path, params) {
    return `${path}?${params.join("&")}`;
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
    return buildUrl(path, params);
}

function buildVerbDetectorUrl(form, lang) {
    let params = [
        `form=${encodeURI(form)}`,
    ];
    const path = `/verb_detector_${lang}.html`;
    return buildUrl(path, params);
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

function buildViewerUrl2(verb, sentenceType, forceExceptional, lang) {
    let params = [
        `verb=${encodeURI(verb)}`,
        `sentence_type=${sentenceType}`,
    ];
    if (forceExceptional) {
        params.push("exception=true");
    }
    const path = (
        (lang == I18N_LANG_RU)
        ? "/"
        : `/${lang}/`
    );
    return buildUrl(path, params);
}

function buildGlosbeUrl(verb, lang) {
    return `https://glosbe.com/kk/${lang}/${encodeURI(verb)}`;
}

function buildLugatUrl(verb, lang) {
    let params = [
        `p=voc`,
        `word=${encodeURI(verb)}`,
    ];
    if (lang == I18N_LANG_RU) {
        params.push(`vocid=4`);
    } else if (lang == I18N_LANG_EN) {
        params.push(`vocid=1`);
    }
    return buildUrl("https://www.lugat.kz/index.php", params);
}

export {
    buildExplanationUrl,
    buildVerbDetectorUrl,
    buildViewerUrl,
    buildViewerUrl2,
    extractSsrVerb,
    isSsrPage,
    parseParams,
    buildGlosbeUrl,
    buildLugatUrl,
};
