const UI_LANG_KEY = "KAZGRAM_UI_LANG";

const I18N_LANG_EN = "en";
const I18N_LANG_RU = "ru";
const I18N_LANG_KZ = "kz";

var TEXT_TRANSLATIONS = null;

function setEntries(map, key, entries) {
    map.set(key, entries);
}

function setEnRu(map, key, en, ru) {
    setEntries(map, key, new Map([
        [I18N_LANG_EN, en],
        [I18N_LANG_RU, ru],
    ]));
}

function setEnRuKz(map, key, en, ru, kz) {
    setEntries(map, key, new Map([
        [I18N_LANG_EN, en],
        [I18N_LANG_RU, ru],
        [I18N_LANG_KZ, kz],
    ]));
}

function prepareTranslations() {
    const map = new Map();

    setEnRu(map, "buttonChangeLanguage", "Change interface language", "Изменить язык интерфейса");
    setEnRu(map, "useThisLangInterface", "Use English interface", "Использовать русский интерфейс");

    /* topic names */
    setEnRuKz(map, "presentTransitive", "Present transitive tense", "Настоящее переходное время", "Ауыспалы осы/келер шақ");
    setEnRuKz(map, "presentContinuous", "Present continuous tense", "Настоящее время", "Нақ осы шақ");
    setEnRuKz(map, "remotePastTense", "Remote past tense", "Давнопрошедшее очевидное время", "Бұрынғы өткен шақ");
    setEnRuKz(map, "pastUncertainTense", "Past uncertain tense", "Давнопрошедшее неочевидное время", "Күмәнді өткен шақ");
    setEnRuKz(map, "pastTense", "Past tense", "Прошедшее время", "Жедел өткен шақ");
    setEnRuKz(map, "possibleFuture", "Possible future tense", "Будущее предположительное время", "Болжалды келер шақ");
    setEnRuKz(map, "intentionFuture", "Intention future tense", "Будущее время намерения", "Мақсатты келер шақ");
    setEnRuKz(map, "wantClause", "Want clause", "Желательное наклонение", "Қалау рай");
    setEnRuKz(map, "canClause", "Can clause", "Глагол алу в смысле \"мочь\"", "Алу");

    /* verb quiz details */
    setEnRu(map, "DifficultyLevel", "Difficulty level", "Уровень сложности");
    setEnRu(map, "easy", "Easy (one-click)", "Лёгкий (один клик)");
    setEnRu(map, "hard", "Hard (type answer)", "Сложный (печать ответа)");
    setEnRu(map, "SentenceType", "Sentence type", "Тип предложения");
    setEnRu(map, "Verb", "Verb", "Глагол");
    setEnRu(map, "AuxVerb", "Auxiliary verb", "Вспомогательный глагол");
    setEnRu(map, "Statement", "Statement", "Утвердительное");
    setEnRu(map, "Negative", "Negative", "Отрицательное");
    setEnRu(map, "Question", "Question", "Вопросительное");
    setEnRu(map, "StartQuiz", "Start quiz", "Начать тест");
    setEnRu(map, "chooseVerbExceptionOrNot",
        "The verb has two meanings with one behaving regularly and other behaving like an exception",
        "Глагол имеет два значения, одно спрягается обычным способом, а другое как исключение"
    );
    setEnRu(map, "RegularVerb", "Regular verb", "Обычный глагол");
    setEnRu(map, "ExceptionVerb", "Exception verb", "Глагол-исключение");
    setEnRu(map, "EnteredVerbNotPassed",
        "The verb didn't pass the check. Please, enter a correct verb.",
        "Глагол не прошёл проверку. Пожалуйста, введите корректный глагол."
    );
    setEnRu(map, "IncompatibleAuxVerb",
        "The auxiliary verb is not compatible with the main verb. Please, change you choice.",
        "Вспомогательный глагол не совместим с главным глаголом. Пожалуйста, измените ваш выбор."
    );

    /* quiz texts */
    setEnRu(map, "feedbackCorrect", "Correct", "Верно");
    setEnRu(map, "feedbackWrongAndHereIsCorrect", "Wrong! Correct answer:", "Неверно! Правильный ответ:");
    setEnRu(map, "buttonSubmit", "Submit", "Отправить");
    setEnRu(map, "statement", "statement", "утвердительное");
    setEnRu(map, "negative", "negative", "отрицательное");
    setEnRu(map, "question", "question", "вопросительное");
    setEnRu(map, "quizSentenceOfVerb", "sentence with the verb", "предложение с глаголом");
    setEnRu(map, "quizForFirstPerson", "for first person", "для первого лица");
    setEnRu(map, "quizForSecondPerson", "for second person", "для второго лица");
    setEnRu(map, "quizForSecondPolitePerson", "for second person (polite addressing)", "для второго лица (вежливое обращение)");
    setEnRu(map, "quizForThirdPerson", "for third person", "для третьего лица");
    setEnRu(map, "quizForSingularNumber", "in singular number", "в единственном числе");
    setEnRu(map, "quizForPluralNumber", "in plural number", "во множественном числе");

    /* final form */
    setEnRu(map, "quizDone", "Quiz is done! Correct responses:", "Тест завершён! Правильные ответы:");
    setEnRu(map, "columnExpected", "Expected", "Ожидалось");
    setEnRu(map, "columnYourAnswers", "Your answers", "Ваши ответы");
    setEnRu(map, "buttonRestartQuiz", "Restart the quiz", "Перезапустить тест");
    setEnRu(map, "buttonContinueTopic", "Continue with the topic", "Продолжить тему");
    setEnRu(map, "buttonChangeTopic", "Change topic", "Поменять тему");
    setEnRu(map, "inviteToSurvey", "We'll be glad to hear back. Fill in ", "Будем рады получить обратную связь. Пройдите ");
    setEnRu(map, "linkShortSurvey", "the short survey", "короткий опрос");

    return map;
}

function getTextTranslations() {
    if (TEXT_TRANSLATIONS == null) {
        TEXT_TRANSLATIONS = prepareTranslations();
    }
    return TEXT_TRANSLATIONS;
}

function i18n(key, language) {
    const textTranslations = getTextTranslations();
    if (textTranslations.has(key)) {
        const translations = textTranslations.get(key);
        if (translations.has(language)) {
            return translations.get(language);
        }
        if (translations.has(I18N_LANG_EN)) {
            return translations.get(I18N_LANG_EN);
        }
    }
    return `<TRANSLATION_NOT_FOUND: ${key}>`;
}

function checkLang(lang) {
    return lang == I18N_LANG_EN || lang == I18N_LANG_RU;
}

function storeUiLang(lang) {
    if (!checkLang(lang)) {
        console.log(`Trying to store invalid value to localStorage at key ${UI_LANG_KEY}: ${lang}, ignoring it`);
        return false;
    }
    window.localStorage.setItem(UI_LANG_KEY, lang);
    return true;
}

function retrieveUiLang() {
    const localStorage = window.localStorage;
    var lang = localStorage.getItem(UI_LANG_KEY);
    if (!checkLang(lang)) {
        console.log(`Invalid value retrieved from localStorage at key ${UI_LANG_KEY}: ${lang}, clearing it`);
        localStorage.removeItem(UI_LANG_KEY);
        lang = null;
    }
    return lang;
}

function clearUiLang() {
    console.log(`Removing value from localStorage at key ${UI_LANG_KEY}`);
    window.localStorage.removeItem(UI_LANG_KEY);
}

export {
    I18N_LANG_EN,
    I18N_LANG_RU,
    I18N_LANG_KZ,
    i18n,
    storeUiLang,
    retrieveUiLang,
    clearUiLang,
};