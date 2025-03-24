import { encodeQueryData, makeGetApiRequest, makeJsonApiRequest } from "./requests";

var globalGcToken = null;
var globalGcTokenLoadAttempt = false;

function getCurrentGcToken() {
    if (!globalGcTokenLoadAttempt) {
        globalGcToken = gcLoadToken();
    }
    return globalGcToken;
}

function gcCheckUser(googleToken, successCallback, errorCallback, context) {
    const params = {
        id_token: googleToken,
    };
    const url = "/gcapi/v1/check_user";
    return makeJsonApiRequest(url, params, successCallback, errorCallback, context, "lala", true);
}

function gcCreateUser(googleToken, name, successCallback, errorCallback, context) {
    const params = {
        id_token: googleToken,
        name: name,
    };
    const url = "/gcapi/v1/create_user";
    return makeJsonApiRequest(url, params, successCallback, errorCallback, context, "lala", true);
}

function gcGetToken(googleToken, successCallback, errorCallback, context) {
    const params = {
        id_token: googleToken,
    };
    const url = "/gcapi/v1/get_token";
    return makeJsonApiRequest(url, params, successCallback, errorCallback, context, "lala", true);
}

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

function gcGetWords(word, lang, withTranslations, successCallback, errorCallback, context) {
    const params = {
        w: word,
        lang: lang,
    };
    if (withTranslations) {
        params["wtrs"] = 1;
    }
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
    const token = getCurrentGcToken();
    return makeJsonApiRequest(url, params, successCallback, errorCallback, context, token, true);
}

function gcAddTranslation(srcId, dstId, reference, successCallback, errorCallback, context) {
    const params = {
        src: srcId,
        dst: dstId,
        ref: reference,
    };
    const url = "/gcapi/v1/add_translation";
    const token = getCurrentGcToken();
    return makeJsonApiRequest(url, params, successCallback, errorCallback, context, token, true);
}

function gcGetFeed(successCallback, errorCallback, context) {
    const url = "/gcapi/v1/get_feed";
    return makeGetApiRequest(url, successCallback, errorCallback, context, "lala", true);
}

function gcGetReviews2(offset, count, direction, approvesMin, successCallback, errorCallback, context) {
    let params = { o: offset, c: count };
    if (direction != null) {
        params.src = direction.src;
        params.dst = direction.dst;
    }
    if (approvesMin != null) {
        params.am = approvesMin;
    }
    const query = encodeQueryData(params);
    const url = `/gcapi/v2/get_reviews?${query}`;
    const token = getCurrentGcToken() || "lala";
    return makeGetApiRequest(url, successCallback, errorCallback, context, token, true);
}

function gcAddReview(srcId, dstId, reference, successCallback, errorCallback, context) {
    const params = {
        src: srcId,
        dst: dstId,
        ref: reference,
    };
    const url = "/gcapi/v1/add_review";
    const token = getCurrentGcToken();
    return makeJsonApiRequest(url, params, successCallback, errorCallback, context, token, true);
}

function gcAddReviewVote(reviewId, vote, successCallback, errorCallback, context) {
    const params = {
        rid: reviewId,
        v: vote,
    };
    const url = "/gcapi/v1/add_review_vote";
    const token = getCurrentGcToken();
    return makeJsonApiRequest(url, params, successCallback, errorCallback, context, token, true);
}

function gcRetractReviewVote(reviewId, vote, successCallback, errorCallback, context) {
    const params = {
        rid: reviewId,
        v: vote,
    };
    const url = "/gcapi/v1/retract_review_vote";
    const token = getCurrentGcToken();
    return makeJsonApiRequest(url, params, successCallback, errorCallback, context, token, true);
}

function gcDiscardReview(reviewId, successCallback, errorCallback, context) {
    const params = {
        rid: reviewId,
    };
    const url = "/gcapi/v1/discard_review";
    const token = getCurrentGcToken();
    return makeJsonApiRequest(url, params, successCallback, errorCallback, context, token, true);
}

function gcGetStats(successCallback, errorCallback, context) {
    const url = "/gcapi/v1/get_stats";
    return makeGetApiRequest(url, successCallback, errorCallback, context, "lala", true);
}

function gcGetRankings(successCallback, errorCallback, context) {
    const url = "/gcapi/v1/get_rankings";
    return makeGetApiRequest(url, successCallback, errorCallback, context, "lala", true);
}

function gcGetDownloads(successCallback, errorCallback, context) {
    const url = "/gcapi/v1/get_downloads";
    return makeGetApiRequest(url, successCallback, errorCallback, context, "lala", true);
}

function gcGetUntranslated(dstLang, successCallback, errorCallback, context) {
    const params = {
        dst: dstLang,
    };
    const query = encodeQueryData(params);
    const url = `/gcapi/v1/get_untranslated?${query}`;
    return makeGetApiRequest(url, successCallback, errorCallback, context, "lala", true);
}

function gcGetLlmTranslations(wordId, model, successCallback, errorCallback, context) {
    const params = {
        wid: wordId,
        model: model,
    };
    const query = encodeQueryData(params);
    const url = `/gcapi/v1/get_llm_translations?${query}`;
    return makeGetApiRequest(url, successCallback, errorCallback, context, "lala", true);
}

function gcGetVerbFormExamples(verb, fe, neg, successCallback, errorCallback, context) {
    const params = {
        v: verb,
        fe: fe ? 1 : 0,
        neg: neg ? 1 : 0,
    };
    const query = encodeQueryData(params);
    const url = `/gcapi/v1/get_verb_form_examples?${query}`;
    return makeGetApiRequest(url, successCallback, errorCallback, context, "lala", true);
}

function gcGetBookChunks(bookId, offset, count, successCallback, errorCallback, context) {
    const params = {
        book_id: String(bookId),
        offset: String(offset),
        count: String(count),
    };
    const query = encodeQueryData(params);
    const url = `/gcapi/v1/get_book_chunks?${query}`;
    return makeGetApiRequest(url, successCallback, errorCallback, context, "lala", true);
}

function gcGetVideoSubtitles(videoId, startMs, endMs, successCallback, errorCallback, context) {
    const params = {
        video_id: videoId,
        start_ms: startMs,
        end_ms: endMs,
    };
    const query = encodeQueryData(params);
    const url = `/gcapi/v1/get_video_subtitles?${query}`;
    return makeGetApiRequest(url, successCallback, errorCallback, context, "lala", true);
}

const gcTokenKey = "gc-v1-token";

function parseJwt (token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}

function gcTokenIsValid(gcToken) {
    if (gcToken == null || gcToken.length == 0) {
        return false;
    }
    const parsed = parseJwt(gcToken);
    console.log(`Parsed GC token: ${JSON.stringify(parsed)}`);
    const exp = parsed.exp;
    if (exp == null) {
        return false;
    }
    const now = Math.floor(Date.now() / 1000)
    if (now >= exp) {
        console.log(`GC token expired: now ${now} >= ${exp}`);
        return false;
    }
    return true;
}

function gcStoreToken(gcToken) {
    const localStorage = window.localStorage;
    console.log(`Storing GC token of length ${gcToken.length}`);
    localStorage.setItem(gcTokenKey, gcToken);
    globalGcTokenLoadAttempt = false;
}

function gcClearToken() {
    const localStorage = window.localStorage;
    console.log(`Clearing GC token if exists`);
    localStorage.removeItem(gcTokenKey);
    globalGcTokenLoadAttempt = false;
}

function gcLoadToken() {
    const localStorage = window.localStorage;
    let gcToken = localStorage.getItem(gcTokenKey);
    if (gcToken == null) {
        console.log(`No GC token is found`);
    } else if (!gcTokenIsValid(gcToken)) {
        console.log(`Loaded GC token is not valid`);
        gcToken = null;
    } else {
        console.log(`Loaded GC token of length ${gcToken.length}`);
    }
    globalGcTokenLoadAttempt = true;
    return gcToken;
}

function gcGetUserId() {
    const token = getCurrentGcToken();
    if (token == null) {
        console.log("No user id: no token");
        return 0;
    }
    const parsed = parseJwt(token);
    const userId = parsed.user_id;
    console.log(`Retrieved user id from stored token: ${userId}`);
    return userId;
}

export {
    getCurrentGcToken,
    gcCheckUser,
    gcCreateUser,
    gcGetToken,
    gcGetTranslations,
    gcGetWords,
    gcAddWord,
    gcAddTranslation,
    gcGetFeed,
    gcGetReviews2,
    gcAddReview,
    gcAddReviewVote,
    gcRetractReviewVote,
    gcDiscardReview,
    gcGetStats,
    gcGetRankings,
    gcGetDownloads,
    gcGetUntranslated,
    gcGetLlmTranslations,
    gcGetVerbFormExamples,
    gcGetBookChunks,
    gcGetVideoSubtitles,
    parseJwt,
    gcTokenIsValid,
    gcStoreToken,
    gcClearToken,
    gcLoadToken,
    gcGetUserId,
};