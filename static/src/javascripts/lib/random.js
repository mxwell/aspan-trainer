export function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

export function getRandomBool() {
    return Math.random() < 0.5;
}

export function pickRandom(items) {
    return items[getRandomInt(items.length)];
}

export function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; --i) {
        const j = getRandomInt(i + 1);
        [array[i], array[j]] = [array[j], array[i]];
    }
}