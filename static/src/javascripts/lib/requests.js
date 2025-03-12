function extendHeadersWithToken(headers, idToken) {
    if (typeof idToken !== "undefined" && idToken != null) {
        headers["Authorization"] = "Bearer " + idToken;
    }
}

class InvalidAuthTokenException extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
    }
}

function makeGenericApiRequest(method, url, params, successCallback, errorCallback, context, idToken, expectJson) {
    if (method !== "GET" && method !== "POST") {
        throw "unsupported http method " + method;
    }
    if (idToken == null) {
        throw new InvalidAuthTokenException("no auth token is provided");
    }
    let headers = {};
    if (method == "POST") {
       headers["Content-Type"] = "application/json";
    }
    extendHeadersWithToken(headers, idToken);
    let fetchParams = {
        method: method,
        headers: headers,
    };
    if (method == "POST") {
        fetchParams["body"] = JSON.stringify(params);
    }
    fetch(url, fetchParams)
        .then((response) => {
            if (response.ok) {
                if (expectJson)
                    successCallback(context, response.json());
                else
                    successCallback(context, response.text());
            } else {
                errorCallback(context, response.text());
            }
        });
}

function makeGetApiRequest(url, successCallback, errorCallback, context, idToken, expectJson) {
    makeGenericApiRequest("GET", url, null, successCallback, errorCallback, context, idToken, expectJson);
}

function makeJsonApiRequest(url, params, successCallback, errorCallback, context, idToken, expectJson) {
    makeGenericApiRequest("POST", url, params, successCallback, errorCallback, context, idToken, expectJson);
}

/* copied from https://stackoverflow.com/a/111545 */
function encodeQueryData(data) {
    const ret = [];
    for (let d in data)
      ret.push(encodeURIComponent(d) + '=' + encodeURIComponent(data[d]));
    return ret.join('&');
}

function makeSuggestRequest(lastEntered, successCallback, errorCallback, context) {
    const query = encodeQueryData({part: lastEntered});
    const url = `/suggest?${query}`;
    makeGetApiRequest(url, successCallback, errorCallback, context, "lala", true);
}

function makeDetectRequest(lastEntered, suggest, successCallback, errorCallback, context) {
    const params = {
        q: lastEntered,
    };
    if (suggest) {
        params["suggest"] = "1";
    }
    const query = encodeQueryData(params);
    const url = `/detect?${query}`;
    makeGetApiRequest(url, successCallback, errorCallback, context, "lala", true);
}

function makeAnalyzeRequest(lastEntered, successCallback, errorCallback, context) {
    const query = encodeQueryData({q: lastEntered});
    const url = `/analyze?${query}`;
    makeGetApiRequest(url, successCallback, errorCallback, context, "lala", true);
}

function loadTopList(successCallback, errorCallback) {
    const url = `/present_top100_ru_en.colonsv`;
    makeGetApiRequest(url, successCallback, errorCallback, null, "lala", false);
}

export {
    InvalidAuthTokenException,
    makeGetApiRequest,
    makeJsonApiRequest,
    encodeQueryData,
    makeSuggestRequest,
    makeDetectRequest,
    makeAnalyzeRequest,
    loadTopList,
};
