const UI_LANG_KEY = "KAZGRAM_UI_LANG";

const I18N_LANG_EN = "en";
const I18N_LANG_RU = "ru";
const I18N_LANG_KZ = "kk";

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

function prepareCommonTranslations(map) {
    /* topic names */
    setEnRuKz(map, "presentTransitive", "Present transitive tense", "Настоящее переходное время", "Ауыспалы осы/келер шақ");
    setEnRuKz(map, "presentContinuous", "Present continuous tense", "Настоящее время", "Нақ осы шақ");
    setEnRuKz(map, "remotePastTense", "Remote past tense", "Давнопрошедшее очевидное время", "Бұрынғы өткен шақ");
    setEnRuKz(map, "pastUncertainTense", "Past uncertain tense", "Давнопрошедшее неочевидное время", "Күмәнді өткен шақ");
    setEnRuKz(map, "pastTransitiveTense", "Past transitive tense", "Прошедшее переходное время", "Ауыспалы өткен шақ");
    setEnRuKz(map, "pastTense", "Past tense", "Прошедшее время", "Жедел өткен шақ");
    setEnRuKz(map, "possibleFuture", "Possible future tense", "Будущее предположительное время", "Болжалды келер шақ");
    setEnRuKz(map, "intentionFuture", "Intention future tense", "Будущее время намерения", "Мақсатты келер шақ");
    setEnRuKz(map, "conditionalMood", "Conditional mood", "Условное наклонение", "Шартты рай");
    setEnRuKz(map, "imperativeMood", "Imperative mood", "Повелительное наклонение", "Бұйрық рай");
    setEnRuKz(map, "optativeMood", "Optative mood", "Желательное наклонение", "Қалау рай");
    setEnRuKz(map, "canClause", "Can clause", "Глагол алу в смысле \"мочь\"", "Алу");

    setEnRuKZ(map, "chooseVerbExceptionOrNot",
        "The verb has two meanings with one behaving regularly and other behaving like an exception",
        "Глагол имеет два значения, одно спрягается обычным способом, а другое как исключение.",
        "Етістіктің екі мағынасы бар, біріншісі қарапайым әдіспен жіктелсе, екіншісі ережеден тыс арқылы жіктеледі."
    );
}

function prepareViewerOnlyTranslations(map) {
    /* viewer texts */
    setEnRuKz(map, "hintEnterVerb",
        "Enter verb",
        "Введите глагол",
        "Етістік енгізіңіз",
    );
    setEnRuKz(map, "examples", "Examples", "Примеры", "Мысалдар");
    setEnRuKz(map, "or", "or", "или", "әлде");
    setEnRuKz(map, "failed_recognize_verb",
        "Failed to recognize initial form of Kazakh verb",
        "Не удалось разпознать начальную форму казахского глагола",
        "Етістіктің басқы тұлғасы анықталынбады"
    );
    setEnRuKz(map, "switch_to_exception",
        "Switch to the exception verb",
        "Переключиться на глагол-исключение",
        "Ережеден тыс етістікке ауысу"
    );
    setEnRuKz(map, "switch_to_regular",
        "Switch to the regular verb",
        "Переключиться на обычный глагол",
        "Қарапайым етістікке ауысу"
    );
    setEnRuKz(map, "wiktionary_title",
        "Wiktionary",
        "Викисловарь",
        "Уикисөздік",
    );
    setEnRuKz(map, "translation_by_wiktionary",
        "Translation by Wiktionary",
        "Перевод Викисловаря",
        "Уикисөздіктегі аудармасы",
    )
    setEnRuKz(map, "no_translation",
        "no translation found",
        "перевод не найден",
        "аударма табылмады"
    );

    /* side quiz */
    setEnRuKz(map, "side_quiz", "Fast quiz", "Экспресс-тест");
    setEnRuKz(map, "what_verb_form",
        "What is the verb form?",
        "Что это за форма глагола?",
        "Бұл қандай етістік түрі?"
    );
}

function prepareQuizOnlyTranslations(map) {
    setEnRuKz(map, "buttonChangeLanguage", "Change interface language", "Изменить язык интерфейса", "Бетбейне тілін өзгерту");
    setEnRuKz(map, "useThisLangInterface", "Use English interface", "Использовать русский интерфейс", "Қазақша бетбейне қолдану");

    /* verb quiz details */
    setEnRuKz(map, "DifficultyLevel", "Difficulty level", "Уровень сложности","Күрделілік деңгейі");
    setEnRuKz(map, "easy", "Easy (one-click)", "Лёгкий (один клик)", "Оңай (бір шерту)");
    setEnRuKz(map, "hard", "Hard (type answer)", "Сложный (печать ответа)", "Қиын (жазып беру)");
    setEnRuKz(map, "SentenceType", "Sentence type", "Тип предложения", "Сөйлем түрі");
    setEnRuKz(map, "Verb", "Verb", "Глагол", "Етістік");
    setEnRuKz(map, "AuxVerb", "Auxiliary verb", "Вспомогательный глагол", "Көмекші етістік");
    setEnRuKz(map, "Statement", "Statement", "Утвердительное", "Болымды");
    setEnRuKz(map, "Negative", "Negative", "Отрицательное", "Болымсыз");
    setEnRuKz(map, "Question", "Question", "Вопросительное", "Сұраулы");
    setEnRuKz(map, "StartQuiz", "Start quiz", "Начать тест", "Тестті бастау");

    setEnRuKz(map, "RegularVerb", "Regular verb", "Обычный глагол", "Қарапайым етістік");
    setEnRuKz(map, "ExceptionVerb", "Exception verb", "Глагол-исключение", "Ережеден тыс етістік");
    setEnRuKz(map, "EnteredVerbNotPassed",
        "The verb didn't pass the check. Please, enter a correct verb.",
        "Глагол не прошёл проверку. Пожалуйста, введите корректный глагол."
        "Етістік тексерістен өтпеді. Өтініш, дұрыс етістік енгізіңіз."
    );
    setEnRuKz(map, "IncompatibleAuxVerb",
        "The auxiliary verb is not compatible with the main verb. Please, change you choice.",
        "Вспомогательный глагол не совместим с главным глаголом. Пожалуйста, измените ваш выбор."
        "Көмекші етістік негізгі етістікпен сәйкестенбейді. Өтініш, таңдауыңызды өзгертіңіз."
    );

    /* quiz texts */
    setEnRuKz(map, "feedbackCorrect", "Correct", "Верно", "Дұрыс");
    setEnRuKz(map, "feedbackWrongAndHereIsCorrect", "Wrong! Correct answer:", "Неверно! Правильный ответ:", "Бұрыс! Дұрыс жауабы:");
    setEnRuKz(map, "buttonSubmit", "Submit", "Отправить", "Жіберу");
    setEnRuKz(map, "statement", "statement", "утвердительное", "болымды");
    setEnRuKz(map, "negative", "negative", "отрицательное", "болымсыз");
    setEnRuKz(map, "question", "question", "вопросительное", "сұраулы");
    setEnRuKz(map, "quizSentenceOfVerb", "sentence with the verb", "предложение с глаголом", "етістігі бар сөйлем");
    setEnRuKz(map, "quizForFirstPerson", "for first person", "для первого лица", "бірінші жақ");
    setEnRuKz(map, "quizForSecondPerson", "for second person", "для второго лица", "екінші жақ (анайы)");
    setEnRuKz(map, "quizForSecondPolitePerson", "for second person (polite addressing)", "для второго лица (вежливое обращение)", "екінші жақ (сыпайы)");
    setEnRuKz(map, "quizForThirdPerson", "for third person", "для третьего лица", "үшінші жақ");
    setEnRuKz(map, "quizForSingularNumber", "in singular number", "в единственном числе", "жекеше түрде");
    setEnRuKz(map, "quizForPluralNumber", "in plural number", "во множественном числе", "көпше түрде");

    /* final form */
    setEnRuKz(map, "quizDone", "Quiz is done! Correct responses:", "Тест завершён! Правильные ответы:", "Тест аяқталды! Дұрыс жауаптар:");
    setEnRuKz(map, "columnExpected", "Expected", "Ожидалось", "Күтілді");
    setEnRuKz(map, "columnYourAnswers", "Your answers", "Ваши ответы", "Жауаптарыңыз");
    setEnRuKz(map, "buttonRestartQuiz", "Restart the quiz", "Перезапустить тест", "Тестті жалғастыру");
    setEnRuKz(map, "buttonContinueTopic", "Continue with the topic", "Продолжить тему", "Тақырыпты жалғастыру");
    setEnRuKz(map, "buttonChangeTopic", "Change topic", "Поменять тему", "Тақырыпты ауыстыру");
    setEnRuKz(map, "inviteToSurvey", "We'll be glad to hear back. Fill in ", "Будем рады получить обратную связь. Пройдите ", "Кері байланысты қуана аламыз. Толтырыңыз ");
    setEnRuKz(map, "linkShortSurvey", "the short survey", "короткий опрос", "шағын сауалнама");
}

function prepareTranslations() {
    const map = new Map();

    prepareCommonTranslations(map);
    prepareViewerOnlyTranslations(map);
    prepareQuizOnlyTranslations(map);

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

function toggleLangSwitcher() {
    const langSwitcherContent = document.getElementById("lang_switcher_content");
    if (langSwitcherContent) {
        langSwitcherContent.classList.toggle("hidden");
    }
}

function initUiLangSwitcher() {
    const langSwitcherButton = document.getElementById("lang_switcher_btn");
    langSwitcherButton.addEventListener('click', toggleLangSwitcher);
}

export {
    I18N_LANG_EN,
    I18N_LANG_RU,
    I18N_LANG_KZ,
    i18n,
    storeUiLang,
    retrieveUiLang,
    clearUiLang,
    initUiLangSwitcher,
};
