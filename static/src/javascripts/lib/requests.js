function extendHeadersWithToken(headers, idToken) {
    if (typeof idToken !== "undefined" && idToken != null) {
        headers["Authorization"] = "Bearer " + idToken;
    }
}

function makeGenericApiRequest(method, url, params, successCallback, errorCallback, context, idToken) {
    if (method !== "GET" && method !== "POST") {
        throw "unsupported http method " + method;
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
                successCallback(context, response.json());
            } else {
                errorCallback(context, response.text());
            }
        });
}

function makeGetApiRequest(url, successCallback, errorCallback, context, idToken) {
    makeGenericApiRequest("GET", url, null, successCallback, errorCallback, context, idToken);
}

function makeJsonApiRequest(url, params, successCallback, errorCallback, context, idToken) {
    makeGenericApiRequest("POST", url, params, successCallback, errorCallback, context, idToken);
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
    makeGetApiRequest(url, successCallback, errorCallback, context, "lala");
}

function makeDetectRequest(lastEntered, successCallback, errorCallback, context) {
    const query = encodeQueryData({q: lastEntered});
    const url = `/detect?${query}`;
    makeGetApiRequest(url, successCallback, errorCallback, context, "lala");
}


export {
    makeSuggestRequest,
    makeDetectRequest,
};
