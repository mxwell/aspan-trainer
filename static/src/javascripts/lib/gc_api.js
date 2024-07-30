import { encodeQueryData, makeGetApiRequest, makeJsonApiRequest } from "./requests";

function gcGetTranslations(word, src, dst, successCallback, errorCallback, context) {
    const params = {
        w: word,
        src: src,
        dst: dst,
    };
    const query = encodeQueryData(params);
    const url = `/gcapi/v1/get_translation?${query}`;
    return makeGetApiRequest(url, successCallback, errorCallback, context, "lala", true);
}

function gcGetWords(word, lang, successCallback, errorCallback, context) {
    const params = {
        w: word,
        lang: lang,
    };
    const query = encodeQueryData(params);
    const url = `/gcapi/v1/get_words?${query}`;
    return makeGetApiRequest(url, successCallback, errorCallback, context, "lala", true);
}

function gcAddWord(word, pos, excVerb, lang, successCallback, errorCallback, context) {
    const params = {
        w: word,
        pos: pos,
        ev: excVerb,
        lang: lang,
    };
    const url = "/gcapi/v1/add_word";
    return makeJsonApiRequest(url, params, successCallback, errorCallback, context, "lala", true);
}

function gcAddTranslation(srcId, dstId, successCallback, errorCallback, context) {
    const params = {
        src: srcId,
        dst: dstId,
    };
    const url = "/gcapi/v1/add_translation";
    return makeJsonApiRequest(url, params, successCallback, errorCallback, context, "lala", true);
}

export {
    gcGetTranslations,
    gcGetWords,
    gcAddWord,
    gcAddTranslation,
};