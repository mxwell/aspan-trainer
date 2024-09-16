import { I18N_LANG_EN, I18N_LANG_KK, I18N_LANG_RU } from "./i18n";

export function hasMixedAlphabets(s) {
    // check if the string `s` has latin characters
    const latin = /[a-zA-Z]/.test(s);
    // check if the string `s` has cyrillic characters
    const cyrillic = /[а-яА-ЯіІ]/.test(s);
    return latin && cyrillic;
}

export function trimAndLowercase(s) {
    return s.trim().toLowerCase();
}

const EN_WORD_PATTERN = /^[A-Za-z-'/ ]+$/;
const KK_WORD_PATTERN = /^[А-Яа-я-'ЁӘІҢҒҮҰҚӨҺёәіңғүұқөһ/ ]+$/;
const RU_WORD_PATTERN = /^[А-Яа-я-'ё/ ]+$/;

export function validateDictWord(s, lang) {
    if (s.length == 0) {
        return true;
    }
    if (lang == I18N_LANG_EN) {
        return EN_WORD_PATTERN.test(s);
    } else if (lang == I18N_LANG_KK) {
        return KK_WORD_PATTERN.test(s);
    } else if (lang == I18N_LANG_RU) {
        return RU_WORD_PATTERN.test(s);
    }
    throw new Error(`validateDictWord: unsupported language ${lang}`);
}
