import { encodeQueryData, makeGetApiRequest, makeJsonApiRequest } from "./requests";

function gcGetTranslations(word, src, dst, bothDirs, successCallback, errorCallback, context) {
    const params = {
        w: word,
        src: src,
        dst: dst,
    };
    if (bothDirs) {
        params["both"] = 1
    }
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

function gcAddWord(word, pos, excVerb, lang, comment, successCallback, errorCallback, context) {
    const params = {
        w: word,
        pos: pos,
        ev: excVerb,
        lang: lang,
        com: comment,
    };
    const url = "/gcapi/v1/add_word";
    return makeJsonApiRequest(url, params, successCallback, errorCallback, context, "lala", true);
}

function gcAddTranslation(srcId, dstId, reference, successCallback, errorCallback, context) {
    const params = {
        src: srcId,
        dst: dstId,
        ref: reference,
    };
    const url = "/gcapi/v1/add_translation";
    return makeJsonApiRequest(url, params, successCallback, errorCallback, context, "lala", true);
}

function gcGetFeed(successCallback, errorCallback, context) {
    const url = "/gcapi/v1/get_feed";
    return makeGetApiRequest(url, successCallback, errorCallback, context, "lala", true);
}

function gcGetReviews(direction, successCallback, errorCallback, context) {
    let params = (
        (direction != null)
        ? { src: direction.src, dst: direction.dst }
        : {}
    );
    const query = encodeQueryData(params);
    const url = `/gcapi/v1/get_reviews?${query}`;
    return makeGetApiRequest(url, successCallback, errorCallback, context, "lala", true);
}

function gcAddReview(srcId, dstId, reference, successCallback, errorCallback, context) {
    const params = {
        src: srcId,
        dst: dstId,
        ref: reference,
    };
    const url = "/gcapi/v1/add_review";
    return makeJsonApiRequest(url, params, successCallback, errorCallback, context, "lala", true);
}

function gcAddReviewVote(reviewId, vote, successCallback, errorCallback, context) {
    const params = {
        rid: reviewId,
        v: vote,
    };
    const url = "/gcapi/v1/add_review_vote";
    return makeJsonApiRequest(url, params, successCallback, errorCallback, context, "lala", true);
}

function gcGetStats(successCallback, errorCallback, context) {
    const url = "/gcapi/v1/get_stats";
    return makeGetApiRequest(url, successCallback, errorCallback, context, "lala", true);
}

export {
    gcGetTranslations,
    gcGetWords,
    gcAddWord,
    gcAddTranslation,
    gcGetFeed,
    gcGetReviews,
    gcAddReview,
    gcAddReviewVote,
    gcGetStats,
};