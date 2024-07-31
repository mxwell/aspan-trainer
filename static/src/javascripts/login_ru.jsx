import { gcCheckUser, gcCreateUser, gcGetToken, gcLoadToken, gcStoreToken, parseJwt } from './lib/gc_api';
import { initUiLangSwitcher } from './lib/i18n';
import { buildGcCreateUrl } from './lib/url';
import { initViewerMenuButton } from './lib/viewer_menu';

initViewerMenuButton();
initUiLangSwitcher();

function decodeJwtResponse(data){
    const parsed = parseJwt(data);
    console.log(`Parsed JWT: ${JSON.stringify(parsed)}`);
    return parsed.name;
}

function clearError() {
    const errorDiv = document.getElementById("gc_error");
    errorDiv.classList.add("hidden");
}

function displayError(message) {
    const errorDiv = document.getElementById("gc_error");
    errorDiv.textContent = message;
    errorDiv.classList.remove("hidden");
}

function proceed() {
    const url = buildGcCreateUrl();
    window.location.href = url;
}

function storeTokenAndProceed(gcToken) {
    gcStoreToken(gcToken);
    proceed();
}

async function handleNewTokenResponse(context, responseJsonPromise) {
    const response = await responseJsonPromise;
    const message = response.message;
    if (message == "ok") {
        const gcToken = response.token;
        if (gcToken == null || gcToken.length == 0) {
            displayError("Получен пустой токен");
            return;
        }
        clearError();
        storeTokenAndProceed(gcToken);
    } else {
        console.log(`handleNewTokenResponse: message: ${message}`);
        if (context.createUser == true) {
            displayError("Не удалось создать пользователя");
        } else {
            displayError("Не удалось получить токен");
        }
    }
}

async function handleNewTokenError(context, responseTextPromise) {
    let responseText = await responseTextPromise;
    console.log(`handleNewTokenError: ${responseText}`);
    if (context.createUser == true) {
        displayError("Не удалось создать пользователя");
    } else {
        displayError("Не удалось получить токен");
    }
}

function issueToken(googleToken) {
    gcGetToken(
        googleToken,
        handleNewTokenResponse,
        handleNewTokenError,
        {
            createUser: false,
        },
    );
}

function displayNameForm(name, googleToken) {
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
            },
        );
    });
    nameForm.classList.remove("invisible");
}

async function handleGcCheckUserResponse(context, responseJsonPromise) {
    const response = await responseJsonPromise;
    const message = response.message;
    if (message == "ok") {
        issueToken(context.googleToken);
    } else if (message == "no") {
        displayNameForm(context.name, context.googleToken);
    } else {
        console.log(`handleGcCheckUserResponse: fail: ${JSON.stringify(response)}`);
        displayError("Токен не прошёл проверку");
    }
}

async function handleGcCheckUserError(context, responseTextPromise) {
    let responseText = await responseTextPromise;
    console.log(`handleGcCheckUserError: ${responseText}`);
    displayError("Не удалось проверить токен");
}

function startGcCheckUser(googleToken, name) {
    gcCheckUser(
        googleToken,
        handleGcCheckUserResponse,
        handleGcCheckUserError,
        {
            name: name,
            googleToken: googleToken,
        },
    );
}

function handleCredentialResponse(response) {
    console.log(`Google ID token (JWT): ${response.credential}`);
    const name = decodeJwtResponse(response.credential);
    startGcCheckUser(response.credential, name);
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

function initialSetup() {
    const gcToken = gcLoadToken();
    if (gcTokenIsValid(gcToken)) {
        console.log("GC token is valid, proceed.")
        proceed();
    } else {
        console.log("No valid GC token, need to auth.")
        window.handleCredentialResponse = handleCredentialResponse;
    }
}

initialSetup();
