// Only "ru" is accepted by the API; English is planned.
const BREAKDOWN_LANG = "ru";

// Status strings the GET carries in the body of a 200 when `ok` is false.
const BREAKDOWN_MISSING = "breakdowns missing";
const BREAKDOWN_PENDING = "breakdowns pending";
const BREAKDOWN_DONE = "breakdowns done";
const BREAKDOWN_NO_SENTENCES = "sentences not found";

// Stop reasons the POST carries when it declines to queue anything.
const ENQUEUE_NO_SENTENCES = "no sentences found";
const ENQUEUE_NO_QUOTA = "no quota";
const ENQUEUE_QUEUE_FULL = "queue full";

// The batch bounds a response reports, widened to include the position we asked
// about. The API documents start_ms/end_ms as the first/last sentence of the
// batch, so the request position falls inside them; the widening only guarantees
// that a batch we have already asked about is never looked up as unknown again,
// which would put the client in a request loop.
function batchSpan(resp, requestMs) {
    const startMs = Math.min(resp.start_ms || 0, requestMs);
    const endMs = Math.max(resp.end_ms || 0, requestMs);
    return { startMs, endMs };
}

function spanContains(span, positionMs) {
    return span != null
        && span.startMs != null
        && positionMs >= span.startMs
        && positionMs <= span.endMs;
}

function findBatch(batches, positionMs) {
    for (const key in batches) {
        if (spanContains(batches[key], positionMs)) {
            return batches[key];
        }
    }
    return null;
}

// Every sentence overlapping [startMs, endMs], across all cached batches - a cue
// sitting on a batch boundary is covered once both sides are loaded.
function sentencesForRange(batches, startMs, endMs) {
    let result = [];
    for (const key in batches) {
        for (const sentence of batches[key].breakdowns) {
            if (sentence.start_ms <= endMs && sentence.end_ms >= startMs) {
                result.push(sentence);
            }
        }
    }
    result.sort((a, b) => a.seq - b.seq);
    return result;
}

function putBatch(batches, entry) {
    return Object.assign({}, batches, { [entry.batchStart]: entry });
}

export {
    BREAKDOWN_LANG,
    BREAKDOWN_MISSING,
    BREAKDOWN_PENDING,
    BREAKDOWN_DONE,
    BREAKDOWN_NO_SENTENCES,
    ENQUEUE_NO_SENTENCES,
    ENQUEUE_NO_QUOTA,
    ENQUEUE_QUEUE_FULL,
    batchSpan,
    spanContains,
    findBatch,
    sentencesForRange,
    putBatch,
};
