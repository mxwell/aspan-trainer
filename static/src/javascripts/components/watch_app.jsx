import React from "react";
import { buildWatchUrl, parseParams } from "../lib/url";
import { i18n } from "../lib/i18n";
import { probeVideo, fetchVideo, loadSubtitles, loadSuggestedVideos } from "../lib/requests";

const APP_MODE_PROMPT = 1;
const APP_MODE_PROCESSING = 2;
const APP_MODE_WATCH = 3;
const APP_MODE_ERROR = 4;
const APP_MODE_PREVIEW = 5;
const APP_MODE_PROBING = 6;

const VIDEO_PLAYING = 1;

const SUBTITLE_BUFFER_MS = 10000;
const SUBTITLE_WORD_COUNT = 150;
const TICK_MS = 500;
const MIN_TICK_MS = 50;
const PROCESSING_POLL_MS = 10000;

function isValidYouTubeVideoId(id) {
    return /^[a-zA-Z0-9_-]{11}$/.test(id);
}

function extractYouTubeVideoId(url) {
    // Accept a bare 11-character video ID directly.
    if (isValidYouTubeVideoId(url)) {
        return url;
    }

    try {
        const parsed = new URL(url);
        const host = parsed.hostname.replace(/^www\./, '');

        if (host === 'youtube.com' || host === 'm.youtube.com') {
            const id = parsed.searchParams.get('v');
            return id && isValidYouTubeVideoId(id) ? id : '';
        }

        if (host === 'youtu.be') {
            const id = parsed.pathname.slice(1); // remove leading "/"
            return isValidYouTubeVideoId(id) ? id : '';
        }

        return '';
    } catch (e) {
        return '';
    }
}

function formatDuration(totalSecs) {
    const secs = totalSecs % 60;
    const mins = Math.floor(totalSecs / 60) % 60;
    const hours = Math.floor(totalSecs / 3600);
    const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
    if (hours > 0) {
        return `${hours}:${pad(mins)}:${pad(secs)}`;
    }
    return `${mins}:${pad(secs)}`;
}

function formatElapsedDuration(totalMs) {
    const totalSecs = Math.max(0, Math.floor(totalMs / 1000));
    const secs = totalSecs % 60;
    const mins = Math.floor(totalSecs / 60) % 60;
    const hours = Math.floor(totalSecs / 3600);
    if (hours > 0) {
        return `${hours}h ${mins}m ${secs}s`;
    }
    if (mins > 0) {
        return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
}

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

// Returns the index of the currently active word within `words` — the last
// word whose start_ms has passed — so the highlight persists through any
// micro-gap until the next word begins. Returns -1 if before the first word.
function computeActiveWordIndex(positionMs, words) {
    let active = -1;
    for (let i = 0; i < words.length; ++i) {
        if (words[i].start_ms > positionMs) break;
        active = i;
    }
    return active;
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

function isProcessingState(state) {
    return state === "fetch_pending" || state === "fetch_running"
        || state === "asr_pending" || state === "asr_running";
}

function processStatusKey(state) {
    switch (state) {
        case "at_capacity": return "statusQueueFull";
        case "fetch_pending": return "statusPending";
        case "fetch_running":
        case "asr_pending":
        case "asr_running": return "statusProcessing";
        case "failed": return "statusFailed";
        case "done": return "statusDone";
        default: return "statusPending";
    }
}

class WatchApp extends React.Component {
    constructor(props) {
        super(props);

        const state = this.readUrlState();

        this.state = state;

        this.inputRef = React.createRef();
        this.onSubmit = this.onSubmit.bind(this);
        this.startProbe = this.startProbe.bind(this);
        this.handleProbeSuccess = this.handleProbeSuccess.bind(this);
        this.handleProbeError = this.handleProbeError.bind(this);
        this.handleFetchSuccess = this.handleFetchSuccess.bind(this);
        this.handleFetchError = this.handleFetchError.bind(this);
        this.onGenerateClick = this.onGenerateClick.bind(this);
        this.onRefreshClick = this.onRefreshClick.bind(this);
        this.onProceedClick = this.onProceedClick.bind(this);
        this.startProcessingPoll = this.startProcessingPoll.bind(this);
        this.stopProcessingPoll = this.stopProcessingPoll.bind(this);
        this.pollProcessingStatus = this.pollProcessingStatus.bind(this);
        this.onPopState = this.onPopState.bind(this);
        this.resetToPrompt = this.resetToPrompt.bind(this);
        this.onInputChange = this.onInputChange.bind(this);
        this.enterWatchMode = this.enterWatchMode.bind(this);
        this.bootYouTubePlayer = this.bootYouTubePlayer.bind(this);
        this.loadVideo = this.loadVideo.bind(this);
        this.onPlayerReady = this.onPlayerReady.bind(this);
        this.onPlayerStateChange = this.onPlayerStateChange.bind(this);
        this.onPlayerRateChange = this.onPlayerRateChange.bind(this);
        this.tick = this.tick.bind(this);
        this.updateCurrentCue = this.updateCurrentCue.bind(this);
        this.loadSubtitlesIfNeeded = this.loadSubtitlesIfNeeded.bind(this);
        this.requestSubtitlesJump = this.requestSubtitlesJump.bind(this);
        this.requestSubtitlesPage = this.requestSubtitlesPage.bind(this);
        this.handleSubtitlesResponse = this.handleSubtitlesResponse.bind(this);
        this.handleSubtitlesError = this.handleSubtitlesError.bind(this);
        this.handleSuggestedVideosSuccess = this.handleSuggestedVideosSuccess.bind(this);
        this.handleSuggestedVideosError = this.handleSuggestedVideosError.bind(this);
        this.onSuggestedVideoClick = this.onSuggestedVideoClick.bind(this);

        this.player = null;
        this.playerReady = false;
        this.tickTimer = null;
        this.processPollTimer = null;
        this.processTickTimer = null;
        this.transcriptionId = null;
        this.subtitlesEndMs = null;
        this.subLoadToken = 0;
        this.lastPositionMs = 0;
    }

    makeState(appMode, videoId) {
        return {
            appMode: appMode,
            videoId: videoId || null,
            suggestedVideos: [],
        }
    }

    readUrlState() {
        const videoId = parseParams().v;
        if (videoId && isValidYouTubeVideoId(videoId)) {
            return this.makeState(APP_MODE_PROBING, videoId);
        }
        return this.makeState(APP_MODE_PROMPT, null);
    }

    componentDidMount() {
        window.addEventListener("popstate", this.onPopState);
        if (this.state.videoId) {
            this.probeById(this.state.videoId);
        } else {
            loadSuggestedVideos(this.handleSuggestedVideosSuccess, this.handleSuggestedVideosError);
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.appMode !== APP_MODE_WATCH && this.state.appMode === APP_MODE_WATCH) {
            this.enterWatchMode();
        }
        if (prevState.appMode !== APP_MODE_PROCESSING && this.state.appMode === APP_MODE_PROCESSING) {
            this.setState({ processStartedAt: Date.now() });
            this.startProcessingPoll();
        } else if (prevState.appMode === APP_MODE_PROCESSING && this.state.appMode !== APP_MODE_PROCESSING) {
            this.stopProcessingPoll();
        }
    }

    componentWillUnmount() {
        window.removeEventListener("popstate", this.onPopState);
        this.stopProcessingPoll();
        if (this.tickTimer) {
            clearTimeout(this.tickTimer);
            this.tickTimer = null;
        }
        if (this.player) {
            try {
                this.player.destroy();
            } catch (e) {
                // ignore — player may already be gone
            }
            this.player = null;
        }
        this.playerReady = false;
        if (window.onYouTubeIframeAPIReady === this.loadVideo) {
            window.onYouTubeIframeAPIReady = null;
        }
    }

    i18n(key) {
        return i18n(key, this.props.lang);
    }

    startProbe(videoUrl) {
        const id = extractYouTubeVideoId(videoUrl);
        if (!id) {
            this.setState({ promptError: this.i18n("invalidYtUrl") });
            return;
        }

        this.setState({ promptError: null });
        this.probeById(id);
    }

    onInputChange() {
        if (this.state.promptError) {
            this.setState({ promptError: null });
        }
    }

    probeById(id) {
        if (!isValidYouTubeVideoId(id)) {
            console.warn("not a valid YouTube video id:", id);
            return;
        }

        this.setState({ appMode: APP_MODE_PROBING });
        probeVideo(id, this.handleProbeSuccess, this.handleProbeError);
    }

    onSubmit(e) {
        e.preventDefault();

        const videoUrl = this.inputRef.current.value.trim();
        this.startProbe(videoUrl);
    }

    async handleProbeSuccess(context, responseJsonPromise) {
        const probe = await responseJsonPromise;
        console.log("probe result", probe);

        const processState = probe.process && probe.process.state;

        if (processState === "new") {
            this.setState({ appMode: APP_MODE_PREVIEW, probe, proceeding: false });
            this.pushVideoUrl(probe.info.online_video_id);
        } else if (processState === "done") {
            this.setState({ appMode: APP_MODE_WATCH, probe, proceeding: false, subtitlesLoading: true });
            this.pushVideoUrl(probe.info.online_video_id);
        } else if (isProcessingState(processState)) {
            this.setState({ appMode: APP_MODE_PROCESSING, probe, process: probe.process, processUpdatedAt: Date.now(), proceeding: false });
            this.pushVideoUrl(probe.info.online_video_id);
        } else if (processState === "failed") {
            const errorMessage = (probe.process && probe.process.error_message) || this.i18n("service_error");
            this.setState({ appMode: APP_MODE_ERROR, errorMessage, proceeding: false });
        } else {
            this.setState({ appMode: APP_MODE_ERROR, errorMessage: this.i18n("videoNotPreviewable"), proceeding: false });
        }
    }

    pushVideoUrl(videoId) {
        if (parseParams().v === videoId) {
            return;
        }
        const url = buildWatchUrl([`v=${encodeURI(videoId)}`], this.props.lang);
        window.history.pushState(null, "", url);
    }

    // Fires on browser back/forward. Re-derive intent from the URL rather than
    // trusting event.state, since we never push a state object.
    onPopState() {
        const videoId = parseParams().v;
        if (videoId && isValidYouTubeVideoId(videoId)) {
            const currentVideoId = this.state.probe && this.state.probe.info && this.state.probe.info.online_video_id;
            if (videoId !== currentVideoId) {
                this.probeById(videoId);
            }
        } else {
            this.resetToPrompt();
        }
    }

    // Tears down whatever mode we were in (polling, YT player, subtitle tracking)
    // and returns to a clean APP_MODE_PROMPT, e.g. after navigating back past the
    // point where a video id first entered the URL.
    resetToPrompt() {
        this.stopProcessingPoll();
        if (this.tickTimer) {
            clearTimeout(this.tickTimer);
            this.tickTimer = null;
        }
        if (this.player) {
            try {
                this.player.destroy();
            } catch (e) {
                // ignore — player may already be gone
            }
            this.player = null;
        }
        this.playerReady = false;
        this.transcriptionId = null;
        this.subtitlesEndMs = null;
        this.subLoadToken = 0;
        this.lastPositionMs = 0;
        if (this.inputRef.current) {
            this.inputRef.current.value = "";
        }
        this.setState({
            appMode: APP_MODE_PROMPT,
            videoId: null,
            probe: null,
            process: null,
            processStartedAt: null,
            processUpdatedAt: null,
            promptError: null,
            errorMessage: null,
            refreshing: false,
            proceeding: false,
            subtitles: [],
            next: null,
            currentCueIndex: -1,
            currentCueUpcoming: false,
            positionMs: 0,
            subtitlesLoading: false,
            subtitlesRequestStartMs: null,
        });
    }

    async handleProbeError(context, responseTextPromise) {
        const text = await responseTextPromise;
        console.log("probe error:", text);
        this.setState({ appMode: APP_MODE_ERROR, errorMessage: this.extractErrorMessage(text), proceeding: false });
    }

    extractErrorMessage(responseText) {
        try {
            const parsed = JSON.parse(responseText);
            if (parsed && parsed.error && parsed.error.message) {
                return parsed.error.message;
            }
        } catch (e) {
            // response wasn't JSON
        }
        return this.i18n("service_error");
    }

    onGenerateClick() {
        const id = this.state.probe && this.state.probe.id;
        if (!id) {
            console.warn("no internal video id on probe");
            return;
        }

        this.setState({ appMode: APP_MODE_PROCESSING });
        fetchVideo(id, this.handleFetchSuccess, this.handleFetchError);
    }

    onRefreshClick() {
        const id = this.state.probe && this.state.probe.id;
        if (!id) {
            console.warn("no internal video id for refresh");
            return;
        }

        this.setState({ refreshing: true });
        fetchVideo(id, this.handleFetchSuccess, this.handleFetchError);
    }

    onProceedClick() {
        const id = this.state.probe && this.state.probe.info && this.state.probe.info.online_video_id;
        if (!id) {
            this.setState({ appMode: APP_MODE_WATCH });
            return;
        }
        // Re-probe: the /fetch response carries no transcriptions, so we need a fresh
        // probe (with transcriptions populated for state "done") before entering WATCH.
        this.setState({ proceeding: true });
        probeVideo(id, this.handleProbeSuccess, this.handleProbeError);
    }

    async handleFetchSuccess(context, responseJsonPromise) {
        const process = await responseJsonPromise;
        console.log("fetch result", process);
        this.setState({ process: process, processUpdatedAt: Date.now(), refreshing: false });
        if (process && (process.state === "failed" || process.state === "done")) {
            this.stopProcessingPoll();
        }
    }

    async handleFetchError(context, responseTextPromise) {
        const text = await responseTextPromise;
        console.log("fetch error:", text);
        this.setState({ appMode: APP_MODE_ERROR, errorMessage: this.extractErrorMessage(text), refreshing: false });
    }

    // ===== APP_MODE_PROCESSING: poll for job status while ASR/fetch is running =====

    startProcessingPoll() {
        this.stopProcessingPoll();
        this.processPollTimer = setInterval(this.pollProcessingStatus, PROCESSING_POLL_MS);
        // Re-render every second so the "Waiting Xm Ys…" readout ticks live.
        this.processTickTimer = setInterval(() => this.forceUpdate(), 1000);
    }

    stopProcessingPoll() {
        if (this.processPollTimer) {
            clearInterval(this.processPollTimer);
            this.processPollTimer = null;
        }
        if (this.processTickTimer) {
            clearInterval(this.processTickTimer);
            this.processTickTimer = null;
        }
    }

    pollProcessingStatus() {
        const process = this.state.process;
        if (process && (process.state === "failed" || process.state === "done")) {
            this.stopProcessingPoll();
            return;
        }
        const id = this.state.probe && this.state.probe.id;
        if (!id) {
            return;
        }
        fetchVideo(id, this.handleFetchSuccess, this.handleFetchError);
    }

    // ===== APP_MODE_WATCH: embedded YouTube player + paged subtitles =====

    enterWatchMode() {
        const probe = this.state.probe;
        const transcriptions = probe && probe.transcriptions;
        this.transcriptionId = (transcriptions && transcriptions.length > 0) ? transcriptions[0].id : null;
        this.player = null;
        this.playerReady = false;
        this.tickTimer = null;
        this.subtitlesEndMs = null;
        this.subLoadToken = 0;
        this.lastPositionMs = 0;
        this.setState({ subtitles: [], next: null, currentCueIndex: -1, currentCueUpcoming: false, positionMs: 0 });

        if (this.transcriptionId != null) {
            // Initial load: a page of words from the start (covers roughly the first minute).
            this.requestSubtitlesJump(0);
        } else {
            this.setState({ subtitlesLoading: false });
        }

        this.bootYouTubePlayer();
    }

    bootYouTubePlayer() {
        if (this.player) {
            return;
        }
        const videoId = this.state.probe && this.state.probe.info && this.state.probe.info.online_video_id;
        if (!videoId) {
            console.warn("no online_video_id to play");
            return;
        }

        if (!window.YT || !window.YT.Player) {
            console.log("Creating YT iFrame");
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            window.onYouTubeIframeAPIReady = this.loadVideo;

            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        } else {
            this.loadVideo();
        }
    }

    loadVideo() {
        const videoId = this.state.probe && this.state.probe.info && this.state.probe.info.online_video_id;
        if (!videoId) {
            return;
        }
        console.log(`Creating YT player for ${videoId}`);
        this.player = new window.YT.Player("watch_player", {
            videoId: videoId,
            events: {
                onReady: this.onPlayerReady,
                onStateChange: this.onPlayerStateChange,
                onPlaybackRateChange: this.onPlayerRateChange,
            },
        });
    }

    onPlayerReady(event) {
        console.log("YT: ready");
        this.playerReady = true;
        this.tick();
    }

    onPlayerStateChange(event) {
        this.tick();
    }

    // A speed change invalidates the delay the pending timer was scheduled
    // with (it was computed against the old rate), so re-tick immediately
    // rather than waiting for it to fire late/early.
    onPlayerRateChange(event) {
        this.tick();
    }

    tick() {
        // Clear any pending tick so rapid onStateChange events can't stack timers.
        if (this.tickTimer) {
            clearTimeout(this.tickTimer);
            this.tickTimer = null;
        }
        if (!this.player || !this.playerReady) {
            return;
        }
        const positionMs = Math.floor(this.player.getCurrentTime() * 1000);
        const { index, upcoming, activeWordIndex } = this.updateCurrentCue(positionMs);
        this.loadSubtitlesIfNeeded(positionMs);
        if (this.player.getPlayerState() === VIDEO_PLAYING) {
            const delay = computeNextTickDelayMs(
                positionMs, this.player.getPlaybackRate(), this.state.subtitles || [], index, upcoming, activeWordIndex
            );
            this.tickTimer = setTimeout(() => this.tick(), delay);
        }
    }

    updateCurrentCue(positionMs) {
        this.lastPositionMs = positionMs;
        const subtitles = this.state.subtitles || [];
        const { index, upcoming } = computeDisplayedCue(positionMs, subtitles);
        const activeWordIndex = (!upcoming && index !== -1)
            ? computeActiveWordIndex(positionMs, subtitles[index].words)
            : -1;
        // Push the live position every tick (not just while a cue is upcoming)
        // so per-word highlighting can track playback during an active cue too.
        this.setState({ currentCueIndex: index, currentCueUpcoming: upcoming, positionMs });
        return { index, upcoming, activeWordIndex };
    }

    loadSubtitlesIfNeeded(positionMs) {
        if (this.state.subtitlesLoading || this.transcriptionId == null) {
            return;
        }
        if (this.subtitlesEndMs != null && positionMs >= this.subtitlesEndMs) {
            return; // past the known end of the transcript
        }
        const subtitles = this.state.subtitles || [];
        if (subtitles.length === 0) {
            this.requestSubtitlesJump(positionMs);
            return;
        }
        const loadedStart = this.state.subtitlesRequestStartMs != null
            ? this.state.subtitlesRequestStartMs
            : subtitles[0].start_ms;
        const loadedEnd = subtitles[subtitles.length - 1].end_ms;
        const next = this.state.next;
        if (positionMs < loadedStart - SUBTITLE_BUFFER_MS || positionMs > loadedEnd + SUBTITLE_BUFFER_MS) {
            // Outside the loaded window by more than the buffer → treat as a user jump.
            this.requestSubtitlesJump(positionMs);
        } else if (positionMs >= loadedEnd - SUBTITLE_BUFFER_MS && next != null && next !== -1) {
            // Close to the end of the loaded batch → page forward by word index.
            this.requestSubtitlesPage(next);
        }
    }

    requestSubtitlesJump(positionMs) {
        if (this.transcriptionId == null) {
            return;
        }
        this.subLoadToken += 1;
        const token = this.subLoadToken;
        const seekMs = Math.max(0, positionMs);
        this.setState({ subtitlesLoading: true });
        loadSubtitles(
            this.transcriptionId,
            { start_ms: seekMs, word_count: SUBTITLE_WORD_COUNT },
            this.handleSubtitlesResponse,
            this.handleSubtitlesError,
            { mode: "jump", token, seekMs },
        );
    }

    requestSubtitlesPage(seq) {
        if (this.transcriptionId == null) {
            return;
        }
        this.subLoadToken += 1;
        const token = this.subLoadToken;
        const subtitles = this.state.subtitles || [];
        const existingEndMs = subtitles.length > 0 ? subtitles[subtitles.length - 1].end_ms : null;
        this.setState({ subtitlesLoading: true });
        loadSubtitles(
            this.transcriptionId,
            { seq, word_count: SUBTITLE_WORD_COUNT },
            this.handleSubtitlesResponse,
            this.handleSubtitlesError,
            { mode: "page", token, existingEndMs },
        );
    }

    async handleSubtitlesResponse(context, responseJsonPromise) {
        const resp = await responseJsonPromise;
        if (context.token !== this.subLoadToken) {
            console.log("ignore stale subtitles response");
            return;
        }
        const items = (resp.items && resp.items.length > 0) ? resp.items : [];
        const next = (typeof resp.next === "number") ? resp.next : -1;

        if (context.mode === "jump") {
            const endMs = items.length > 0 ? items[items.length - 1].end_ms : context.seekMs;
            if (next === -1) {
                this.subtitlesEndMs = endMs;
            }
            const cue = computeDisplayedCue(this.lastPositionMs, items);
            this.setState({
                subtitles: items,
                subtitlesRequestStartMs: context.seekMs,
                next,
                subtitlesLoading: false,
                currentCueIndex: cue.index,
                currentCueUpcoming: cue.upcoming,
                positionMs: this.lastPositionMs,
            });
            console.log(`Loaded ${items.length} cues from start_ms=${context.seekMs}, next=${next}, end=${endMs}`);
        } else {
            const combined = (this.state.subtitles || []).concat(items);
            const endMs = combined.length > 0 ? combined[combined.length - 1].end_ms : context.existingEndMs;
            if (next === -1) {
                this.subtitlesEndMs = endMs;
            }
            const cue = computeDisplayedCue(this.lastPositionMs, combined);
            this.setState({
                subtitles: combined,
                next,
                subtitlesLoading: false,
                currentCueIndex: cue.index,
                currentCueUpcoming: cue.upcoming,
                positionMs: this.lastPositionMs,
            });
            console.log(`Paged ${items.length} cues, total ${combined.length}, next=${next}, end=${endMs}`);
        }
    }

    async handleSubtitlesError(context, responseTextPromise) {
        const text = await responseTextPromise;
        console.log(`subtitles error: ${text}`);
        if (context.token === this.subLoadToken) {
            this.setState({ subtitlesLoading: false });
        }
    }

    // ===== APP_MODE_PROMPT: suggested videos =====

    async handleSuggestedVideosSuccess(context, responseJsonPromise) {
        const resp = await responseJsonPromise;
        const videos = (resp && resp.videos) || [];
        this.setState({ suggestedVideos: videos });
    }

    async handleSuggestedVideosError(context, responseTextPromise) {
        const text = await responseTextPromise;
        console.log("suggested videos error:", text);
    }

    onSuggestedVideoClick(videoId) {
        this.probeById(videoId);
    }

    renderPromptForm() {
        return (
            <div>
                <form onSubmit={this.onSubmit} className="px-3 py-2 flex flex-col">
                    <div className="flex flex-row">
                        <input
                            ref={this.inputRef}
                            type="text"
                            size="44"
                            maxLength="100"
                            placeholder={this.i18n("hintPasteYtUrl")}
                            className="shadow appearance-none border rounded w-full p-2 text-4xl lg:text-2xl text-gray-700 focus:outline-none focus:shadow-outline"
                            onChange={this.onInputChange}
                            autoFocus />
                        <button
                            type="button"
                            onClick={this.onSubmit}
                            className="bg-blue-500 hover:bg-blue-700 text-white text-4xl font-bold px-4 rounded focus:outline-none focus:shadow-outline">
                            →
                        </button>
                    </div>
                    {this.state.promptError && (
                        <div className="mt-2 text-red-600 text-2xl lg:text-xl">{this.state.promptError}</div>
                    )}
                </form>
                {this.renderSuggestedVideos()}
            </div>
        );
    }

    renderSuggestedVideos() {
        const videos = this.state.suggestedVideos || [];
        if (videos.length === 0) {
            return null;
        }
        return (
            <div className="mt-6 px-3">
                <div className="text-xl font-medium text-gray-700 mb-2">{this.i18n("suggestedVideosTitle")}</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {videos.map((v) => (
                        <div
                            key={v.online_video_id}
                            onClick={() => this.onSuggestedVideoClick(v.online_video_id)}
                            className="cursor-pointer flex flex-col rounded-lg overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
                            <div className="relative" style={{ paddingBottom: "75%" }}>
                                <img
                                    src={v.thumbnail_url}
                                    alt={v.title}
                                    width={v.thumbnail_width}
                                    height={v.thumbnail_height}
                                    className="absolute inset-0 w-full h-full object-cover" />
                                <span className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-sm px-1 rounded">
                                    {formatDuration(v.duration_secs)}
                                </span>
                            </div>
                            <div className="p-2">
                                <div className="text-sm font-medium text-gray-800 truncate" title={v.title}>{v.title}</div>
                                <div className="text-xs text-gray-500 mt-1">{v.channel_title}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    renderVideoInfo(info) {
        return (
            <div className="border border-gray-200 rounded-xl bg-blue-100 p-4 flex flex-col items-center">
                <img
                    src={info.thumbnail_url}
                    alt={info.title}
                    width={info.thumbnail_width}
                    height={info.thumbnail_height}
                    className="rounded" />
                <div className="mt-2 text-xl font-medium text-gray-800">{info.title}</div>
                <div className="text-gray-600">{info.channel_title}</div>
                <div className="text-gray-500">{formatDuration(info.duration_secs)}</div>
            </div>
        );
    }

    renderPreviewForm() {
        const probe = this.state.probe;
        const obstacle = probe.processing_obstacle;

        return (
            <div className="flex flex-col items-center">
                {this.renderVideoInfo(probe.info)}
                {obstacle === ""
                    ? <button
                        type="button"
                        onClick={this.onGenerateClick}
                        className="mt-3 bg-blue-500 hover:bg-blue-700 text-white text-xl font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                        {this.i18n("generateSubtitles")}
                    </button>
                    : <div className="mt-3 text-red-600">
                        {this.i18n("cantGenerateSubtitles")}:&nbsp;{obstacle}
                    </div>
                }
            </div>
        );
    }

    renderProbingForm() {
        return (
            <div className="flex justify-center py-4">
                <div className="text-2xl text-gray-500">{this.i18n("isLoading")}</div>
            </div>
        );
    }

    renderProcessingScreen() {
        const probe = this.state.probe;
        const info = probe && probe.info;
        const process = this.state.process;

        const queue = process && process.queue ? process.queue : [];
        const isTerminal = process && (process.state === "failed" || process.state === "done");
        const refreshDisabled = !process || this.state.refreshing || isTerminal;
        const quota = process && process.asr_quota && process.asr_quota.day ? process.asr_quota : null;
        const elapsedMs = this.state.processStartedAt != null
            ? (isTerminal ? (this.state.processUpdatedAt || Date.now()) : Date.now()) - this.state.processStartedAt
            : null;

        return (
            <div className="flex flex-col items-center">
                {info && this.renderVideoInfo(info)}
                <div className="mt-3 flex flex-row items-center">
                    {!isTerminal && (
                        <div
                            className="animate-spin rounded-full h-6 w-6 border-4 border-gray-200 mr-2"
                            style={{ borderTopColor: "#3b82f6", borderRightColor: "#3b82f6" }}>
                        </div>
                    )}
                    <div className="text-xl text-gray-700">
                        {process ? this.i18n(processStatusKey(process.state)) : this.i18n("isLoading")}
                    </div>
                </div>
                {!isTerminal && (
                    <div className="mt-1 text-sm text-gray-500">{this.i18n("processingHint")}</div>
                )}
                {process && elapsedMs != null && (
                    <div className="text-sm text-gray-500">
                        {isTerminal
                            ? this.i18n("statusWaited")(formatElapsedDuration(elapsedMs))
                            : this.i18n("statusWaiting")(formatElapsedDuration(elapsedMs))}
                    </div>
                )}
                {process && process.state === "failed" && process.error_message && (
                    <div className="mt-1 text-red-600">{process.error_message}</div>
                )}
                {queue.length > 0 && (
                    <div className="mt-3 text-gray-700">
                        {this.i18n("queuePositionTempl")(queue.length + 1)}
                    </div>
                )}
                {quota && this.renderAsrQuota(quota)}
                <div className="mt-3 flex flex-row gap-2">
                    {(!process || process.state !== "done") && (
                        <button
                            type="button"
                            onClick={this.onRefreshClick}
                            disabled={refreshDisabled}
                            className="bg-blue-500 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xl font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                            {this.i18n("refreshButton")}
                        </button>
                    )}
                    {process && process.state === "done" && (
                        <button
                            type="button"
                            onClick={this.onProceedClick}
                            disabled={!!this.state.proceeding}
                            className="bg-green-500 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xl font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                            {this.i18n("watchButton")}
                        </button>
                    )}
                </div>
            </div>
        );
    }

    renderAsrQuota(quota) {
        const pct = Math.min(100, Math.max(0, quota.used_percent));
        const barColor = pct >= 90 ? "bg-red-500" : "bg-blue-500";
        return (
            <div className="mt-3 w-full max-w-md text-left">
                <div className="text-gray-600">{this.i18n("asrQuota")}</div>
                <div className="mt-1 text-gray-700">{quota.day}</div>
                <div className="mt-2 h-4 w-full rounded bg-gray-300 overflow-hidden">
                    <div
                        className={`h-4 ${barColor}`}
                        style={{ width: pct + "%" }}>
                    </div>
                </div>
                <div className="mt-1 text-sm text-gray-500">{quota.used_percent}%</div>
            </div>
        );
    }

    renderErrorForm() {
        return (
            <div className="flex justify-center py-4">
                <div className="text-xl text-red-600">{this.state.errorMessage}</div>
            </div>
        );
    }

    renderWatchView() {
        const probe = this.state.probe;
        const info = probe && probe.info;
        return (
            <div className="flex flex-col items-center w-full">
                <div className="p-4">
                    <div id="watch_player"></div>
                </div>
                {info && (
                    <div className="text-center px-4">
                        <div className="text-xl font-medium text-gray-800">{info.title}</div>
                        <div className="text-gray-600">{info.channel_title}</div>
                    </div>
                )}
                <div className="w-full max-w-2xl px-4 py-2">
                    {this.renderSubtitles()}
                </div>
            </div>
        );
    }

    renderSubtitles() {
        const subtitles = this.state.subtitles || [];
        const idx = this.state.currentCueIndex;
        const upcoming = !!this.state.currentCueUpcoming;
        const positionMs = this.state.positionMs || 0;

        if (this.state.subtitlesLoading && subtitles.length === 0) {
            return (
                <div className="text-center text-gray-500">{this.i18n("isLoading")}</div>
            );
        }
        if (subtitles.length === 0) {
            return (
                <div className="text-center text-gray-500">{this.i18n("noSubtitles")}</div>
            );
        }
        if (idx == null || idx < 0 || idx >= subtitles.length) {
            return null; // gap after the last loaded cue: nothing to show
        }
        const sub = subtitles[idx];
        const cardClass = upcoming
            ? "my-2 p-3 rounded bg-gray-50"
            : "my-2 p-3 rounded bg-blue-50";
        const stampClass = upcoming
            ? "font-mono text-sm text-gray-400 mr-2"
            : "font-mono text-sm text-blue-500 mr-2";
        const textClass = upcoming
            ? "text-gray-500 text-xl"
            : "text-gray-800 text-xl";

        let gapProgressPct = 100;

        if (upcoming) {
            // Fill across the silent gap: from the previous cue's end to this cue's start.
            const gapStart = idx > 0 ? subtitles[idx - 1].end_ms : 0;
            const gapEnd = sub.start_ms;
            const total = Math.max(1, gapEnd - gapStart);
            const elapsed = Math.min(Math.max(positionMs - gapStart, 0), total);
            gapProgressPct = Math.round((elapsed / total) * 100);
            //console.log(`upcoming: positionMs ${positionMs}, gapStart ${gapStart}, gapEnd ${gapEnd}, pct ${pct}`)
        }
        let progressBar = (
            <div className="mt-2 h-4 w-32 rounded bg-gray-300 overflow-hidden">
                <div
                    className="h-4 bg-blue-500"
                    style={{ width: gapProgressPct + "%", transition: "width 0.5s linear" }}>
                </div>
            </div>
        );

        const activeWordIndex = upcoming ? -1 : computeActiveWordIndex(positionMs, sub.words);

        return (
            <div className={cardClass}>
                {progressBar}
                <span className={stampClass}>{formatCueTimestamp(sub.start_ms)}</span>
                <span className={textClass}>
                    {sub.words.map((w, i) => (
                        <span
                            key={i}
                            className={i === activeWordIndex ? "bg-yellow-300 rounded px-0.5 transition-colors duration-150" : ""}>
                            {w.word}{" "}
                        </span>
                    ))}
                </span>
            </div>
        );
    }

    routeMode(appMode) {
        if (appMode == APP_MODE_PROMPT) {
            return this.renderPromptForm();
        } else if (appMode == APP_MODE_PROBING) {
            return this.renderProbingForm();
        } else if (appMode == APP_MODE_PROCESSING) {
            return this.renderProcessingScreen();
        } else if (appMode == APP_MODE_PREVIEW) {
            return this.renderPreviewForm();
        } else if (appMode == APP_MODE_WATCH) {
            return this.renderWatchView();
        } else if (appMode == APP_MODE_ERROR) {
            return this.renderErrorForm();
        } else {
            return <div>Not implemented</div>;
        }
    }

    render() {
        return (
            <div className="flex flex-col w-full">
                <h1 className="text-center text-4xl italic text-gray-600">
                    <a href={buildWatchUrl([], this.props.lang)}>
                        {this.i18n("titleSubtitlesForYt")}
                    </a>
                </h1>
                {this.routeMode(this.state.appMode)}
            </div>
        );
    }
}

export default WatchApp;