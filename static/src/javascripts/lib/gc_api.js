import { encodeQueryData, makeGetApiRequest } from "./requests";

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

export {
    gcGetTranslations,
};