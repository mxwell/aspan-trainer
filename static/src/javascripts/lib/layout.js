export function checkForEmulation(reactKeyboardEvent) {
    const code = reactKeyboardEvent.nativeEvent.code;
    const shift = reactKeyboardEvent.shiftKey;
    let replace = null;
    if (code == "Digit2") {
        replace = shift ? "Ә" : "ә";
    } else if (code == "Digit3") {
        replace = shift ? "І" : "і";
    } else if (code == "Digit4") {
        replace = shift ? "Ң" : "ң";
    } else if (code == "Digit5") {
        replace = shift ? "Ғ" : "ғ";
    } else if (code == "Digit8") {
        replace = shift ? "Ү" : "ү";
    } else if (code == "Digit9") {
        replace = shift ? "Ұ" : "ұ";
    } else if (code == "Digit0") {
        replace = shift ? "Қ" : "қ";
    } else if (code == "Minus") {
        replace = shift ? "Ө" : "ө";
    } else if (code == "Equal") {
        replace = shift ? "Һ" : "һ";
    } else if (code == "Slash") {
        replace = "-";
    }
    return replace;
}
