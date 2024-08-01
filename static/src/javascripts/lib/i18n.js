const UI_LANG_KEY = "KAZGRAM_UI_LANG";

const I18N_LANG_EN = "en";
const I18N_LANG_RU = "ru";
const I18N_LANG_KK = "kk";

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

function setEnRuKz(map, key, en, ru, kk) {
    if (map.has(key)) {
        throw new Error(`Key already exists in the map: ${key}`);
    }
    setEntries(map, key, new Map([
        [I18N_LANG_EN, en],
        [I18N_LANG_RU, ru],
        [I18N_LANG_KK, kk],
    ]));
}

function prepareCommonTranslations(map) {
    setEnRuKz(map, "Verb", "Verb", "Глагол", "Етістік");
    setEnRuKz(map, "infinitive", "Infinitive", "Инфинитив", "Инфинитив");
    setEnRuKz(map, "presentTransitive", "Present Indefinite Tense", "Переходное время", "Ауыспалы осы/келер шақ");
    setEnRuKz(map, "presentContinuous", "Present Continuous Tense", "Настоящее время", "Нақ осы шақ");
    setEnRuKz(map, "presentColloquial", "Present Continuous Tense (colloquial)", "Настоящее время (разговорное)", "Нақ осы шақ (сөйлеу)");
    setEnRuKz(map, "remotePast", "Remote Past Tense", "Давнопрошедшее очевидное время", "Бұрынғы өткен шақ");
    setEnRuKz(map, "pastUncertain", "Past Uncertain Tense", "Давнопрошедшее неочевидное время", "Бұрынғы өткен шақ (күмәнді)");
    setEnRuKz(map, "pastTransitive", "Past Transitive Tense", "Прошедшее переходное время", "Ауыспалы өткен шақ");
    setEnRuKz(map, "past", "Simple Past Tense", "Прошедшее время", "Жедел өткен шақ");
    setEnRuKz(map, "possibleFuture", "Possible Future Tense", "Будущее предположительное время", "Болжалды келер шақ");
    setEnRuKz(map, "intentionFuture", "Intended Future Tense", "Будущее время намерения", "Мақсатты келер шақ");
    setEnRuKz(map, "conditionalMood", "Conditional Mood", "Условное наклонение", "Шартты рай");
    setEnRuKz(map, "imperativeMood", "Imperative Mood", "Повелительное наклонение", "Бұйрық рай");
    setEnRuKz(map, "optativeMood", "Optative Mood", "Желательное наклонение", "Қалау рай");
    setEnRuKz(map, "canClause", "Can clause", "Глагол алу в смысле \"мочь\"", "Алу");
    setEnRuKz(map, "participle", "Participle", "Причастие", "Есімше");
    setEnRuKz(map, "pastParticiple", "Past Participle", "Причастие прошедшего времени", "Өткен шақ есімше");
    setEnRuKz(map, "presentParticiple", "Present Participle", "Причастие настоящего времени", "Осы шақ есімше")
    setEnRuKz(map, "futureParticiple", "Future Participle", "Причастие будущего времени", "Келер шақ есімше");

    setEnRuKz(map, "service_error",
        "Service error",
        "Ошибка сервиса",
        "Қызмет қатесі",
    );

    setEnRuKz(map, "chooseVerbExceptionOrNot",
        "The verb has two meanings with one behaving regularly and other behaving like an exception",
        "Глагол имеет два значения, одно спрягается обычным способом, а другое как исключение.",
        "Етістіктің екі мағынасы бар, біріншісі қарапайым әдіспен жіктелсе, екіншісі ережеден тыс арқылы жіктеледі."
    );
}

function prepareViewerOnlyTranslations(map) {
    /* viewer texts */
    setEnRuKz(map, "isLoading",
        "Loading..",
        "Загрузка..",
        "Жүктелуде..",
    );
    setEnRuKz(map, "useFormToFindVerbConj",
        "To find the conjugation of any verb in the Kazakh language, enter the dictionary form of the verb in the field and click 'Submit'.",
        "Чтобы найти спряжение любого глагола в казахском языке, введите словарную форму глагола в поле и нажмите 'Отправить'.",
        "Қазақ тілінде кез келген етістіктің жіктелуін табу үшін, етістіктің сөздік түрін өріске енгізіп, 'Жіберу' түймесін басыңыз.",
    );
    setEnRuKz(map, "hintEnterVerb",
        "Enter verb",
        "Введите глагол",
        "Етістік енгізіңіз",
    );
    setEnRuKz(map, "examples", "Examples", "Примеры", "Мысалдар");
    setEnRuKz(map, "or", "or", "или", "әлде");
    setEnRuKz(map, "mixedAlphabets",
        "Entered verb has both Latin and Cyrillic letters. Generated forms might be incorrect.",
        "Введённый глагол содержит и латинские, и кириллические буквы. Сгенерированные формы могут быть некорректными.",
        "Енгізілген етістіктің қатарында латын және кирилл әріптері бар. Жасалған формалар дұрыс болмауы мүмкін."
    );
    setEnRuKz(map, "failed_recognize_verb",
        "Failed to recognize initial form of Kazakh verb",
        "Не удалось разпознать начальную форму казахского глагола",
        "Етістіктің басқы тұлғасы анықталынбады"
    );
    setEnRuKz(map, "entered_is_form",
        (verb) => `The entered line is a form of the verb «${verb}»`,
        (verb) => `Введённая строка является формой глагола «${verb}»`,
        (verb) => `Енгізілген жол «${verb}» етістігінің бір түрі`,
    );
    setEnRuKz(map, "show_detected",
        (verb) => `Show forms of the verb «${verb}»`,
        (verb) => `Показать формы глагола «${verb}»`,
        (verb) => `«${verb}» етістігінің формаларын көрсету`,
    );
    setEnRuKz(map, "verbHasTwoMeaningsTempl",
        (verb) => `The verb «${verb}» is conjugated in different ways depending on the meaning`,
        (verb) => `Глагол «${verb}» спрягается по-разному в зависимости от значения`,
        (verb) => `«${verb}» етістігі мағынасы бойынша айырымды жолдармен жіктеледі`,
    );
    setEnRuKz(map, "verbMeaningRegularPrefixTempl",
        (verb) => `«${verb}» is conjugated in a regular way if its meaning is`,
        (verb) => `«${verb}» спрягается обычным способом, если его значение`,
        (verb) => `«${verb}» қарапайым жолмен жіктеледі, егер оның мағынасы`,
    );
    setEnRuKz(map, "verbMeaningExceptionPrefixTempl",
        (verb) => `«${verb}» is conjugated in a special way if its meaning is`,
        (verb) => `«${verb}» спрягается особым способом, если его значение`,
        (verb) => `«${verb}» ережеден тыс жолмен жіктеледі, егер оның мағынасы`,
    );
    setEnRuKz(map, "verbMeaningSuffix",
        "",
        "",
        "болса",
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
    setEnRuKz(map, "conjInAllTensesTempl",
        (verb) => `Conjugation of the verb «${verb}» in all tenses and moods of the Kazakh language`,
        (verb) => `Спряжение глагола «${verb}» во всех временах и наклонениях казахского языка`,
        (verb) => `Қазақ тілінің барлық шақтары мен райларындағы «${verb}» етістігінің жіктелуі`,
    );
    setEnRuKz(map, "conjTablesDescrTempl",
        (verb) => `The forms of the verb «${verb}» in the tables have audio pronunciation and highlighting for stems, tense affixes, negative particles, and personal endings.`,
        (verb) => `Формы глагола «${verb}» в таблицах имеют озвучку и подсветку для основ, аффиксов времени, отрицательных частиц и личных окончаний.`,
        (verb) => `Кестелердегі «${verb}» етістігінің формалары түбір, шақ жұрнақтары, болымсыздық бөлшектері мен жіктік жалғауларының дыбысталуы мен бөлектенуін қамтиды.`,
    );

    setEnRu(map, "presentTransitiveDescr",
        "Ауыспалы осы/келер шақ: habitual actions or certain future. Time determined by context",
        "Ауыспалы осы/келер шақ: обычные действия или уверенное будущее. Время определяется контекстом",
    );
    setEnRu(map, "presentContinuousDescr",
        "Нақ осы шақ: action occurring at the current moment",
        "Нақ осы шақ: действие, происходящее в данный момент",
    );
    setEnRu(map, "presentColloquialDescr",
        "Нақ осы шақ: action occurring at the current moment. Colloquial version",
        "Нақ осы шақ: действие, происходящее в данный момент. Разговорная версия",
    );
    setEnRu(map, "pastDescr",
        "Жедел өткен шақ: past action without specifying exact time",
        "Жедел өткен шақ: действие в прошлом без уточнения времени",
    );
    setEnRu(map, "remotePastDescr",
        "Бұрынғы өткен шақ: action in distant past, witnessed by the speaker",
        "Бұрынғы өткен шақ: действие в далеком прошлом, очевидцем которого был говорящий ",
    );
    setEnRu(map, "pastUncertainDescr",
        "Бұрынғы өткен шақ (күмәнді): action in distant past, not witnessed by the speaker",
        "Бұрынғы өткен шақ (күмәнді): действие в далеком прошлом, которому говорящий не был свидетелем",
    );
    setEnRu(map, "pastTransitiveDescr",
        "Ауыспалы өткен шақ: prolonged, repetitive, or habitual action in the past",
        "Ауыспалы өткен шақ: длительное, повторяющееся или привычное действие в прошлом",
    );
    setEnRu(map, "possibleFutureDescr",
        "Болжалды келер шақ: probable future action",
        "Болжалды келер шақ: вероятное будущее действие",
    );
    setEnRu(map, "intentionFutureDescr",
        "Мақсатты келер шақ: future action expressing intention to do something",
        "Мақсатты келер шақ: действие в будущем, выражающее намерение что-либо сделать",
    );
    setEnRu(map, "conditionalMoodDescr",
        "Шартты рай: desired or possible action under certain conditions",
        "Шартты рай: желаемое или возможное действие при определенных условиях",
    );
    setEnRu(map, "imperativeMoodDescr",
        "Бұйрық рай: urging to action in the form of command, request, advice",
        "Бұйрық рай: побуждение к действию в виде приказа, просьбы, совета",
    );
    setEnRu(map, "optativeMoodDescr",
        "Қалау рай: desire or intention of the speaker or others",
        "Қалау рай: желание или намерение говорящего или другого лица",
    );
    setEnRu(map, "canClauseDescr",
        "Ability or possibility to perform an action",
        "Способность или возможность совершить действие",
    );
    setEnRu(map, "participleDescr",
        "Hybrid verb form combining properties of verb and adjective",
        "Гибридная форма глагола, сочетающая свойства глагола и прилагательного",
    );

    setEnRuKz(map, "declLink",
        "declension",
        "склонение",
        "септелу",
    );
    setEnRuKz(map, "titleConjugation",
        "Conjugation",
        "Спряжение",
        "Жіктелу",
    );
    setEnRuKz(map, "titleDeclension",
        "Declension",
        "Склонение",
        "Септелу",
    );
    setEnRuKz(map, "tryOut",
        "try out",
        "попробовать",
        "байқау",
    );
    /* side quiz */
    setEnRuKz(map, "side_quiz", "Fast quiz", "Экспресс-тест");
    setEnRuKz(map, "what_verb_form",
        "What is the verb form?",
        "Что это за форма глагола?",
        "Бұл қандай етістік түрі?"
    );
    setEnRuKz(map, "next", "Next", "Далее", "Келесі");
    setEnRuKz(map, "resultExcellent", "Excellent result!", "Замечательный результат!", "Асағы нәтиже!");
    setEnRuKz(map, "resultGood", "Good result!", "Хороший результат!", "Жақсы нәтиже!");
    setEnRuKz(map, "roomForImprovement", "Room for improvement", "Есть куда расти", "Жетіспеушілікке жол бар");
    setEnRuKz(map, "shouldTryAgain", "You should try again", "Вам стоит попробовать ещё раз", "Сіз қайтадан көріңіз келеді");
    setEnRuKz(map, "yourScore", "Your score", "Ваш счёт", "Сіздің есептіңіз");
    setEnRuKz(map, "restartQuiz", "Restart quiz", "Перезапустить тест", "Тестті жаңағырау");
}

function prepareExplanationOnlyTranslations(map) {
    setEnRu(map, "verb_form_explanation",
        "Verb form explanation",
        "Разбор глагольной формы",
    );
    setEnRu(map, "of_verb",
        "of the verb",
        "глагола",
    );
    setEnRu(map, "sentence",
        "sentence",
        "предложение",
    );
    setEnRu(map, "gp_First",
        "First person",
        "Первое лицо",
    );
    setEnRu(map, "gp_Second",
        "Second person",
        "Второе лицо",
    );
    setEnRu(map, "gp_SecondPolite",
        "Second person (polite address)",
        "Второе лицо (вежливое обращение)",
    );
    setEnRu(map, "gp_Third",
        "Third person",
        "Третье лицо"
    );
    setEnRu(map, "gn_Singular",
        "Singular",
        "Единственное число",
    );
    setEnRu(map, "gn_Plural",
        "Plural",
        "Множественное число",
    );
    setEnRu(map, "form_Statement",
        "Positive form",
        "Утвердительная форма",
    );
    setEnRu(map, "form_Negative",
        "Negative form",
        "Отрицательная форма",
    );
    setEnRu(map, "form_Question",
        "Question form",
        "Вопросительная форма",
    );
    setEnRu(map, "ofTense_presentTransitive",
        "of the present transitive tense",
        "настоящего переходного времени",
    );
    setEnRu(map, "inNumber_Singular",
        "in singular",
        "в единственном числе",
    );
    setEnRu(map, "inNumber_Plural",
        "in plural",
        "во множественном числе",
    );
    setEnRu(map, "ofPerson_First",
        "of the first person",
        "первого лица",
    );
    setEnRu(map, "ofPerson_Second",
        "of the second person",
        "второго лица",
    );
    setEnRu(map, "ofPerson_SecondPolite",
        "of the second person (polite address)",
        "второго лица (вежливое обращение)",
    );
    setEnRu(map, "ofPerson_Third",
        "of the third person",
        "третьего лица",
    );
    setEnRu(map, "consistsOf",
        "consists of",
        "состоит из",
    );
    setEnRu(map, "consistsOfBase",
        "a base",
        "основы",
    );
    setEnRu(map, "consistsOfNegation",
        "a negation particle",
        "отрицательной частицы",
    );
    setEnRu(map, "consistsOfTenseAffix",
        "a tense affix",
        "аффикса времени",
    );
    setEnRu(map, "consistsOfPersAffix",
        "a personal affix",
        "личного окончания",
    );
    setEnRu(map, "consistsOfQuestionParticle",
        "a question particle",
        "вопросительной частицы",
    );
    setEnRu(map, "and",
        "and",
        "и",
    );
    setEnRu(map, "noPersAffix",
        "A personal affix is omitted.",
        "Личное окончание отсутствует.",
    );
    setEnRu(map, "nothing_explain",
        "Nothing to explain",
        "Нечего разбирать",
    );
    setEnRu(map, "title_base",
        "Base",
        "Основа",
    );
    setEnRu(map, "base_strip_u",
        "Regular verb: the base is formed by stripping 'у' or 'ю' at the end of the dictionary form",
        "Обычный глагол: при формировании основы удаляется 'у' или 'ю' на конце словарной формы",
    );
    setEnRu(map, "base_gain_templ",
        (gain) => `Exception verb: the form is formed by stripping 'у' or 'ю' at the end of the dictionary form and by adding '${gain}'`,
        (gain) => `Глагол-исключение: при формировании основы удаляется 'у' или 'ю' на конце словарной формы, затем добавляется '${gain}'`,
    );
    setEnRu(map, "base_gain_inside_templ",
        (gain) => `This special verb gains '${gain}' inside the base ahead of the following consonant`,
        (gain) => `Этот особенный глагол приобретает '${gain}' внутри основы перед последующей согласной`,
    );
    setEnRu(map, "base_replace_b_to_u",
        "The base gets 'б' replaced with 'у' in the case of this particular tense",
        "В основе заменяется 'б' на 'у' в случае этого конкретного времени",
    );
    setEnRu(map, "base_replace_last_cons",
        "The base gets the last consonant replaced to sound better",
        "Последняя согласная в основе заменяется для лучшего звучания",
    );

    setEnRu(map, "title_negation_particle",
        "Negation particle",
        "Отрицательная частица",
    );

    setEnRu(map, "title_tense_affix",
        "Tense affix",
        "Аффикс времени",
    );
    setEnRu(map, "after_consonant_hard",
        "Follows a consonant and a hard base",
        "Следует за согласным звуком и твёрдой основой",
    );
    setEnRu(map, "after_consonant_soft",
        "Follows a consonant and a soft base",
        "Следует за согласным звуком и мягкой основой",
    );
    setEnRu(map, "after_vowel",
        "Follows a vowel",
        "Следует за гласным звуком",
    );
    setEnRu(map, "title_base_affix_junction",
        "Base-affix junction",
        "Слияние основы и аффикса",
    );
    setEnRu(map, "affix_merge_with_base",
        "The affix changes after merge with the last sound of the base",
        "Аффикс меняется из-за слияния с последним звуком основы",
    );

    setEnRu(map, "title_pers_affix",
        "Personal affix",
        "Личное окончание",
    );
    setEnRu(map, "after_hard",
        "Follows a hard syllable",
        "Следует за твёрдым слогом",
    );
    setEnRu(map, "after_soft",
        "Follows a soft syllable",
        "Следует за мягким слогом",
    );
    setEnRu(map, "pers_affix_question_skip",
        "This tense has empty personal affix for interrogative 3rd person",
        "В этом времени пустое личное окончание для вопросительной формы 3-го лица",
    );

    setEnRu(map, "title_question_particle",
        "Question particle",
        "Вопросительная частица",
    );
    setEnRu(map, "after_mnnzhz",
        "Follows [мнңжз]",
        "Следует за [мнңжз]",
    );
    setEnRu(map, "after_unvoiced_bvgd",
        "Follows unvoiced and [бвгд]",
        "Следует за глухими и [бвгд]",
    );
    setEnRu(map, "after_vowels_lruy",
        "Follows vowels and [лруй]",
        "Следует за гласными и [лруй]",
    );
}

function prepareDetectorOnlyTranslations(map) {
    setEnRu(map, "title_verb_detector",
        "Verb detector",
        "Определитель глагола",
    );
    setEnRu(map, "hint_enter_verb_form",
        "Enter verb form",
        "Введите форму глагола",
    );
    setEnRu(map, "no_verb_detected",
        "Failed to detect verb in the entered text",
        "Не удалось обнаружить глагол в введённом тексте",
    );
    setEnRuKz(map, "mixedAlphabetsInForm",
        "Entered form has both Latin and Cyrillic letters. It might affect the detection result.",
        "Введённая форма содержит и латинские, и кириллические буквы. Это может повлиять на результат определения.",
        "Енгізілген форма латын және кирилл әріптерін қамтиды." // FIXME
    );
    setEnRu(map, "linkAllForms",
        "All forms",
        "Все формы",
    );
    setEnRu(map, "enteredFormDetails",
        "Entered form parameters",
        "Параметры введённой формы",
    );
    setEnRu(map, "lookupDictionaries",
        "Lookup dictionaries",
        "Поиск в словарях",
    );
}

function prepareCommonQuizTranslations(map) {
    setEnRuKz(map, "SentenceType", "Sentence type", "Тип предложения", "Сөйлем түрі");

    setEnRuKz(map, "feedbackCorrect",
        "Correct",
        "Верно",
        "Дұрыс",
    );
    setEnRuKz(map, "feedbackWrongAndHereIsCorrect",
        "Wrong:",
        "Неверно:",
        "Бұрыс:",
    );
    setEnRuKz(map, "columnExpected", "Expected", "Ожидалось", "Күтілді");
    setEnRuKz(map, "columnYourAnswers", "Your answers", "Ваши ответы", "Жауаптарыңыз");
}

function prepareQuizOnlyTranslations(map) {
    setEnRuKz(map, "buttonChangeLanguage", "Change interface language", "Изменить язык интерфейса", "Бетбейне тілін өзгерту");
    setEnRuKz(map, "useThisLangInterface", "Use English interface", "Использовать русский интерфейс", "Қазақша бетбейне қолдану");

    /* verb quiz details */
    setEnRuKz(map, "DifficultyLevel", "Difficulty level", "Уровень сложности","Күрделілік деңгейі");
    setEnRuKz(map, "easy", "Easy (one-click)", "Лёгкий (один клик)", "Оңай (бір шерту)");
    setEnRuKz(map, "hard", "Hard (type answer)", "Сложный (печать ответа)", "Қиын (жазып беру)");
    setEnRuKz(map, "AuxVerb", "Auxiliary verb", "Вспомогательный глагол", "Көмекші етістік");
    setEnRuKz(map, "Statement", "Statement", "Утвердительное", "Болымды");
    setEnRuKz(map, "Negative", "Negative", "Отрицательное", "Болымсыз");
    setEnRuKz(map, "Question", "Question", "Вопросительное", "Сұраулы");
    setEnRuKz(map, "StartQuiz", "Start quiz", "Начать тест", "Тестті бастау");

    setEnRuKz(map, "RegularVerb", "Regular verb", "Обычный глагол", "Қарапайым етістік");
    setEnRuKz(map, "ExceptionVerb", "Exception verb", "Глагол-исключение", "Ережеден тыс етістік");
    setEnRuKz(map, "EnteredVerbNotPassed",
        "The verb didn't pass the check. Please, enter a correct verb.",
        "Глагол не прошёл проверку. Пожалуйста, введите корректный глагол.",
        "Етістік тексерістен өтпеді. Өтініш, дұрыс етістік енгізіңіз.",
    );
    setEnRuKz(map, "IncompatibleAuxVerb",
        "The auxiliary verb is not compatible with the main verb. Please, change you choice.",
        "Вспомогательный глагол не совместим с главным глаголом. Пожалуйста, измените ваш выбор.",
        "Көмекші етістік негізгі етістікпен сәйкестенбейді. Өтініш, таңдауыңызды өзгертіңіз.",
    );

    /* quiz texts */
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
    setEnRuKz(map, "buttonRestartQuiz", "Restart the quiz", "Перезапустить тест", "Тестті жалғастыру");
    setEnRuKz(map, "buttonContinueTopic", "Continue with the topic", "Продолжить тему", "Тақырыпты жалғастыру");
    setEnRuKz(map, "buttonChangeTopic", "Change topic", "Поменять тему", "Тақырыпты ауыстыру");
    setEnRuKz(map, "inviteToSurvey", "We'll be glad to hear back. Fill in ", "Будем рады получить обратную связь. Пройдите ", "Кері байланысты қуана аламыз. Толтырыңыз ");
    setEnRuKz(map, "linkShortSurvey", "the short survey", "короткий опрос", "шағын сауалнама");
}

function prepareTopOnlyTranslations(map) {
    setEnRu(map, "present_top_title",
        "Top verbs by Present tense usage",
        "Топ глаголов по использованию настоящего времени",
    );
    setEnRu(map, "column_freq",
        "Frequency",
        "Частота",
    );
    setEnRu(map, "column_forms_link",
        "All forms",
        "Все формы",
    );
    setEnRu(map, "legend",
        "Legend",
        "Легенда",
    );
    setEnRu(map, "frequency_source_is_issai_ksc2",
        "Frequency is calculated using data from train part of ISSAI Kazakh Speech Corpus 2.",
        "Для расчета частотности использовались данные train речевого корпуса ISSAI Kazakh Speech Corpus 2.",
    );
    setEnRu(map, "verb_color_depends_on_aux_likelihood",
        "Verbs are colored differently based on the most probable auxiliary verb",
        "Глаголы отображены разными цветами в зависимости от наиболее вероятного вспомогательного глагола",
    );
    setEnRu(map, "verb_blue_jatyr",
        "blue: жатыр",
        "синий: жатыр",
    );
    setEnRu(map, "verb_green_otyr",
        "green: отыр",
        "зелёный: отыр",
    );
    setEnRu(map, "verb_orange_tur",
        "orange: тұр",
        "оранжевый: тұр",
    );
    setEnRu(map, "verb_red_jur",
        "red: жүр",
        "красный: жүр",
    );
    setEnRu(map, "verb_bold_majority",
        "Bold font is used for verbs that are used with one auxiliary verb in the majority of cases.",
        "Жирным шрифтом отмечены глаголы, которые преимущественно используются только с одним вспомогательным глаголом.",
    );
    setEnRu(map, "feedback_invite",
        "If you have any feedback, e.g. missing popular verb, you can find us in the Telegram group.",
        "Если у вас есть обратная связь, например, отсутствует популярный глагол, вы можете найти нас в Telegram-группе.",
    );
}

function prepareDeclensionAppOnlyTranslations(map) {
    setEnRu(map, "hint_enter_word",
        "Enter word",
        "Введите слово",
    );
    setEnRu(map, "word_two_declensions_templ",
        (word) => `The word «${word}» can be declined in two ways`,
        (word) => `Слово «${word}» можно склонять двумя способами`,
    );
    setEnRu(map, "word_decl_drop_vowel_templ",
        (word) => `«${word}» is declined by dropping a vowel in the last syllable if its meaning is`,
        (word) => `«${word}» склоняется с выпадением гласной в последнем слоге, если его значение`,
    );
    setEnRu(map, "word_decl_keep_vowel_templ",
        (word) => `«${word}» is declined without dropping a vowel if its meaning is`,
        (word) => `«${word}» склоняется без выпадения гласной, если его значение`,
    );
    setEnRu(map, "declension_of",
        "Declension of the Kazakh word",
        "Склонение казахского слова",
    );
    setEnRu(map, "altDeclSources",
        "Alternative services for declension of Kazakh words",
        "Альтернативные сервисы для склонения слов на казахском языке",
    );
    setEnRu(map, "singularSubject",
        "Singular",
        "Единственное число",
    );
    setEnRu(map, "pluralSubject",
        "Plural",
        "Множественное число",
    );
    setEnRu(map, "possessive_First",
        "1st person possessive",
        "Притяжательные формы первого лица",
    );
    setEnRu(map, "possessive_Second",
        "2nd person possessive",
        "Притяжательные формы второго лица",
    );
    setEnRu(map, "possessive_SecondPolite",
        "2nd person possessive (polite)",
        "Притяжательные формы второго лица (вежливые)",
    );
    setEnRu(map, "possessive_Third",
        "3rd person possessive",
        "Притяжательные формы третьего лица",
    );
    setEnRu(map, "possessive_Singular",
        "Singular",
        "Единственное число",
    );
    setEnRu(map, "possessive_Plural",
        "Plural",
        "Множественное число",
    );

    setEnRuKz(map, "septik_0",
        "nominative",
        "именительный",
        "атау",
    );
    setEnRuKz(map, "septik_1",
        "genitive",
        "родительный",
        "ілік",
    );
    setEnRuKz(map, "septik_2",
        "dative",
        "дательный",
        "барыс",
    );
    setEnRuKz(map, "septik_3",
        "accusative",
        "винительный",
        "табыс",
    );
    setEnRuKz(map, "septik_4",
        "local",
        "местный",
        "жатыс",
    );
    setEnRuKz(map, "septik_5",
        "original",
        "исходный",
        "шығыс",
    );
    setEnRuKz(map, "septik_6",
        "instrumental",
        "творительный",
        "көмектес",
    );
}

function prepareGymOnlyTranslations(map) {
    setEnRu(map, "verbGym",
        "Gym",
        "Тренажёрка",
    );
    setEnRu(map, "clickToSelect",
        "Click to select a level",
        "Кликните для выбора уровня",
    );
    setEnRu(map, "presentSimple",
        "Simple Present Tense",
        "Простое настоящее время",
    );
    setEnRu(map, "cheatsheetIntro",
        "The cheatsheet below shows formulas that cover all conjugation forms used on this level. " +
          "The question forms are skipped if they differ from the statement forms only by question particles.",
        "Шпаргалка ниже показывает формулы, которые покрывают все формы спряжения, используемые на этом уровне. " +
          "Вопросительные формы опущены, если они отличаются от утвердительных только вопросительными частицами.",
    );
    setEnRu(map, "base",
        "BASE",
        "ОСНОВА",
    );
    setEnRu(map, "baseExt",
        "ADDITION",
        "ДОБАВЛЕНИЕ",
    );
    setEnRu(map, "baseAux",
        "AUX.",
        "ВСПОМ.",
    );
    setEnRu(map, "tenseAffix",
        "AFFIX",
        "АФФИКС",
    );
    setEnRu(map, "persAffix",
        "PERS.",
        "ЛИЧН.",
    );
    setEnRu(map, "neg",
        "NEGATION",
        "ОТРИЦ.",
    );
    setEnRu(map, "q",
        "QUESTION",
        "ВОПРОС.",
    );
    setEnRu(map, "links",
        "Links",
        "Ссылки",
    );
    setEnRu(map, "linksIntro",
        "To learn more about the topic, you can follow the links below.",
        "Подробнее тему можно изучить по ссылкам ниже.",
    );
    setEnRu(map, "practice",
        "Practice",
        "Практика",
    );
    setEnRu(map, "practiceRunsTempl",
        (runs) => `${runs} practice runs`,
        (runs) => `${runs} запусков практики`,
    );
    setEnRu(map, "test",
        "Test",
        "Тест",
    );
    setEnRu(map, "testRunsTempl",
        (runs) => `${runs} test runs`,
        (runs) => `${runs} запусков теста`,
    );
    setEnRu(map, "testWinsTempl",
        (runs) => `${runs} successful passes`,
        (runs) => `${runs} успешных прохождений`,
    );
    setEnRu(map, "testPassed",
        "Test passed",
        "Тест пройден",
    );
    setEnRu(map, "testNotPassed",
        "Test not passed",
        "Тест не пройден",
    );
    setEnRu(map, "levelAvailAfterTempl",
        (level) => `The level becomes available after passing level «${level}»`,
        (level) => `Этот уровень станет доступным после прохождения уровня «${level}»`,
    );

    setEnRu(map, "negateAux",
        "Negate with an auxiliary verb or word",
        "Отрицание с помощью вспомогательного глагола или слова",
    );
    setEnRu(map, "verbSpecialBehavior",
        "The verb is conjugated in a special way",
        "Глагол спрягается особым способом",
    );
    setEnRu(map, "hintEnterAnswer",
        "Enter the answer",
        "Введите ответ",
    );
    setEnRu(map, "feedbackUnknownAnswer",
        "Unknown answer",
        "Ответ не известен",
    );
    setEnRuKz(map, "btnNext",
        "Next",
        "Далее",
        "Келесі",
    );
    setEnRu(map, "roundCleared",
        "Round cleared!",
        "Раунд завершён!",
    );
    setEnRu(map, "youScored",
        "You scored",
        "Вы набрали",
    );
    setEnRu(map, "columnScore",
        "Points",
        "Очки",
    );
    setEnRu(map, "btnFinish",
        "Finish",
        "Закончить",
    );
}

function prepareGcOnlyTranslations(map) {
    setEnRu(map, "titleGcSearch",
        "Translation search",
        "Поиск перевода",
    );
    setEnRu(map, "hintEnterWord",
        "Enter a word for search",
        "Введите слово для поиска",
    );
    setEnRu(map, "kkru",
        "Kaz -> Rus",
        "Каз -> Рус",
    );
    setEnRu(map, "kken",
        "Kaz -> Eng",
        "Каз -> Англ",
    );
    setEnRu(map, "searchInProgress",
        "Searching…",
        "Поиск…",
    );
    setEnRu(map, "nothingFound",
        "Nothing found",
        "Ничего не найдено",
    );
    setEnRu(map, "en",
        "English",
        "Английский",
    );
    setEnRu(map, "kk",
        "Kazakh",
        "Казахский",
    );
    setEnRu(map, "ru",
        "Russian",
        "Русский",
    );
    setEnRuKz(map, "feVerb",
        "exceptional verb",
        "глагол-исключение",
        "ережеден тыс етістік",
    );

    setEnRu(map, "titleGcCreate",
        "Create translation",
        "Создать перевод",
    );
    setEnRu(map, "transDirection",
        "Translation direction",
        "Направление перевода",
    );
    setEnRu(map, "select",
        "Select",
        "Выберите",
    );
    setEnRu(map, "langWord_en",
        "English word",
        "Английское слово",
    );
    setEnRu(map, "langWord_kk",
        "Kazakh word",
        "Казахское слово",
    );
    setEnRu(map, "langWord_ru",
        "Russian word",
        "Русское слово",
    );
    setEnRu(map, "enterLangWord_en",
        "Enter an English word",
        "Введите английское слово",
    );
    setEnRu(map, "enterLangWord_kk",
        "Enter a Kazakh word",
        "Введите казахское слово",
    );
    setEnRu(map, "enterLangWord_ru",
        "Enter a Russian word",
        "Введите русское слово",
    );
    setEnRu(map, "loadingWords",
        "Loading words…",
        "Загрузка слов…",
    );
    setEnRu(map, "selectExistingOrCreateNew",
        "Select existing word or create a new one",
        "Выберите существующее слово или создайте новое",
    );
    setEnRu(map, "createNewWord",
        "create a new word",
        "создать новое слово",
    );
    setEnRu(map, "selectPos",
        "Select part of speech",
        "Выберите часть речи",
    );
    setEnRu(map, "hintADJ",
        "adjectives, including participles",
        "прилагательные, включая причастия",
    );
    setEnRu(map, "hintADP",
        "adpositions, including prepositions and postpositions",
        "адлоги, то есть предлоги и послелоги",
    );
    setEnRu(map, "hintADV",
        "adverbs, including adverbial participles",
        "наречия, включая деепричастия",
    );
    setEnRu(map, "hintAUX",
        "auxiliary, used in verbal phrases",
        "вспомотельные слова для глагольных фраз",
    );
    setEnRu(map, "hintCCONJ",
        "coordinating conjunctions, such as 'and', 'or', 'but'",
        "соединительные союзы, такие как 'и', 'или', 'но'",
    );
    setEnRu(map, "hintDET",
        "determiners, e.g. articles",
        "определяющие слова, например, артикли",
    );
    setEnRu(map, "hintINTJ",
        "interjections, e.g. exclamations",
        "междометия, например, слова восклицания",
    );
    setEnRu(map, "hintNOUN",
        "common nouns",
        "имена нарицательные (обычные)",
    );
    setEnRu(map, "hintNUM",
        "numerals",
        "числительные",
    );
    setEnRu(map, "hintPART",
        "particles, e.g. negation and question particles",
        "частицы, например, отрицания и вопросительные",
    );
    setEnRu(map, "hintPRON",
        "pronouns",
        "местоимения",
    );
    setEnRu(map, "hintPROPN",
        "proper nouns",
        "имена собственные (названия)",
    );
    setEnRu(map, "hintSCONJ",
        "subordinating conjunctions, e.g. 'that', 'if'",
        "подчинительные союзы, например, 'что', 'если'",
    );
    setEnRu(map, "hintVERB",
        "verbs",
        "глаголы",
    );
    setEnRu(map, "hintX",
        "other",
        "другое",
    );
    setEnRu(map, "comment",
        "Comment",
        "Комментарий",
    );
    setEnRu(map, "creatingTranslation",
        "Creating translation…",
        "Создание перевода…",
    );
    setEnRu(map, "createdTranslation",
        "Created translation",
        "Перевод создан",
    );
    setEnRu(map, "translationAlreadyExists",
        "translation already exists",
        "перевод уже существует",
    );
}

function prepareTranslations() {
    const map = new Map();

    prepareCommonTranslations(map);
    prepareViewerOnlyTranslations(map);
    prepareExplanationOnlyTranslations(map);
    prepareDetectorOnlyTranslations(map);
    prepareCommonQuizTranslations(map);
    prepareQuizOnlyTranslations(map);
    prepareTopOnlyTranslations(map);
    prepareDeclensionAppOnlyTranslations(map);
    prepareGymOnlyTranslations(map);
    prepareGcOnlyTranslations(map);

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

function toggleLangSwitcher(e) {
    e.stopPropagation();
    const langSwitcherContent = document.getElementById("lang_switcher_content");
    if (langSwitcherContent) {
        langSwitcherContent.classList.toggle("hidden");
    }
}

function clickElseWhere() {
    const langSwitcherContent = document.getElementById("lang_switcher_content");
    if (langSwitcherContent && !langSwitcherContent.classList.contains("hidden")) {
        langSwitcherContent.classList.toggle("hidden");
    }
}

function initUiLangSwitcher() {
    const langSwitcherButton = document.getElementById("lang_switcher_btn");
    langSwitcherButton.addEventListener('click', toggleLangSwitcher);
    const grid = document.getElementsByClassName("page-grid");
    if (grid.length == 1) {
        grid[0].addEventListener("click", clickElseWhere);
    }
}

export {
    I18N_LANG_EN,
    I18N_LANG_RU,
    I18N_LANG_KK,
    i18n,
    storeUiLang,
    retrieveUiLang,
    clearUiLang,
    initUiLangSwitcher,
};
