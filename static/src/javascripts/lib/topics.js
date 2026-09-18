const TOPICS_STORAGE_KEY = "v1-watch-topics";
const MIN_TOPICS = 3;

function loadSelectedTopics() {
    let json;
    try {
        json = window.localStorage.getItem(TOPICS_STORAGE_KEY);
    } catch (e) {
        return [];
    }
    if (json === null) {
        return [];
    }
    try {
        const parsed = JSON.parse(json);
        if (!Array.isArray(parsed)) {
            return [];
        }
        return parsed.filter((slug) => typeof slug === "string" && slug.length > 0);
    } catch (e) {
        return [];
    }
}

function saveSelectedTopics(slugs) {
    try {
        window.localStorage.setItem(TOPICS_STORAGE_KEY, JSON.stringify(slugs));
    } catch (e) {
        console.log("failed to save selected topics:", e);
    }
}

export {
    MIN_TOPICS,
    loadSelectedTopics,
    saveSelectedTopics,
};
