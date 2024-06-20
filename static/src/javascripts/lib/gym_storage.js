class GymLevelStats {
    constructor(practiceRuns, testRuns, testWins) {
        this.practiceRuns = practiceRuns;
        this.testRuns = testRuns;
        this.testWins = testWins;
    }

    levelCompleted() {
        return this.testWins > 0;
    }

    merge(other) {
        if (other == null) {
            return new GymLevelStats(
                this.practiceRuns,
                this.testRuns,
                this.testWins,
            );
        }
        const practiceRuns = this.practiceRuns + other.practiceRuns;
        const testRuns = this.testRuns + other.testRuns;
        const testWins = this.testWins + other.testWins;
        return new GymLevelStats(
            practiceRuns,
            testRuns,
            testWins,
        );
    }
}

function zeroStats() {
    return new GymLevelStats(0, 0, 0);
}

function getStorePrefix(gymName, levelKey) {
    return `v1-g-${gymName}-l-${levelKey}`;
}

function getStatsKey(gymName, levelKey) {
    const prefix = getStorePrefix(gymName, levelKey);
    return `${prefix}-stats`;
}

function loadGymLevelStats(gymName, levelKey) {
    const localStorage = window.localStorage;
    const json = localStorage.getItem(getStatsKey(gymName, levelKey));
    if (json === null) {
        console.log(`No gym level stats found for ${gymName} and ${levelKey}`);
        return null;
    }
    const j = JSON.parse(json);
    if (j.practiceRuns === undefined || j.testRuns === undefined || j.testWins === undefined) {
        console.log(`Invalid gym level stats found for ${gymName} and ${levelKey}`);
        return null;
    }
    return new GymLevelStats(
        j.practiceRuns,
        j.testRuns,
        j.testWins,
    );
}

function storeGymLevelStats(gymName, levelKey, stats) {
    const localStorage = window.localStorage;
    const key = getStatsKey(gymName, levelKey);
    console.log(`Storing gym level stats for ${gymName} and ${levelKey}`);
    localStorage.setItem(key, JSON.stringify(stats));
}

function updateGymLevelStats(gymName, levelKey, update) {
    const existing = loadGymLevelStats(gymName, levelKey);
    const updated = update.merge(existing);
    storeGymLevelStats(gymName, levelKey, updated);
}

/**
 * Accepts an array of level keys and returns an array of stats for each level.
 */
function loadAllGymStats(gymName, levelKeys) {
    const stats = [];
    for (const levelKey of levelKeys) {
        const s = loadGymLevelStats(gymName, levelKey);
        if (s != null) {
            stats.push(s);
        } else {
            stats.push(zeroStats());
        }
    }
    return stats;
}

export {
    GymLevelStats,
    loadAllGymStats,
    updateGymLevelStats,
}