// Only "ru" is accepted by the API; English is planned.
const BREAKDOWN_LANG = "ru";

// Status strings the GET carries in the body of a 200 when `ok` is false.
const BREAKDOWN_MISSING = "breakdowns missing";
const BREAKDOWN_PENDING = "breakdowns pending";
// The job for this batch is producing sentences right now: the response carries
// a `preview` of the sentence at the requested position, and rows start landing
// on the following polls.
const BREAKDOWN_RUNNING = "breakdowns running";
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

// A batch that is still being generated reports its rows in installments, so an
// entry is merged into whatever we already hold for that batch - by sentence
// seq, newest wins - instead of replacing it.
function mergeBatch(batches, entry) {
    const prev = batches[entry.batchStart];
    if (prev == null) {
        return Object.assign({}, batches, { [entry.batchStart]: entry });
    }
    const bySeq = new Map();
    for (const sentence of prev.breakdowns) {
        bySeq.set(sentence.seq, sentence);
    }
    for (const sentence of entry.breakdowns) {
        bySeq.set(sentence.seq, sentence);
    }
    const merged = Object.assign({}, entry, {
        startMs: Math.min(prev.startMs, entry.startMs),
        endMs: Math.max(prev.endMs, entry.endMs),
        breakdowns: Array.from(bySeq.values()).sort((a, b) => a.seq - b.seq),
    });
    return Object.assign({}, batches, { [entry.batchStart]: merged });
}

export {
    BREAKDOWN_LANG,
    BREAKDOWN_MISSING,
    BREAKDOWN_PENDING,
    BREAKDOWN_RUNNING,
    BREAKDOWN_DONE,
    BREAKDOWN_NO_SENTENCES,
    ENQUEUE_NO_SENTENCES,
    ENQUEUE_NO_QUOTA,
    ENQUEUE_QUEUE_FULL,
    batchSpan,
    spanContains,
    findBatch,
    sentencesForRange,
    mergeBatch,
};
