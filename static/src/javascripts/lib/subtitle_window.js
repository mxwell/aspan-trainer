import { loadSubtitles } from "./requests";
import { SUBTITLE_BUFFER_MS, SUBTITLE_WORD_COUNT } from "./subtitles";

// Keeps a window of cues loaded around the playhead of one transcript. The
// caller ticks it with the current position; it decides when that position has
// wandered far enough to need another request, issues it, and hands back the
// cues to render.
//
// Two kinds of load: a *jump* replaces the window (initial load, or a seek that
// lands outside it), a *page* appends the next batch as playback approaches the
// end of what's loaded. Both arrive through the same `onUpdate` callback:
//
//   { loading: true }                          a request started
//   { loading: false }                         it failed
//   { loading: false, mode, items }            cues arrived; `items` is the
//                                              whole window, not just the batch
//
// The caller owns what to do with them - which cue is on screen, what else to
// reset when the window is replaced - since that part differs per app.
//
// Requests in flight when the window is reset (another transcript, teardown)
// are abandoned rather than cancelled: their responses arrive carrying a stale
// token and are dropped.
class SubtitleWindow {
    constructor(onUpdate) {
        this.onUpdate = onUpdate;
        this.transcriptionId = null;
        this.items = [];
        // Word index the next page starts at; -1 once the transcript is exhausted.
        this.next = null;
        // Where the loaded window was requested from, which can precede its first
        // cue - the gap before it is loaded, just silent.
        this.requestStartMs = null;
        // End of the transcript, known only once a response comes back with no
        // next page. Until then there is always more to ask for.
        this.endMs = null;
        this.loading = false;
        this.token = 0;

        this.handleResponse = this.handleResponse.bind(this);
        this.handleError = this.handleError.bind(this);
    }

    // Points the window at another transcript, or at none with a null id.
    reset(transcriptionId) {
        this.token += 1;
        this.transcriptionId = transcriptionId != null ? transcriptionId : null;
        this.items = [];
        this.next = null;
        this.requestStartMs = null;
        this.endMs = null;
        this.loading = false;
    }

    isLoading() {
        return this.loading;
    }

    // Loads the page of cues starting at `positionMs`, dropping whatever is
    // loaded now. For the first load of a transcript, and for seeks that leave
    // the window behind.
    jumpTo(positionMs) {
        if (this.transcriptionId == null) {
            return;
        }
        this.token += 1;
        const token = this.token;
        const seekMs = Math.max(0, positionMs);
        this.setLoading(true);
        loadSubtitles(
            this.transcriptionId,
            { start_ms: seekMs, word_count: SUBTITLE_WORD_COUNT },
            this.handleResponse,
            this.handleError,
            { mode: "jump", token, seekMs },
        );
    }

    // Called with the playhead on every tick. Usually does nothing: only a
    // position that has left the loaded window, or come within the buffer of its
    // end, costs a request.
    syncTo(positionMs) {
        if (this.loading || this.transcriptionId == null) {
            return;
        }
        if (this.endMs != null && positionMs >= this.endMs) {
            return; // past the known end of the transcript
        }
        if (this.items.length === 0) {
            this.jumpTo(positionMs);
            return;
        }
        const loadedStart = this.requestStartMs != null
            ? this.requestStartMs
            : this.items[0].start_ms;
        const loadedEnd = this.items[this.items.length - 1].end_ms;
        if (positionMs < loadedStart - SUBTITLE_BUFFER_MS || positionMs > loadedEnd + SUBTITLE_BUFFER_MS) {
            // Outside the loaded window by more than the buffer → treat as a user jump.
            this.jumpTo(positionMs);
        } else if (positionMs >= loadedEnd - SUBTITLE_BUFFER_MS && this.next != null && this.next !== -1) {
            // Close to the end of the loaded batch → page forward by word index.
            this.requestPage(this.next);
        }
    }

    requestPage(seq) {
        if (this.transcriptionId == null) {
            return;
        }
        this.token += 1;
        const token = this.token;
        const existingEndMs = this.items.length > 0 ? this.items[this.items.length - 1].end_ms : null;
        this.setLoading(true);
        loadSubtitles(
            this.transcriptionId,
            { seq, word_count: SUBTITLE_WORD_COUNT },
            this.handleResponse,
            this.handleError,
            { mode: "page", token, existingEndMs },
        );
    }

    setLoading(loading) {
        this.loading = loading;
        this.onUpdate({ loading });
    }

    async handleResponse(context, responseJsonPromise) {
        const resp = await responseJsonPromise;
        if (context.token !== this.token) {
            console.log("ignore stale subtitles response");
            return;
        }
        const items = (resp.items && resp.items.length > 0) ? resp.items : [];
        const next = (typeof resp.next === "number") ? resp.next : -1;

        this.loading = false;
        this.next = next;
        if (context.mode === "jump") {
            this.items = items;
            this.requestStartMs = context.seekMs;
            const endMs = items.length > 0 ? items[items.length - 1].end_ms : context.seekMs;
            if (next === -1) {
                this.endMs = endMs;
            }
            console.log(`Loaded ${items.length} cues from start_ms=${context.seekMs}, next=${next}, end=${endMs}`);
        } else {
            this.items = this.items.concat(items);
            const endMs = this.items.length > 0 ? this.items[this.items.length - 1].end_ms : context.existingEndMs;
            if (next === -1) {
                this.endMs = endMs;
            }
            console.log(`Paged ${items.length} cues, total ${this.items.length}, next=${next}, end=${endMs}`);
        }
        this.onUpdate({ loading: false, mode: context.mode, items: this.items });
    }

    async handleError(context, responseTextPromise) {
        const text = await responseTextPromise;
        console.log(`subtitles error: ${text}`);
        if (context.token !== this.token) {
            return;
        }
        this.setLoading(false);
    }
}

export { SubtitleWindow };
