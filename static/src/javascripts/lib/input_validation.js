export function hasMixedAlphabets(s) {
    // check if the string `s` has latin characters
    const latin = /[a-zA-Z]/.test(s);
    // check if the string `s` has cyrillic characters
    const cyrillic = /[а-яА-ЯіІ]/.test(s);
    return latin && cyrillic;
}