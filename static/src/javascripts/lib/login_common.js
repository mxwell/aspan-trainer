import { gcCheckUser, gcClearToken, gcCreateUser, gcGetToken, gcLoadToken, gcStoreToken, gcTokenIsValid, parseJwt } from "./gc_api";
import { i18n } from "./i18n";
import { buildGcCreateUrl, parseParams } from "./url";

function decodeJwtResponse(data){
    const parsed = parseJwt(data);
    console.log(`Parsed JWT: ${JSON.stringify(parsed)}`);
    return parsed.name;
}

function clearError() {
    const errorDiv = document.getElementById("gc_error");
    errorDiv.classList.add("hidden");
}

function displayError(message, lang) {
    const errorDiv = document.getElementById("gc_error");
    errorDiv.textContent = i18n(message, lang);
    errorDiv.classList.remove("hidden");
}

function proceed(lang, returnPath) {
    console.log(`proceed: returnPath ${returnPath}`);
    window.location.href = returnPath || buildGcCreateUrl(lang);
}

function storeTokenAndProceed(gcToken, lang, returnPath) {
    gcStoreToken(gcToken);
    proceed(lang, returnPath);
}

async function handleNewTokenResponse(context, responseJsonPromise) {
    const response = await responseJsonPromise;
    const message = response.message;
    const lang = context.lang;
    const returnPath = context.returnPath;
    if (message == "ok") {
        const gcToken = response.token;
        if (gcToken == null || gcToken.length == 0) {
            displayError("gotEmptyToken");
            return;
        }
        clearError();
        storeTokenAndProceed(gcToken, lang, returnPath);
    } else {
        console.log(`handleNewTokenResponse: message: ${message}`);
        if (context.createUser == true) {
            displayError("failCreateUser", lang);
        } else {
            displayError("failGetToken", lang);
        }
    }
}

async function handleNewTokenError(context, responseTextPromise) {
    let responseText = await responseTextPromise;
    console.log(`handleNewTokenError: ${responseText}`);
    const lang = context.lang;
    if (context.createUser == true) {
        displayError("failCreateUser", lang);
    } else {
        displayError("failGetToken", lang);
    }
}

function issueToken(googleToken, lang, returnPath) {
    gcGetToken(
        googleToken,
        handleNewTokenResponse,
        handleNewTokenError,
        {
            createUser: false,
            lang: lang,
            returnPath: returnPath,
        },
    );
}

function displayNameForm(name, googleToken, lang, returnPath) {
    if (googleToken == null || googleToken.length == 0) {
        console.log("empty google token");
        return;
    }

    const nameInput = document.getElementById("gc_name_input");
    nameInput.value = name;

    const nameForm = document.getElementById("gc_name_form");
    nameForm.addEventListener("submit", function(event) {
        event.preventDefault();
        const name = nameInput.value.trim();
        if (name.length == 0) {
            console.log("empty name");
            return;
        }
        console.log(`Submitting name ${name}`);
        gcCreateUser(
            googleToken,
            name,
            handleNewTokenResponse,
            handleNewTokenError,
            {
                createUser: true,
                lang: lang,
                returnPath: returnPath,
            },
        );
    });
    nameForm.classList.remove("invisible");
}

async function handleGcCheckUserResponse(context, responseJsonPromise) {
    const response = await responseJsonPromise;
    const message = response.message;
    const lang = context.lang;
    const returnPath = context.returnPath;
    if (message == "ok") {
        issueToken(context.googleToken, lang, returnPath);
    } else if (message == "no") {
        displayNameForm(context.name, context.googleToken, lang, returnPath);
    } else {
        console.log(`handleGcCheckUserResponse: fail: ${JSON.stringify(response)}`);
        displayError("tokenFailedVerification", lang);
    }
}

async function handleGcCheckUserError(context, responseTextPromise) {
    let responseText = await responseTextPromise;
    console.log(`handleGcCheckUserError: ${responseText}`);
    const lang = context.lang;
    displayError("failedToVerifyToken", lang);
}

function startGcCheckUser(googleToken, name, lang, returnPath) {
    gcCheckUser(
        googleToken,
        handleGcCheckUserResponse,
        handleGcCheckUserError,
        {
            name: name,
            googleToken: googleToken,
            lang: lang,
            returnPath: returnPath,
        },
    );
}

function handleCredentialResponse(response, lang, returnPath) {
    console.log(`Google ID token (JWT): ${response.credential}`);
    const name = decodeJwtResponse(response.credential);
    startGcCheckUser(response.credential, name, lang, returnPath);
}

function loginSetup(lang) {
    const params = parseParams();
    if (params.logout == "1") {
        gcClearToken();
    }
    const returnPath = params.returnPath;
    console.log(`loginSetup: returnPath ${returnPath}`);
    const gcToken = gcLoadToken();
    if (gcTokenIsValid(gcToken)) {
        console.log("GC token is valid, proceed.")
        proceed(lang, returnPath);
    } else {
        console.log("No valid GC token, need to auth.")
        window.handleCredentialResponse = (
            (response) => { handleCredentialResponse(response, lang, returnPath); }
        );
    }
}

export {
    loginSetup,
};
