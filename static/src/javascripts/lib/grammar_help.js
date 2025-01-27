import { I18N_LANG_EN, I18N_LANG_RU } from "./i18n";

let GRAMMAR_HELP = null;

function setEntries(map, key, entries) {
    map.set(key, entries);
}

function setEnRu(map, key, en, enLinks, ru, ruLinks) {
    setEntries(map, key, new Map([
        [I18N_LANG_EN, [en, enLinks]],
        [I18N_LANG_RU, [ru, ruLinks]],
    ]));
}

function prepareGrammarHelp() {
    const map = new Map();

    setEnRu(map, "analyzerTense_presentTransitive",
        "Habitual actions or certain future. Time determined by context.",
        [],
        "Обычные действия или уверенное будущее. Время определяется контекстом.",
        ["https://www.kaz-tili.kz/glag2.htm"]
    );
    setEnRu(map, "analyzerTense_presentContinuous",
        "Action occurring at the current moment",
        [],
        "Действие, происходящее в данный момент",
        ["https://www.kaz-tili.kz/glag1.htm"],
    );

    return map;
}

function getGrammarHelp() {
    if (GRAMMAR_HELP == null) {
        GRAMMAR_HELP = prepareGrammarHelp();
    }
    return GRAMMAR_HELP;
}

export function grammarHelp(key, lang) {
    const grammarHelp = getGrammarHelp();
    if (grammarHelp.has(key)) {
        const map = grammarHelp.get(key);
        if (map.has(lang)) {
            return map.get(lang);
        }
    }
    return grammarHelp.get(key);
}
