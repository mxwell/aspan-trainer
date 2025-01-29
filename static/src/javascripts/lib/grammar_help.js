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
        [
            ["[kaz-tili.kz] Переходное время глагола", "https://www.kaz-tili.kz/glag2.htm"],
        ]
    );
    setEnRu(map, "analyzerTense_presentContinuous",
        "Action occurring at the current moment.",
        [],
        "Действие, происходящее в данный момент.",
        [
            ["[kaz-tili.kz] Настоящее время глагола", "https://www.kaz-tili.kz/glag1.htm"],
        ]
    );
    setEnRu(map, "analyzerTense_remotePast",
        "Action in distant past, witnessed by the speaker.",
        [],
        "Действие в далеком прошлом, очевидцем которого был говорящий.",
        [
            ["[kaz-tili.kz] Давнопрошедшее очевидное время глагола", "https://www.kaz-tili.kz/glag9.htm"],
        ]
    );
    setEnRu(map, "analyzerTense_pastUncertain",
        "Action in distant past, not witnessed by the speaker.",
        [],
        "Действие в далеком прошлом, которому говорящий не был свидетелем.",
        [
            ["[kaz-tili.kz] Давнопрошедшее неочевидное время глагола", "https://www.kaz-tili.kz/glag10.htm"],
        ]
    );
    setEnRu(map, "analyzerTense_pastTransitive",
        "Prolonged, repetitive, or habitual action in the past.",
        [],
        "Длительное, повторяющееся или привычное действие в прошлом.",
        [
            ["[kaz-tili.kz] Переходное прошедшее время глагола", "https://www.kaz-tili.kz/glag11.htm"],
        ]
    );
    setEnRu(map, "analyzerTense_past",
        "Past action without specifying exact time.",
        [],
        "Действие в прошлом без уточнения времени.",
        [
            ["[kaz-tili.kz] Прошедшее время глагола", "https://www.kaz-tili.kz/glag3.htm"],
        ],
    );
    setEnRu(map, "analyzerTense_possibleFuture",
        "Probable future action.",
        [],
        "Вероятное будущее действие.",
        [
            ["[kaz-tili.kz] Будущее предположительное время глагола", "https://www.kaz-tili.kz/glag7.htm"],
        ]
    );
    setEnRu(map, "analyzerTense_intentionFuture",
        "Future action expressing intention to do something.",
        [],
        "Действие в будущем, выражающее намерение что-либо сделать.",
        [
            ["[kaz-tili.kz] Будущее время намерения", "https://www.kaz-tili.kz/glag8.htm"],
        ]
    );
    setEnRu(map, "analyzerTense_imperativeMood",
        "Urging to action in the form of command, request, advice.",
        [],
        "Побуждение к действию в виде приказа, просьбы, совета.",
        [],
    );
    setEnRu(map, "analyzerTense_optativeMood",
        "Desire or intention of the speaker or others.",
        [],
        "Желание или намерение говорящего или другого лица.",
        [],
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
