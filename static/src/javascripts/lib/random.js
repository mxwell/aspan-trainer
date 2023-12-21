export function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

export function pickRandom(items) {
    return items[getRandomInt(items.length)];
}