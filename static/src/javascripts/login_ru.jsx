import { initUiLangSwitcher } from './lib/i18n';
import { initViewerMenuButton } from './lib/viewer_menu';

initViewerMenuButton();
initUiLangSwitcher();

function parseJwt (token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}

function decodeJwtResponse(data){
    const parsed = parseJwt(data);
    console.log(`Parsed JWT: ${JSON.stringify(parsed)}`);
}

function handleCredentialResponse(response) {
    decodeJwtResponse(response.credential);
}

window.handleCredentialResponse = handleCredentialResponse;