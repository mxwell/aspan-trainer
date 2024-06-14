class GymLevel {
    constructor(levelKey, available, completed, stats) {
        this.levelKey = levelKey;
        this.available = available;
        this.completed = completed;
        this.stats = stats;
    }
}

export { GymLevel };