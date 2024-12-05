import { abKeyAsParam } from "./ab";
import { auxVerbAsParam } from "./aux_verbs";
import { I18N_LANG_EN, I18N_LANG_RU } from "./i18n";
import { trimAndLowercase } from "./input_validation";
import { sentenceTypeAsParam } from "./sentence";

function parseParams() {
    const search = location.search;
    if (search.length <= 0 || !search.startsWith("?")) {
        return {};
    }
    const tokens = search.substring(1).split("&");
    let result = {};
    for (let i = 0; i < tokens.length; i++) {
        const pair = tokens[i].split("=");
        if (pair.length !== 2) {
            continue;
        }
        result[pair[0]] = decodeURI(pair[1]);
    }
    return result;
}

function buildUrl(path, params) {
    return `${path}?${params.join("&")}`;
}

function buildDeclensionUrl(subject, forceAlternative, lang) {
    const path = `/declension_${lang}.html`;
    if (subject == null || subject.length == 0) {
        return path;
    }
    let params = [
        `subject=${encodeURI(subject)}`,
    ];
    if (forceAlternative) {
        params.push("alternative=true");
    }
    return buildUrl(path, params);
}

function buildParticipleDeclensionUrl(verb, participle, sentenceType, lang) {
    let params = [
        `verb=${encodeURI(verb)}`,
        `participle=${participle}`,
    ];
    if (sentenceType != null && sentenceType != "Statement") {
        params.push(`sentence_type=${sentenceType}`);
    }
    const path = `/declension_${lang}.html`;
    return buildUrl(path, params);
}

function buildExplanationUrl(verb, tense, sentenceType, forceExceptional, person, number, lang) {
    let params = [
        `verb=${encodeURI(verb)}`,
        `tense=${tense}`,
        `sentence_type=${sentenceType}`,
        `person=${person}`,
        `number=${number}`
    ];
    if (forceExceptional) {
        params.push("exception=true");
    }
    const path = `/explanation_${lang}.html`;
    return buildUrl(path, params);
}

function buildVerbDetectorUrl(form, lang) {
    let params = [
        `form=${encodeURI(form)}`,
    ];
    const path = `/verb_detector_${lang}.html`;
    return buildUrl(path, params);
}

function buildTextAnalyzerUrl(text, lang) {
    let params = [];
    if (text.length > 0) {
        params.push(`text=${encodeURI(text)}`);
    }
    const path = `/text_analyzer_${lang}.html`;
    return buildUrl(path, params);
}

function buildDictUrl(word, lang) {
    const path = `/dict_${lang}.html`;
    if (word == null || word.length == 0) {
        return path;
    }
    let params = [`w=${encodeURI(word)}`];
    return buildUrl(path, params);
}

function doBuildViewerUrl(verb, sentenceType, forceExceptional, abKey, lang, auxVerb, auxNeg, eg) {
    if (auxVerb === undefined) {
        throw new Error("auxVerb is undefined in buildViewerUrl2");
    }
    if (auxNeg === undefined) {
        throw new Error("auxNeg is undefined in buildViewerUrl2");
    }
    let params = [
        `verb=${encodeURI(verb)}`,
    ];
    const sentenceTypeParam = sentenceTypeAsParam(sentenceType);
    if (sentenceTypeParam != null) {
        params.push(sentenceTypeParam);
    }
    if (forceExceptional) {
        params.push("exception=true");
    }
    const abKeyParam = abKeyAsParam(abKey);
    if (abKeyParam != null) {
        params.push(abKeyParam);
    }
    const auxVerbParam = auxVerbAsParam(auxVerb);
    if (auxVerbParam != null) {
        params.push(auxVerbParam);
    }
    if (auxNeg == true) {
        params.push("aux_neg=true");
    }
    if (eg == true) {
        params.push("eg=true");
    }
    const path = (
        (lang == I18N_LANG_RU)
        ? "/"
        : `/${lang}/`
    );
    return buildUrl(path, params);
}

function buildViewerUrl2(verb, sentenceType, forceExceptional, abKey, lang, auxVerb, auxNeg) {
    return doBuildViewerUrl(verb, sentenceType, forceExceptional, abKey, lang, auxVerb, auxNeg, /* eg */ false);
}

function buildViewerWithExamplesUrl(verb, sentenceType, forceExceptional, abKey, lang, auxVerb, auxNeg) {
    return doBuildViewerUrl(verb, sentenceType, forceExceptional, abKey, lang, auxVerb, auxNeg, /* eg */ true);
}

function buildVerbFormAudioUrl(verb, fe, text) {
    let params = [
        `v=${encodeURI(trimAndLowercase(verb))}`,
        `f=${encodeURI(text.toLowerCase())}`,
    ];
    if (fe == true) {
        params.push(`fe=1`);
    }
    return buildUrl("https://kazakhverb.khairulin.com/api/v1/tts", params);
}

function buildVerbGymUrl(lang) {
    if (lang == I18N_LANG_RU) {
        return "/verb_gym_ru.html";
    }
    return "/verb_gym_en.html";
}

function buildGcLandingUrl(lang) {
    const fixedLang = (lang == I18N_LANG_RU) ? lang : I18N_LANG_EN;
    return `/gc_landing_${fixedLang}.html`;
}

function buildGcLoginUrl(lang, returnPath) {
    const path = `/login_${lang}.html`;
    if (returnPath == null || !returnPath.startsWith("/")) {
        return path;
    }
    const params = [
        `returnPath=${encodeURIComponent(returnPath)}`,
    ];
    return buildUrl(path, params);
}

function buildGcSearchUrl(word, src, dst, lang) {
    let params = [
        `w=${encodeURI(trimAndLowercase(word))}`,
        `src=${encodeURI(src)}`,
        `dst=${encodeURI(dst)}`,
    ];
    const path = `/gc_search_${lang}.html`;
    return buildUrl(path, params);
}

function buildGcCreateUrl(lang) {
    return `/gc_create_${lang}.html`;
}

function buildGcCreatePrefilledUrl(word, src, dst, lang) {
    let params = [
        `w=${encodeURI(trimAndLowercase(word))}`,
        `src=${encodeURI(src)}`,
        `dst=${encodeURI(dst)}`,
    ];
    const path = `/gc_create_${lang}.html`;
    return buildUrl(path, params);
}

function buildGcReviewsUrl(offset, dir, approvesMin, lang) {
    let params = [];
    if (dir) {
        params.push(`dir=${dir}`);
    }
    if (approvesMin != null) {
        params.push(`am=${approvesMin}`);
    }
    if (offset > 0) {
        params.push(`o=${offset}`);
    }
    const path = `/gc_reviews_${lang}.html`;
    return buildUrl(path, params);
}

function buildGlosbeUrl(verb, lang) {
    return `https://glosbe.com/kk/${lang}/${encodeURI(verb)}`;
}

function buildLugatUrl(verb, lang) {
    let params = [
        `p=voc`,
        `word=${encodeURI(verb)}`,
    ];
    if (lang == I18N_LANG_RU) {
        params.push(`vocid=4`);
    } else if (lang == I18N_LANG_EN) {
        params.push(`vocid=1`);
    }
    return buildUrl("https://www.lugat.kz/index.php", params);
}

function buildSozdikUrl(verb, lang) {
    if (lang != I18N_LANG_RU) {
        return null;
    }
    return `https://sozdik.kz/ru/dictionary/translate/kk/${lang}/${encodeURI(verb)}/`;
}

export {
    buildDeclensionUrl,
    buildParticipleDeclensionUrl,
    buildExplanationUrl,
    buildVerbDetectorUrl,
    buildTextAnalyzerUrl,
    buildDictUrl,
    buildViewerUrl2,
    buildViewerWithExamplesUrl,
    buildVerbFormAudioUrl,
    buildVerbGymUrl,
    buildGcLandingUrl,
    buildGcLoginUrl,
    buildGcSearchUrl,
    buildGcCreateUrl,
    buildGcCreatePrefilledUrl,
    buildGcReviewsUrl,
    parseParams,
    buildGlosbeUrl,
    buildLugatUrl,
    buildSozdikUrl,
};
