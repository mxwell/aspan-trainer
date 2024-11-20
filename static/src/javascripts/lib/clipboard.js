export function copyToClipboard(text) {
    console.log(`Copying ${text}`);
    navigator.clipboard.writeText(text);
}
