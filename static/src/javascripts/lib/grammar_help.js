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

function prepareVerbHelp(map) {
    setEnRu(map, "analyzerTense_infinitive",
        "Verbs in the infinitive form denote an action, process, or state.",
        [],
        "Глаголы в неопределённой форме обозначают действие, процесс или состояние.",
        [
            ["[kaz-tili.kz] Неопределённая форма глагола", "https://www.kaz-tili.kz/gl03.htm"],
        ]
    );
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
    setEnRu(map, "analyzerTense_pastParticiple",
        "The past participle is formed from a verb and denotes an action that has already been completed",
        [],
        "Причастие прошедшего времени образуется из глагола и обозначает уже выполненное действие",
        [
            ["[kaz-tili.kz] Причастия прошедшего времени", "https://www.kaz-tili.kz/prichast1.htm"],
        ]
    );
    setEnRu(map, "analyzerTense_presentParticiple",
        "The participle is formed from a verb and can indicate an action in the past, present, or future",
        [],
        "Причастие образуется из глагола и может указывать на действие в прошлом, настоящем и будущем",
        [
            ["[kaz-tili.kz] Причастия настоящего времени", "https://www.kaz-tili.kz/prichast2.htm"],
        ]
    );
    setEnRu(map, "analyzerTense_futureParticiple",
        "The participle is formed from a verb and can indicate an action in the future",
        [],
        "Причастие образуется из глагола и указывает на действие в будущем",
        [
            ["[kaz-tili.kz] Причастия будущего времени", "https://www.kaz-tili.kz/prichast3.htm"],
        ]
    );
    setEnRu(map, "analyzerTense_perfectGerund",
        "The gerund (or adverbial participle) denotes the completeness of an action",
        [],
        "Деепричастие обозначает завершённость действия",
        [
            ["[kaz-tili.kz] Деепричастия", "https://www.kaz-tili.kz/deeprich.htm"],
        ]
    );
    setEnRu(map, "analyzerTense_continuousGerund",
        "The gerund (or adverbial participle) denotes the duration of an action",
        [],
        "Деепричастие обозначает длительность действия",
        [
            ["[kaz-tili.kz] Деепричастия", "https://www.kaz-tili.kz/deeprich.htm"],
        ]
    );
    setEnRu(map, "analyzerTense_intentionGerund",
        "The gerund (or adverbial participle) has the meaning of purpose",
        [],
        "Деепричастие имеет значение цели",
        [
            ["[kaz-tili.kz] Деепричастия", "https://www.kaz-tili.kz/deeprich.htm"],
        ]
    );
}

function prepareSeptikHelp(map) {
    setEnRu(map, "analyzerSeptik_Ilik",
        "Nouns in the genitive case answer the questions: Kімнің? = Whose? and Ненің? = Of what?",
        [],
        "Существительные в родительном падеже отвечают на вопросы: Кімнің? = Кого? (в смысле Чей? Чья? Чьё?) и Ненің? = Чего?",
        [
            ["[kaz-tili.kz] Родительный падеж", "https://www.kaz-tili.kz/su_rod1.htm"]
        ],
    );
    setEnRu(map, "analyzerSeptik_Barys",
        "Nouns in the dative case answer the questions: Кімге? = To whom?, Неге? = To what?, Қайда? Қай жерге? = Where to?",
        [],
        "Существительные в дательном (или дательно-направительном) падеже отвечают на вопросы: Кімге? = Кому?, Неге? = Чему?, Қайда? Қай жерге? = Куда?",
        [
            ["[kaz-tili.kz] Дательно-направительный падеж", "https://www.kaz-tili.kz/su_mesto3.htm"]
        ],
    );
    setEnRu(map, "analyzerSeptik_Tabys",
        "Nouns in the accusative case answer the questions: Кімді? = Whom? and Нені? = What?",
        [],
        "Существительные в винительном падеже отвечают на вопросы: Кімді? = Кого? и Нені? = Что?",
        [
            ["[kaz-tili.kz] Винительный падеж", "https://www.kaz-tili.kz/su_rod2.htm"]
        ],
    );
    setEnRu(map, "analyzerSeptik_Jatys",
        "Nouns in the local case answer the questions: Кімде? = At whose place?, Неде? = In what?, Қайда? Қай жерде? = Where?, Қашан? = When?",
        [],
        "Существительные в местном падеже отвечают на вопросы: Кімде? = У кого?, Неде? = У чего? В чём?, Қайда? Қай жерде? = Где?, Қашан? = Когда?",
        [
            ["[kaz-tili.kz] Местный падеж", "https://www.kaz-tili.kz/su_mesto2.htm"]
        ],
    );
    setEnRu(map, "analyzerSeptik_Shygys",
        "Nouns in the original case answer the questions: Кімнен? = From whom?, Неден? = From what?, Қайдан? Қай жерден? = From where?",
        [],
        "Существительные в исходном падеже отвечают на вопросы: Кімнен? = От кого?, Неден? = От чего?, Қайдан? Қай жерден? = Откуда?",
        [
            ["[kaz-tili.kz] Исходный падеж", "https://www.kaz-tili.kz/su_mesto1.htm"]
        ],
    );
    setEnRu(map, "analyzerSeptik_Komektes",
        "Nouns in the instrumental case answer the questions: Кіммен? = With whom?, Немен? = With what? / By what?",
        [],
        "Существительные в творительном (или совместном падеже) отвечают на вопросы: Кіммен? = Кем? С кем?, Немен? – Чем? С чем?",
        [
            ["[kaz-tili.kz] Творительный падеж", "https://www.kaz-tili.kz/su_tvorit.htm"]
        ],
    );
}

function prepareWordgenHelp(map) {
    setEnRu(map, "analyzerWordgen_dagy",
        "Relative adjectives in the Kazakh language are formed by adding the endings of the local case and temporal suffixes to nouns. Such adjectives answer the questions: Қайдағы? = Located where? Which one (that is) where?",
        [],
        "Относительные прилагательные образуются через добавление к существительным окончаний местного падежа и временных суффиксов. Такие прилагательные отвечают на вопросы: Қайдағы? = Находящийся где? Который где?",
        [
            ["[kaz-tili.kz] Относительные прилагательные", "https://www.kaz-tili.kz/prilag3.htm"]
        ]
    );
    setEnRu(map, "analyzerWordgen_rak",
        "The comparative degree of adjectives with the meaning of «more»",
        [],
        "Сравнительная степень прилагательных со значением «более»",
        [
            ["[kaz-tili.kz] Степени сравнения прилагательных", "https://www.kaz-tili.kz/prilag2.htm"]
        ]
    );
    setEnRu(map, "analyzerWordgen_dau",
        "The comparative degree of adjectives with the meaning of «slightly» or «a little»",
        [],
        "Сравнительная степень прилагательных со значением «немного» или «чуть-чуть»",
        [
            ["[kaz-tili.kz] Степени сравнения прилагательных", "https://www.kaz-tili.kz/prilag2.htm"]
        ]
    );
}

function prepareGrammarHelp() {
    const map = new Map();

    prepareVerbHelp(map);
    prepareSeptikHelp(map);
    prepareWordgenHelp(map);

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
