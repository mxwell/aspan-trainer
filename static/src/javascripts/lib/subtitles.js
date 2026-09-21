// Playback-side helpers shared by the apps that show timed subtitle cues:
// which cue belongs on screen at a given playhead position, which word inside
// it is being spoken, where a click on a word should seek to, and when the
// next tick has to run for either of those to stay accurate.

// How far outside the loaded window the playhead may drift before more cues are
// requested: past the end it pages forward, before the start it re-jumps.
const SUBTITLE_BUFFER_MS = 10000;
const SUBTITLE_WORD_COUNT = 150;
const TICK_MS = 500;
const MIN_TICK_MS = 50;

function formatCueTimestamp(ms) {
    const totalSec = Math.floor(ms / 1000);
    const millis = ms % 1000;
    const secs = totalSec % 60;
    const mins = Math.floor(totalSec / 60) % 60;
    const hours = Math.floor(totalSec / 3600);
    const pad2 = (n) => (n < 10 ? `0${n}` : `${n}`);
    const pad3 = (n) => (n < 10 ? `00${n}` : (n < 100 ? `0${n}` : `${n}`));
    const base = hours > 0
        ? `${pad2(hours)}:${pad2(mins)}:${pad2(secs)}`
        : `${pad2(mins)}:${pad2(secs)}`;
    return `${base}.${pad3(millis)}`;
}

// Returns the single cue to display at `positionMs`: the cue that contains the
// position when one is playing, otherwise the next upcoming cue (during a silent
// gap). `upcoming` is true in the gap case so the view can de-emphasize it.
function computeDisplayedCue(positionMs, subtitles) {
    let containing = -1;
    let nextIdx = -1;
    for (let i = 0; i < subtitles.length; ++i) {
        const sub = subtitles[i];
        if (sub.start_ms > positionMs) {
            nextIdx = i; // first cue starting after us → upcoming
            break;
        }
        if (positionMs <= sub.end_ms) {
            containing = i; // position is within [start_ms, end_ms] → playing
            break;
        }
    }
    if (containing !== -1) return { index: containing, upcoming: false };
    if (nextIdx !== -1) return { index: nextIdx, upcoming: true };
    return { index: -1, upcoming: false };
}

// Returns the index of the currently active item - the last one whose start has
// passed - so the highlight persists through any micro-gap until the next item
// begins. Returns -1 if before the first item. `startOf` returns an item's start
// in ms, or null for items that carry no timing (never active, and skipped over
// so a timed item's highlight survives them).
function computeActiveIndex(positionMs, items, startOf) {
    let active = -1;
    for (let i = 0; i < items.length; ++i) {
        const start = startOf(items[i]);
        if (start == null) continue;
        if (start > positionMs) break;
        active = i;
    }
    return active;
}

function computeActiveWordIndex(positionMs, words) {
    return computeActiveIndex(positionMs, words, (w) => w.start_ms);
}

const CLICK_SEEK_LEAD_MS = 500;

// Where to jump when a word is clicked. Seeking exactly to a word's start tends
// to clip its first phoneme, so back up a little - but never past the
// predecessor, or the click would replay the word before the one asked for.
// `prevBoundaryMs` is where the predecessor of the cue's first word ends.
function computeSeekTargetMs(words, wordIndex, prevBoundaryMs) {
    const word = words[wordIndex];
    const prevEnd = wordIndex > 0 ? words[wordIndex - 1].end_ms : prevBoundaryMs;
    // Timings can touch or overlap, so the gap needs a floor of zero.
    const gap = Math.max(0, word.start_ms - prevEnd);
    return Math.max(0, word.start_ms - Math.min(CLICK_SEEK_LEAD_MS, gap));
}

// Computes how long to wait before the next tick so it lands as close as
// possible to the next event that could change what's displayed: the next
// word's start (for word highlighting), the next cue's start (during a
// silent gap), or a bounded fallback poll otherwise. Clamped to
// [MIN_TICK_MS, TICK_MS] so a seek that doesn't produce a player state-change
// event (a known YouTube IFrame API quirk) is still caught within TICK_MS.
function computeNextTickDelayMs(positionMs, playbackRate, subtitles, cueIndex, upcoming, activeWordIndex) {
    const rate = playbackRate > 0 ? playbackRate : 1;

    if (cueIndex === -1 || cueIndex >= subtitles.length) {
        return TICK_MS;
    }

    const cue = subtitles[cueIndex];
    let targetMs;
    if (upcoming) {
        targetMs = cue.start_ms;
    } else {
        const words = cue.words || [];
        const nextWord = words[activeWordIndex + 1];
        targetMs = nextWord ? nextWord.start_ms : cue.end_ms;
    }

    const delay = (targetMs - positionMs) / rate;
    return Math.min(TICK_MS, Math.max(MIN_TICK_MS, delay));
}

export {
    SUBTITLE_BUFFER_MS,
    SUBTITLE_WORD_COUNT,
    TICK_MS,
    MIN_TICK_MS,
    formatCueTimestamp,
    computeDisplayedCue,
    computeActiveIndex,
    computeActiveWordIndex,
    computeSeekTargetMs,
    computeNextTickDelayMs,
};
