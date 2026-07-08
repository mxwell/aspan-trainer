import React from "react";
import { buildWatchUrl, parseParams } from "../lib/url";
import { i18n } from "../lib/i18n";
import { probeVideo, fetchVideo, loadSubtitles } from "../lib/requests";

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

function isValidYouTubeVideoId(id) {
    return /^[a-zA-Z0-9_-]{11}$/.test(id);
}

function extractYouTubeVideoId(url) {
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

function formatTimestamp(ms) {
    const d = new Date(ms);
    const now = new Date();
    const sameDay = d.getFullYear() === now.getFullYear()
        && d.getMonth() === now.getMonth()
        && d.getDate() === now.getDate();
    const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
    const time = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    if (sameDay) {
        return time;
    }
    const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    return `${date} ${time}`;
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
        this.onInputChange = this.onInputChange.bind(this);
        this.enterWatchMode = this.enterWatchMode.bind(this);
        this.bootYouTubePlayer = this.bootYouTubePlayer.bind(this);
        this.loadVideo = this.loadVideo.bind(this);
        this.onPlayerReady = this.onPlayerReady.bind(this);
        this.onPlayerStateChange = this.onPlayerStateChange.bind(this);
        this.tick = this.tick.bind(this);
        this.updateCurrentCue = this.updateCurrentCue.bind(this);
        this.loadSubtitlesIfNeeded = this.loadSubtitlesIfNeeded.bind(this);
        this.requestSubtitlesJump = this.requestSubtitlesJump.bind(this);
        this.requestSubtitlesPage = this.requestSubtitlesPage.bind(this);
        this.handleSubtitlesResponse = this.handleSubtitlesResponse.bind(this);
        this.handleSubtitlesError = this.handleSubtitlesError.bind(this);

        this.player = null;
        this.playerReady = false;
        this.tickTimer = null;
        this.transcriptionId = null;
        this.subtitlesEndMs = null;
        this.subLoadToken = 0;
        this.lastPositionMs = 0;
    }

    makeState(appMode, videoId) {
        return {
            appMode: appMode,
            videoId: videoId || null,
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
        if (this.state.videoId) {
            this.probeById(this.state.videoId);
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.appMode !== APP_MODE_WATCH && this.state.appMode === APP_MODE_WATCH) {
            this.enterWatchMode();
        }
    }

    componentWillUnmount() {
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
    }

    async handleFetchError(context, responseTextPromise) {
        const text = await responseTextPromise;
        console.log("fetch error:", text);
        this.setState({ appMode: APP_MODE_ERROR, errorMessage: this.extractErrorMessage(text), refreshing: false });
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
        this.updateCurrentCue(positionMs);
        this.loadSubtitlesIfNeeded(positionMs);
        if (this.player.getPlayerState() === VIDEO_PLAYING) {
            this.tickTimer = setTimeout(() => this.tick(), TICK_MS);
        }
    }

    updateCurrentCue(positionMs) {
        this.lastPositionMs = positionMs;
        const { index, upcoming } = computeDisplayedCue(positionMs, this.state.subtitles || []);
        if (upcoming) {
            // While a cue is upcoming, push the live position each tick so the
            // gap-progress bar under it advances smoothly.
            this.setState({ currentCueIndex: index, currentCueUpcoming: true, positionMs });
        } else if (index !== this.state.currentCueIndex || this.state.currentCueUpcoming) {
            this.setState({ currentCueIndex: index, currentCueUpcoming: false });
        }
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
        const loadedStart = subtitles[0].start_ms;
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

        return (
            <div className="flex flex-col items-center">
                {info && this.renderVideoInfo(info)}
                <div className="mt-3 text-xl text-gray-700">
                    {process ? this.i18n(processStatusKey(process.state)) : this.i18n("isLoading")}
                </div>
                {process && this.state.processUpdatedAt && (
                    <div className="text-sm text-gray-500">
                        {this.i18n("statusUpdated")(formatTimestamp(this.state.processUpdatedAt))}
                    </div>
                )}
                {process && process.state === "failed" && process.error_message && (
                    <div className="mt-1 text-red-600">{process.error_message}</div>
                )}
                {queue.length > 0 && (
                    <div className="mt-3 w-full max-w-md text-left">
                        <div className="text-gray-600">{this.i18n("jobsAhead")}</div>
                        <ul className="mt-1 list-disc list-inside">
                            {queue.map((job, i) => (
                                <li key={i} className="text-gray-700">
                                    {this.i18n("videoDuration")}:&nbsp;{formatDuration(job.video_duration_secs)}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                <div className="mt-3 flex flex-row gap-2">
                    <button
                        type="button"
                        onClick={this.onRefreshClick}
                        disabled={refreshDisabled}
                        className="bg-blue-500 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xl font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                        {this.i18n("refreshButton")}
                    </button>
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
            const positionMs = this.state.positionMs || 0;
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

        return (
            <div className={cardClass}>
                {progressBar}
                <span className={stampClass}>{formatCueTimestamp(sub.start_ms)}</span>
                <span className={textClass}>{sub.text}</span>
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