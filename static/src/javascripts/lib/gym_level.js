class GymLevelStats {
    constructor(practiceRuns, testRuns, testWins) {
        this.practiceRuns = practiceRuns;
        this.testRuns = testRuns;
        this.testWins = testWins;
    }
}

function zeroStats() {
    return new GymLevelStats(0, 0, 0);
}

class GymLevel {
    constructor(levelKey, parentKey, available, completed, stats) {
        this.levelKey = levelKey;
        this.parentKey = parentKey;
        this.available = available;
        this.completed = completed;
        this.stats = stats;
    }
}

export {
    GymLevelStats,
    zeroStats,
    GymLevel,
};