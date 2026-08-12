const HISTORY_STORAGE_KEY = "v1-watch-history";
const HISTORY_MAX_ENTRIES = 10;

function loadWatchHistory() {
    const localStorage = window.localStorage;
    let json;
    try {
        json = localStorage.getItem(HISTORY_STORAGE_KEY);
    } catch (e) {
        return [];
    }
    if (json === null) {
        return [];
    }
    try {
        const parsed = JSON.parse(json);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        return [];
    }
}

// Keeps only the most recent position for a given video: an existing entry
// for the same videoId is dropped before the new one is placed at the front,
// so re-watching a video moves it to the top instead of duplicating it.
function saveWatchHistoryEntry(entry) {
    const existing = loadWatchHistory().filter((e) => e.videoId !== entry.videoId);
    const updated = [entry, ...existing].slice(0, HISTORY_MAX_ENTRIES);
    try {
        window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
        console.log("failed to save watch history:", e);
    }
}

export {
    loadWatchHistory,
    saveWatchHistoryEntry,
};
