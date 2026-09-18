import React from "react";
import { buildWatchUrl, parseParams, parseTimeParamMs } from "../lib/url";
import { i18n, I18N_LANG_RU } from "../lib/i18n";
import { probeVideo, fetchVideo, loadSubtitles, loadBreakdowns, enqueueBreakdowns, loadSuggestedPlaylists, loadPlaylistPage, makeAnalyzeSubRequest } from "../lib/requests";
import {
    BREAKDOWN_LANG, BREAKDOWN_MISSING, BREAKDOWN_PENDING, BREAKDOWN_RUNNING, BREAKDOWN_DONE,
    BREAKDOWN_NO_SENTENCES,
    ENQUEUE_NO_SENTENCES, ENQUEUE_NO_QUOTA, ENQUEUE_QUEUE_FULL,
    batchSpan, spanContains, findBatch, sentencesForRange, activeSentenceIndex, visibleSentences, mergeBatch,
} from "../lib/breakdowns";
import { saveWatchHistoryEntry, loadWatchHistory } from "../lib/history";
import { PlaylistRef } from "../lib/playlist";
import { AnalyzedPart, parseAnalyzeResponse } from "../lib/analyzer";
import { AnalyzedPartView } from "./analyzed_part_view";
import { AiAnalysisSentences, AiAnalysisSentenceText } from "./ai_analysis_sentences";
import { RecommendationsTab } from "./recommendations_tab";
import { Spinner } from "./spinner";
import { VideoGrid, formatDuration } from "./video_grid";

const APP_MODE_PROMPT = 1;
const APP_MODE_PROCESSING = 2;
const APP_MODE_WATCH = 3;
const APP_MODE_ERROR = 4;
const APP_MODE_PREVIEW = 5;
const APP_MODE_PROBING = 6;
const APP_MODE_PLAYLIST = 7;

const VIDEO_UNSTARTED = -1;
const VIDEO_PLAYING = 1;
const VIDEO_CUED = 5;

const PROMPT_TAB_RECS = "recs";
const PROMPT_TAB_PLAYLISTS = "playlists";
const PROMPT_TAB_HISTORY = "history";

const SUBTITLE_BUFFER_MS = 10000;
const SUBTITLE_WORD_COUNT = 150;
const TICK_MS = 500;
const MIN_TICK_MS = 50;
const PROCESSING_POLL_MS = 10000;
const HISTORY_SAVE_INTERVAL_MS = 10000;

const BREAKDOWN_POLL_MS = 3000;
// Once a batch has started returning rows, a poll only picks up the sentences
// finished since the last one, so it can be less eager.
const BREAKDOWN_STREAM_POLL_MS = 5000;
const BREAKDOWN_SLOW_MS = 60000;
// Bounds the wait for the next piece of progress, not the job as a whole: a
// batch that keeps delivering sentences keeps getting more time.
const BREAKDOWN_TIMEOUT_MS = 120000;
// "queue full" means the server declined to take the batch, so it doesn't count
// against the cap - only enqueues that actually started (or restarted) a job do.
const BREAKDOWN_QUEUE_FULL_RETRY_MS = 15000;
// The GET can't tell "never generated" from "generation failed", so a failing
// batch would otherwise be re-enqueued forever.
const BREAKDOWN_MAX_ENQUEUES = 2;
// Sentences before the one being played are dropped, except for a run of short
// ones whose words together stay under this limit.
const PRECEDING_WORDS_LIMIT = 3;

function isValidYouTubeVideoId(id) {
    return /^[a-zA-Z0-9_-]{11}$/.test(id);
}

function isValidYouTubePlaylistId(id) {
    return /^[a-zA-Z0-9_-]{2,64}$/.test(id);
}

// Supports both individual video and playlist URLs
function parseYouTubeWatchUrl(url) {
    const empty = { videoId: '', playlistId: '' };

    // Accept a bare 11-character video ID directly.
    if (isValidYouTubeVideoId(url)) {
        return { videoId: url, playlistId: '' };
    }

    try {
        const parsed = new URL(url);
        const host = parsed.hostname.replace(/^www\./, '');
        const list = parsed.searchParams.get('list') || '';
        const playlistId = isValidYouTubePlaylistId(list) ? list : '';

        // The path not checked
        if (host === 'youtube.com' || host === 'm.youtube.com') {
            const id = parsed.searchParams.get('v') || '';
            return { videoId: isValidYouTubeVideoId(id) ? id : '', playlistId };
        }

        if (host === 'youtu.be') {
            const id = parsed.pathname.slice(1); // remove leading "/"
            return { videoId: isValidYouTubeVideoId(id) ? id : '', playlistId };
        }

        return empty;
    } catch (e) {
        return empty;
    }
}

function resumePositionMs(positionMs, durationSecs) {
    if (positionMs == null || positionMs < 0) {
        return null;
    }
    if (durationSecs == null) {
        return null;
    }
    const durationMs = durationSecs * 1000;
    // ignore if too close to the end
    if (positionMs >= durationMs - 10000) {
        return null;
    }
    return positionMs;
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

// Letters (Kazakh Cyrillic and Latin) or digits - the character classes that make
// a token worth a breakdown card.
const BREAKDOWN_CONTENT_RE = /[A-Za-zА-Яа-яЁӘІҢҒҮҰҚӨҺёәіңғүұқөһ0-9]/;

// The breakdown shows words and phrases only. Tokens made purely of spaces and
// punctuation (" ", ", ", ". ") carry no grammar and are already visible in the
// cue above, so they'd only be dead cards to scroll past.
function isBreakdownWorthy(token) {
    return BREAKDOWN_CONTENT_RE.test(token);
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

// Breakdown parts synthesized from unrecognized content carry null timings.
function computeActivePartIndex(positionMs, breakdown) {
    return computeActiveIndex(positionMs, breakdown, (p) => p.startTime);
}

function wordClass(active) {
    const base = "inline-block rounded px-1 py-1 cursor-pointer transition-colors duration-150";
    return active ? `${base} bg-yellow-300` : `${base} hover:bg-yellow-100`;
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

        // for YT player
        this.pendingStartMs = null;
        this.startMs = 0;

        const state = this.readUrlState();

        this.state = state;

        this.inputRef = React.createRef();
        this.breakdownRef = React.createRef();
        this.menuRef = React.createRef();
        this.onSubmit = this.onSubmit.bind(this);
        this.startProbe = this.startProbe.bind(this);
        this.probePlaylist = this.probePlaylist.bind(this);
        this.applyProbeResult = this.applyProbeResult.bind(this);
        this.handleProbeSuccess = this.handleProbeSuccess.bind(this);
        this.handleProbeError = this.handleProbeError.bind(this);
        this.handlePlaylistProbeSuccess = this.handlePlaylistProbeSuccess.bind(this);
        this.handlePlaylistProbeError = this.handlePlaylistProbeError.bind(this);
        this.enterPlaylistMode = this.enterPlaylistMode.bind(this);
        this.openPlaylist = this.openPlaylist.bind(this);
        this.requestPlaylistOverview = this.requestPlaylistOverview.bind(this);
        this.handlePlaylistOverviewSuccess = this.handlePlaylistOverviewSuccess.bind(this);
        this.handlePlaylistOverviewError = this.handlePlaylistOverviewError.bind(this);
        this.onPlaylistItemClick = this.onPlaylistItemClick.bind(this);
        this.requestPlaylistPage = this.requestPlaylistPage.bind(this);
        this.onPlaylistPrevPageClick = this.onPlaylistPrevPageClick.bind(this);
        this.onPlaylistNextPageClick = this.onPlaylistNextPageClick.bind(this);
        this.handlePlaylistPageSuccess = this.handlePlaylistPageSuccess.bind(this);
        this.handlePlaylistPageError = this.handlePlaylistPageError.bind(this);
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
        this.onVideoCardClick = this.onVideoCardClick.bind(this);
        this.onPromptTabClick = this.onPromptTabClick.bind(this);
        this.handleSuggestedPlaylistsSuccess = this.handleSuggestedPlaylistsSuccess.bind(this);
        this.handleSuggestedPlaylistsError = this.handleSuggestedPlaylistsError.bind(this);
        this.onPlaylistCardClick = this.onPlaylistCardClick.bind(this);
        this.onLoadMorePlaylistsClick = this.onLoadMorePlaylistsClick.bind(this);
        this.onWordClick = this.onWordClick.bind(this);
        this.onGrammarToggle = this.onGrammarToggle.bind(this);
        this.onTranslationsToggle = this.onTranslationsToggle.bind(this);
        this.handleAnalyzeResponse = this.handleAnalyzeResponse.bind(this);
        this.handleAnalyzeError = this.handleAnalyzeError.bind(this);
        this.onMenuToggle = this.onMenuToggle.bind(this);
        this.closeMenu = this.closeMenu.bind(this);
        this.onDocumentClick = this.onDocumentClick.bind(this);
        this.onAiAnalysisClick = this.onAiAnalysisClick.bind(this);
        this.onAiAnalysisNoticeClose = this.onAiAnalysisNoticeClose.bind(this);
        this.handleBreakdownsResponse = this.handleBreakdownsResponse.bind(this);
        this.handleBreakdownsError = this.handleBreakdownsError.bind(this);
        this.handleEnqueueResponse = this.handleEnqueueResponse.bind(this);
        this.handleEnqueueError = this.handleEnqueueError.bind(this);

        this.player = null;
        this.playerReady = false;
        this.tickTimer = null;
        this.processPollTimer = null;
        this.processTickTimer = null;
        this.transcriptionId = null;
        this.subtitlesEndMs = null;
        this.subLoadToken = 0;
        this.lastPositionMs = 0;
        this.analysisToken = 0;
        // Cue index the in-flight (or last issued) analysis request was for. Kept
        // outside state so back-to-back ticks can't re-issue the same request while
        // the response - and the state update it carries - is still pending.
        this.analysisCueIndex = -1;
        // Tracks history saves for the current video: whether the initial save has
        // fired yet, and the wall-clock time of the last save (for the 45s cadence).
        this.historyInitialSaved = false;
        this.lastHistorySaveMs = 0;
        // At most one breakdown generation job runs at a time; the token discards
        // responses of a job that was abandoned or belongs to a previous video.
        this.bdToken = 0;
        this.bdPollTimer = null;
        this.bdTimeoutTimer = null;
    }

    makeState(appMode, videoId) {
        return {
            appMode: appMode,
            videoId: videoId || null,
            promptTab: PROMPT_TAB_RECS,
            playlists: [],
            playlistsLoading: false,
            playlistsLoadingMore: false,
            playlistsError: false,
            playlistsRequested: false,
            playlistsNextCursor: null,
            playlist: null,
            playlistItems: [],
            playlistPrevPageToken: null,
            playlistNextPageToken: null,
            playlistLoadingPrev: false,
            playlistLoadingNext: false,
            playlistLoading: false,
            playlistError: false,
            grammar: false,
            translations: false,
            breakdown: [],
            breakdownCueIndex: -1,
            analyzing: false,
            menuOpen: false,
            bdBatches: {},
            bdActive: null,
            bdNotice: null,
            bdUnavailable: false,
            bdLangUnsupported: false,
        }
    }

    readUrlState() {
        const params = parseParams();
        const playlist = PlaylistRef.fromParams(params);
        const videoId = params.v;
        if (videoId && isValidYouTubeVideoId(videoId)) {
            const state = this.makeState(APP_MODE_PROBING, videoId);
            state.playlist = playlist;
            return state;
        }
        // `list` without a `v`: the playlist overview rather than a video in it.
        if (playlist) {
            const state = this.makeState(APP_MODE_PLAYLIST, null);
            state.playlist = playlist;
            state.playlistLoading = true;
            return state;
        }
        return this.makeState(APP_MODE_PROMPT, null);
    }

    componentDidMount() {
        window.addEventListener("popstate", this.onPopState);
        document.addEventListener("click", this.onDocumentClick);
        if (this.state.videoId) {
            // `t` only means something alongside a video, and watch mode may be
            // several modes away yet (preview, processing): the probe carries it.
            const startMs = parseTimeParamMs(parseParams().t);
            if (this.state.playlist) {
                this.probePlaylist(this.state.videoId, this.state.playlist, startMs);
            } else {
                this.probeById(this.state.videoId, startMs);
            }
        } else if (this.state.playlist) {
            this.requestPlaylistOverview(this.state.playlist);
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
        this.syncBreakdownScroll(prevState);
    }

    // Keeps the highlighted part of the horizontally scrolling breakdown in view.
    // Only acts when the active part actually changes: scrolling on every render
    // would restart the smooth-scroll animation each tick and make the row stutter.
    syncBreakdownScroll(prevState) {
        const container = this.breakdownRef.current;
        if (container == null) {
            return;
        }
        if (prevState.breakdownCueIndex !== this.state.breakdownCueIndex) {
            // New cue, new parts - start from the left rather than inheriting the
            // previous cue's scroll offset.
            container.scrollLeft = 0;
        }
        const breakdown = this.state.breakdown || [];
        const curPositionMs = this.state.positionMs;
        const index = computeActivePartIndex(curPositionMs || 0, breakdown);
        const prevIndex = computeActivePartIndex(prevState.positionMs || 0, prevState.breakdown || []);
        // Toggling translations resizes every card, so the offset we scrolled to
        // before no longer centers the active one - recompute it.
        const resized = prevState.translations !== this.state.translations;
        if (index === -1 || (!resized && index === prevIndex && prevState.breakdownCueIndex === this.state.breakdownCueIndex)) {
            return;
        }
        const row = container.firstChild;
        const el = row && row.children[index];
        if (el == null) {
            return;
        }
        // Center the active part; scrollLeft on the container alone, since
        // scrollIntoView() would also scroll the page and yank the video out of view.
        const left = el.offsetLeft - (container.clientWidth - el.offsetWidth) / 2;
        container.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
    }

    componentWillUnmount() {
        window.removeEventListener("popstate", this.onPopState);
        document.removeEventListener("click", this.onDocumentClick);
        this.teardownPlayer();
        if (window.onYouTubeIframeAPIReady === this.loadVideo) {
            window.onYouTubeIframeAPIReady = null;
        }
    }

    // Tears down the YT player, its timers/polls, and per-video tracking state.
    // Must run - and, critically, must destroy the player - BEFORE any setState
    // that unmounts <div id="watch_player">: the IFrame API replaces that div's
    // content outside React's knowledge, and React trying to remove a child it
    // never rendered throws "Node.removeChild: node is not a child of this node".
    teardownPlayer() {
        // Best-effort: capture the position reached since the last periodic save
        // (up to HISTORY_SAVE_INTERVAL_MS of drift) before the player is gone.
        if (this.historyInitialSaved) {
            this.saveHistoryProgress(this.lastPositionMs);
        }
        this.stopProcessingPoll();
        this.stopBreakdownJob();
        if (this.tickTimer) {
            clearTimeout(this.tickTimer);
            this.tickTimer = null;
        }
        if (this.player) {
            try {
                this.player.destroy();
            } catch (e) {
                // ignore - player may already be gone
            }
            this.player = null;
        }
        this.playerReady = false;
        this.transcriptionId = null;
        this.subtitlesEndMs = null;
        this.subLoadToken = 0;
        this.lastPositionMs = 0;
        this.startMs = 0;
        this.analysisToken = 0;
        this.analysisCueIndex = -1;
        this.historyInitialSaved = false;
        this.lastHistorySaveMs = 0;
    }

    i18n(key) {
        return i18n(key, this.props.lang);
    }

    // Routes a pasted URL by what it names. A playlist from here always starts at
    // the default window: YouTube's own URLs carry no `page` token of ours.
    startProbe(videoUrl) {
        const { videoId, playlistId } = parseYouTubeWatchUrl(videoUrl);

        if (videoId && playlistId) {
            this.setState({ promptError: null });
            this.probePlaylist(videoId, new PlaylistRef(playlistId, ""));
        } else if (videoId) {
            this.setState({ promptError: null });
            this.probeById(videoId);
        } else if (playlistId) {
            this.setState({ promptError: null });
            this.enterPlaylistMode(new PlaylistRef(playlistId, ""));
        } else {
            this.setState({ promptError: this.i18n("invalidYtUrl") });
        }
    }

    onInputChange() {
        if (this.state.promptError) {
            this.setState({ promptError: null });
        }
    }

    // `startMs` is where playback should begin - from the URL's `t`, or a history
    // entry's stored position. Omitted everywhere else, which starts from 0.
    probeById(id, startMs) {
        if (!isValidYouTubeVideoId(id)) {
            console.warn("not a valid YouTube video id:", id);
            return;
        }

        this.teardownPlayer();
        this.pendingStartMs = startMs != null ? startMs : null;
        this.setState({
            appMode: APP_MODE_PROBING,
            playlist: null,
            playlistItems: [],
            playlistPrevPageToken: null,
            playlistNextPageToken: null,
            playlistLoadingPrev: false,
            playlistLoadingNext: false,
            playlistLoading: false,
            playlistError: false,
        });
        probeVideo(id, this.handleProbeSuccess, this.handleProbeError);
    }

    // `list` only makes sense alongside a `v`: probes the video within the
    // playlist so the response carries both the video's own probe data
    // (under cur_video) and the playlist's items/paging tokens. The ref's
    // page token pins the request to the same window an item was loaded under
    // - e.g. when navigating to it from a playlist item further down the
    // loaded list.
    probePlaylist(videoId, playlist, startMs) {
        if (!isValidYouTubeVideoId(videoId)) {
            console.warn("not a valid YouTube video id:", videoId);
            return;
        }

        this.teardownPlayer();
        this.pendingStartMs = startMs != null ? startMs : null;
        this.setState({
            appMode: APP_MODE_PROBING,
            playlist,
            playlistLoadingPrev: false,
            playlistLoadingNext: false,
            playlistLoading: false,
            playlistError: false,
        });
        loadPlaylistPage(playlist.playlistId, videoId, playlist.pageToken, this.handlePlaylistProbeSuccess, this.handlePlaylistProbeError, { playlist });
    }

    onSubmit(e) {
        e.preventDefault();

        const videoUrl = this.inputRef.current.value.trim();
        this.startProbe(videoUrl);
    }

    async handleProbeSuccess(context, responseJsonPromise) {
        const probe = await responseJsonPromise;
        console.log("probe result", probe);
        this.applyProbeResult(probe);
    }

    // Shared by a plain probe and a playlist probe's cur_video: routes to
    // PREVIEW/WATCH/PROCESSING/ERROR based on process state and pushes the
    // resulting video into the URL. `extraState` merges in fields (e.g.
    // playlist data) that only a playlist probe carries.
    applyProbeResult(probe, extraState) {
        const base = extraState || {};
        const processState = probe.process && probe.process.state;

        if (processState === "new") {
            this.setState(Object.assign({}, base, { appMode: APP_MODE_PREVIEW, probe, proceeding: false }));
            this.pushVideoUrl(probe.info.online_video_id);
        } else if (processState === "done") {
            this.setState(Object.assign({}, base, { appMode: APP_MODE_WATCH, probe, proceeding: false, subtitlesLoading: true }));
            this.pushVideoUrl(probe.info.online_video_id);
        } else if (isProcessingState(processState)) {
            this.setState(Object.assign({}, base, { appMode: APP_MODE_PROCESSING, probe, process: probe.process, processUpdatedAt: Date.now(), proceeding: false }));
            this.pushVideoUrl(probe.info.online_video_id);
        } else if (processState === "failed") {
            const errorMessage = (probe.process && probe.process.error_message) || this.i18n("service_error");
            this.setState({ appMode: APP_MODE_ERROR, errorMessage, proceeding: false });
        } else {
            this.setState({ appMode: APP_MODE_ERROR, errorMessage: this.i18n("videoNotPreviewable"), proceeding: false });
        }
    }

    pushVideoUrl(videoId) {
        const params = parseParams();
        const playlist = this.state.playlist;
        if (params.v === videoId && PlaylistRef.same(PlaylistRef.fromParams(params), playlist)) {
            return;
        }
        const urlParams = [`v=${encodeURI(videoId)}`];
        if (playlist) {
            urlParams.push(...playlist.toUrlParams());
        }
        const url = buildWatchUrl(urlParams, this.props.lang);
        window.history.pushState(null, "", url);
    }

    // The playlist overview's URL: `list` alone, with `page` only when the window
    // isn't the default one. No `v` - that's what distinguishes it from a video
    // being watched within a playlist.
    pushPlaylistUrl(playlist) {
        const params = parseParams();
        if (!params.v && playlist.equals(PlaylistRef.fromParams(params))) {
            return;
        }
        const url = buildWatchUrl(playlist.toUrlParams(), this.props.lang);
        window.history.pushState(null, "", url);
    }

    // Fires on browser back/forward. Re-derive intent from the URL rather than
    // trusting event.state, since we never push a state object.
    onPopState() {
        const params = parseParams();
        const playlist = PlaylistRef.fromParams(params);
        const videoId = params.v;
        if (videoId && isValidYouTubeVideoId(videoId)) {
            const currentVideoId = this.state.probe && this.state.probe.info && this.state.probe.info.online_video_id;
            if (videoId !== currentVideoId || !PlaylistRef.same(playlist, this.state.playlist)) {
                // The popped URL's `t` applies just as it would on a fresh load.
                const startMs = parseTimeParamMs(params.t);
                if (playlist) {
                    this.probePlaylist(videoId, playlist, startMs);
                } else {
                    this.probeById(videoId, startMs);
                }
            }
        } else if (playlist) {
            if (this.state.appMode !== APP_MODE_PLAYLIST || !playlist.equals(this.state.playlist)) {
                this.openPlaylist(playlist);
            }
        } else {
            this.resetToPrompt();
        }
    }

    // Tears down whatever mode we were in (polling, YT player, subtitle tracking)
    // and returns to a clean APP_MODE_PROMPT, e.g. after navigating back past the
    // point where a video id first entered the URL.
    resetToPrompt() {
        this.teardownPlayer();
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
            playlist: null,
            playlistItems: [],
            playlistPrevPageToken: null,
            playlistNextPageToken: null,
            playlistLoadingPrev: false,
            playlistLoadingNext: false,
            playlistLoading: false,
            playlistError: false,
            subtitles: [],
            next: null,
            currentCueIndex: -1,
            currentCueUpcoming: false,
            positionMs: 0,
            subtitlesLoading: false,
            subtitlesRequestStartMs: null,
            breakdown: [],
            breakdownCueIndex: -1,
            analyzing: false,
            menuOpen: false,
            bdBatches: {},
            bdActive: null,
            bdNotice: null,
            bdUnavailable: false,
            bdLangUnsupported: false,
        });
    }

    async handleProbeError(context, responseTextPromise) {
        const text = await responseTextPromise;
        console.log("probe error:", text);
        this.setState({ appMode: APP_MODE_ERROR, errorMessage: this.extractErrorMessage(text), proceeding: false });
    }

    // cur_video in the playlist response is shaped like a plain /probe response;
    // its absence means the video couldn't be probed within the playlist context.
    async handlePlaylistProbeSuccess(context, responseJsonPromise) {
        const resp = await responseJsonPromise;
        console.log("playlist probe result", resp);

        const curVideo = resp.cur_video;
        if (!curVideo) {
            this.setState({ appMode: APP_MODE_ERROR, errorMessage: this.i18n("videoNotPreviewable"), proceeding: false });
            return;
        }
        const items = (resp.items || []).map((item) => Object.assign({}, item, { playlist: context.playlist }));
        this.applyProbeResult(curVideo, {
            playlistItems: items,
            playlistPrevPageToken: resp.prev_page_token || null,
            playlistNextPageToken: resp.next_page_token || null,
        });
    }

    async handlePlaylistProbeError(context, responseTextPromise) {
        const text = await responseTextPromise;
        console.log("playlist probe error:", text);
        this.setState({ appMode: APP_MODE_ERROR, errorMessage: this.extractErrorMessage(text), proceeding: false });
    }

    // ===== APP_MODE_PLAYLIST: overview of a playlist, no video selected =====

    // Enters the overview and pushes its URL. Called when a playlist card is
    // clicked; the URL-driven paths (initial mount, popstate) go straight to
    // requestPlaylistOverview() instead, since the URL already says so.
    enterPlaylistMode(playlist) {
        this.pushPlaylistUrl(playlist);
        this.openPlaylist(playlist);
    }

    // Leaves whatever mode we were in - player, polling, probed video - and loads
    // the overview. Doesn't touch the URL: callers that navigate push it first.
    openPlaylist(playlist) {
        this.teardownPlayer();  // just in case
        // appMode has to switch in the SAME setState that drops the probe: React
        // doesn't batch updates made outside its own event handlers (popstate,
        // for one), so a separate mode update would render the previous mode -
        // e.g. renderPreviewForm() - against a probe that's already null.
        this.setState({
            appMode: APP_MODE_PLAYLIST,
            playlistLoading: true,
            playlistError: false,
            videoId: null,
            probe: null,
            process: null,
            processStartedAt: null,
            processUpdatedAt: null,
            errorMessage: null,
            menuOpen: false,
        });
        this.requestPlaylistOverview(playlist);
    }

    requestPlaylistOverview(playlist) {
        this.setState({
            appMode: APP_MODE_PLAYLIST,
            playlist,
            playlistItems: [],
            playlistPrevPageToken: null,
            playlistNextPageToken: null,
            playlistLoadingPrev: false,
            playlistLoadingNext: false,
            playlistLoading: true,
            playlistError: false,
        });
        // No video id: the response carries the page of items and its paging
        // tokens, but no cur_video to route on.
        loadPlaylistPage(playlist.playlistId, "", playlist.pageToken, this.handlePlaylistOverviewSuccess, this.handlePlaylistOverviewError, { playlist });
    }

    async handlePlaylistOverviewSuccess(context, responseJsonPromise) {
        const resp = await responseJsonPromise;
        console.log("playlist overview result", resp);
        const items = ((resp && resp.items) || []).map((item) => Object.assign({}, item, { playlist: context.playlist }));
        this.setState({
            playlistItems: items,
            playlistPrevPageToken: (resp && resp.prev_page_token) || null,
            playlistNextPageToken: (resp && resp.next_page_token) || null,
            playlistLoading: false,
            playlistError: false,
        });
    }

    async handlePlaylistOverviewError(context, responseTextPromise) {
        const text = await responseTextPromise;
        console.log("playlist overview error:", text);
        this.setState({ playlistLoading: false, playlistError: true });
    }

    // ===== Playlist panel: browse and page through the active playlist =====

    // Switches to another video within the same playlist, keeping `list` in the
    // URL - and `page` pinned to the window the clicked item was loaded under,
    // so the resulting window still contains it. That's the ref each item was
    // stamped with when its page arrived.
    onPlaylistItemClick(videoId, playlist) {
        if (!playlist) {
            return;
        }
        this.probePlaylist(videoId, playlist);
    }

    // The active playlist at another window - null when there's no playlist, or
    // no token for that direction (i.e. no further page that way).
    pageRef(pageToken) {
        const playlist = this.state.playlist;
        if (!playlist || !pageToken) {
            return null;
        }
        return playlist.withPageToken(pageToken);
    }

    requestPlaylistPage(playlist, direction) {
        if (!playlist) {
            return;
        }
        // Empty in APP_MODE_PLAYLIST, where no video is selected yet.
        const videoId = (this.state.probe && this.state.probe.info && this.state.probe.info.online_video_id) || "";
        this.setState(direction === "next" ? { playlistLoadingNext: true } : { playlistLoadingPrev: true });
        loadPlaylistPage(playlist.playlistId, videoId, playlist.pageToken, this.handlePlaylistPageSuccess, this.handlePlaylistPageError, { direction, playlist });
    }

    onPlaylistPrevPageClick() {
        this.requestPlaylistPage(this.pageRef(this.state.playlistPrevPageToken), "prev");
    }

    onPlaylistNextPageClick() {
        this.requestPlaylistPage(this.pageRef(this.state.playlistNextPageToken), "next");
    }

    async handlePlaylistPageSuccess(context, responseJsonPromise) {
        const resp = await responseJsonPromise;
        const items = ((resp && resp.items) || []).map((item) => Object.assign({}, item, { playlist: context.playlist }));
        const direction = context.direction;
        this.setState((prevState) => {
            const existing = prevState.playlistItems || [];
            const merged = direction === "next" ? existing.concat(items) : items.concat(existing);
            const update = { playlistItems: merged };
            if (direction === "next") {
                update.playlistNextPageToken = (resp && resp.next_page_token) || null;
                update.playlistLoadingNext = false;
            } else {
                update.playlistPrevPageToken = (resp && resp.prev_page_token) || null;
                update.playlistLoadingPrev = false;
            }
            return update;
        });
    }

    async handlePlaylistPageError(context, responseTextPromise) {
        const text = await responseTextPromise;
        console.log("playlist page error:", text);
        const direction = context.direction;
        this.setState(direction === "next" ? { playlistLoadingNext: false } : { playlistLoadingPrev: false });
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
        // One-shot: the next video in a playlist, or a plain navigation, starts at 0.
        const startMs = this.clampStartMs(this.pendingStartMs);
        this.pendingStartMs = null;
        this.startMs = startMs;
        this.player = null;
        this.playerReady = false;
        this.tickTimer = null;
        this.subtitlesEndMs = null;
        this.subLoadToken = 0;
        // Seeded with the start position, not 0: the first tick would otherwise
        // find itself far outside the loaded subtitle window and re-request it.
        this.lastPositionMs = startMs;
        this.analysisToken = 0;
        this.analysisCueIndex = -1;
        this.historyInitialSaved = false;
        this.lastHistorySaveMs = 0;
        this.stopBreakdownJob();
        this.setState({
            subtitles: [], next: null, currentCueIndex: -1, currentCueUpcoming: false, positionMs: startMs,
            breakdown: [], breakdownCueIndex: -1, analyzing: false, menuOpen: false,
            bdBatches: {}, bdActive: null, bdNotice: null, bdUnavailable: false, bdLangUnsupported: false,
        });

        if (this.transcriptionId != null) {
            // Initial load: a page of words from where playback starts (covers
            // roughly a minute from there).
            this.requestSubtitlesJump(startMs);
        } else {
            this.setState({ subtitlesLoading: false });
        }

        this.bootYouTubePlayer();
    }

    // A requested start position, reduced to something playable: null/garbage and
    // anything at or past the end of the video become 0.
    clampStartMs(startMs) {
        if (startMs == null || startMs <= 0) {
            return 0;
        }
        const info = this.state.probe && this.state.probe.info;
        const durationMs = (info && info.duration_secs) ? info.duration_secs * 1000 : null;
        if (durationMs != null && startMs >= durationMs) {
            return 0;
        }
        return startMs;
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
        // The `start` cue parameter rather than a seekTo() once ready: seeking a
        // player that hasn't started yet also starts playback, and nothing else
        // here autoplays. Its resolution is whole seconds.
        const startSecs = Math.floor(this.startMs / 1000);
        console.log(`Creating YT player for ${videoId} at ${startSecs}s`);
        this.player = new window.YT.Player("watch_player", {
            videoId: videoId,
            playerVars: startSecs > 0 ? { start: startSecs } : {},
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
        const positionMs = this.currentPositionMs();
        const { index, upcoming, activeWordIndex } = this.updateCurrentCue(positionMs);
        this.loadSubtitlesIfNeeded(positionMs);
        if (this.player.getPlayerState() === VIDEO_PLAYING) {
            this.maybeSaveHistoryProgress(positionMs);
            const delay = computeNextTickDelayMs(
                positionMs, this.player.getPlaybackRate(), this.state.subtitles || [], index, upcoming, activeWordIndex
            );
            this.tickTimer = setTimeout(() => this.tick(), delay);
        }
    }

    // The playhead as the rest of the app should see it. The `start` cue parameter
    // positions the player, but one that hasn't begun playing can still report 0
    // for a moment; taking that at face value would reset the subtitle window to
    // the beginning of the video, so until playback starts the requested start
    // position wins. Inert once the player leaves the unstarted/cued states, so a
    // user seeking back before `start` is still reported honestly.
    currentPositionMs() {
        const reportedMs = Math.floor(this.player.getCurrentTime() * 1000);
        if (this.startMs <= 0 || reportedMs >= this.startMs) {
            return reportedMs;
        }
        const state = this.player.getPlayerState();
        if (state === VIDEO_UNSTARTED || state === VIDEO_CUED) {
            return this.startMs;
        }
        return reportedMs;
    }

    // ===== Watch history: local-storage-backed, most-recent-10 list =====

    // Called every tick while the player is actually playing. Saves once
    // immediately the first time playback is observed (the "initial progress"
    // save), then at most once per HISTORY_SAVE_INTERVAL_MS after that.
    maybeSaveHistoryProgress(positionMs) {
        const now = Date.now();
        if (!this.historyInitialSaved) {
            this.saveHistoryProgress(positionMs);
            this.historyInitialSaved = true;
            this.lastHistorySaveMs = now;
            return;
        }
        if (now - this.lastHistorySaveMs >= HISTORY_SAVE_INTERVAL_MS) {
            this.saveHistoryProgress(positionMs);
            this.lastHistorySaveMs = now;
        }
    }

    saveHistoryProgress(positionMs) {
        const info = this.state.probe && this.state.probe.info;
        if (!info || !info.online_video_id) {
            return;
        }
        saveWatchHistoryEntry({
            videoId: info.online_video_id,
            title: info.title,
            channelTitle: info.channel_title,
            thumbnailUrl: info.thumbnail_url,
            thumbnailWidth: info.thumbnail_width,
            thumbnailHeight: info.thumbnail_height,
            durationSecs: info.duration_secs,
            positionMs,
            updatedAt: Date.now(),
        });
    }

    // Jumps playback to a word of the cue on screen. Leaves the player playing or
    // paused as it was: a click while paused should scrub, not start playback.
    onWordClick(wordIndex) {
        if (!this.player || !this.playerReady) {
            return;
        }
        const subtitles = this.state.subtitles || [];
        const cueIndex = this.state.currentCueIndex;
        if (cueIndex < 0 || cueIndex >= subtitles.length) {
            return;
        }
        const words = subtitles[cueIndex].words || [];
        if (wordIndex < 0 || wordIndex >= words.length) {
            return;
        }
        // Fall back to 0 when the preceding cue isn't loaded (right after a jump)
        // or doesn't exist - then the lead is capped by the video start instead.
        const prevBoundaryMs = cueIndex > 0 ? subtitles[cueIndex - 1].end_ms : 0;
        const targetMs = computeSeekTargetMs(words, wordIndex, prevBoundaryMs);
        this.player.seekTo(targetMs / 1000, true);
        // getCurrentTime() can still report the pre-seek position for a moment, so
        // drive the UI from the target we asked for; the tick corrects any drift.
        this.updateCurrentCue(targetMs);
        this.tick();
    }

    onMenuToggle(e) {
        e.stopPropagation();
        this.setState((prevState) => ({ menuOpen: !prevState.menuOpen }));
    }

    closeMenu() {
        this.setState({ menuOpen: false });
    }

    // Closes the "..." menu on a click outside it; the button itself toggles
    // via onMenuToggle, so this only needs to handle everything else.
    onDocumentClick(e) {
        if (!this.state.menuOpen) {
            return;
        }
        if (this.menuRef.current && !this.menuRef.current.contains(e.target)) {
            this.closeMenu();
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
        if (!upcoming && index !== -1) {
            this.startSubAnalysisIfNeeded(index, subtitles[index]);
        }
        this.maybeAbandonBreakdownJob(index !== -1 ? subtitles[index] : null);
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
            // A jump replaces the array wholesale, so cue indices from the previous
            // batch - including any we analyzed - no longer refer to the same cues.
            this.analysisCueIndex = -1;
            this.setState({
                subtitles: items,
                subtitlesRequestStartMs: context.seekMs,
                next,
                subtitlesLoading: false,
                currentCueIndex: cue.index,
                currentCueUpcoming: cue.upcoming,
                positionMs: this.lastPositionMs,
                breakdown: [],
                breakdownCueIndex: -1,
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

    // ===== Grammar breakdown of the displayed cue =====

    onGrammarToggle() {
        const grammar = !this.state.grammar;
        if (grammar) {
            this.setState({ grammar });
            // Analyze the cue on screen right now instead of waiting for the next one.
            const subtitles = this.state.subtitles || [];
            const index = this.state.currentCueIndex;
            if (!this.state.currentCueUpcoming && index >= 0 && index < subtitles.length) {
                this.startSubAnalysis(index, subtitles[index]);
            }
        } else {
            this.analysisCueIndex = -1;
            this.setState({ grammar, breakdown: [], breakdownCueIndex: -1, analyzing: false });
        }
    }

    // Glosses arrive with the analysis, so this only changes what the cards show -
    // no re-analysis needed.
    onTranslationsToggle() {
        this.setState({ translations: !this.state.translations });
    }

    startSubAnalysisIfNeeded(cueIndex, cue) {
        if (!this.state.grammar || this.analysisCueIndex === cueIndex) {
            return;
        }
        this.startSubAnalysis(cueIndex, cue);
    }

    startSubAnalysis(cueIndex, cue) {
        const words = (cue && cue.words) || [];
        if (words.length === 0) {
            return;
        }
        this.analysisToken += 1;
        this.analysisCueIndex = cueIndex;
        const token = this.analysisToken;
        // /analyze_sub expects absolute-ms timings under different field names than
        // the subtitles endpoint returns.
        const body = JSON.stringify({
            words: words.map((w) => ({
                word: w.word,
                startTime: w.start_ms,
                endTime: w.end_ms,
            })),
        });
        this.setState({ analyzing: true });
        makeAnalyzeSubRequest(
            body,
            this.handleAnalyzeResponse,
            this.handleAnalyzeError,
            { token, cueIndex },
        );
    }

    async handleAnalyzeResponse(context, responseJsonPromise) {
        const response = await responseJsonPromise;
        if (context.token !== this.analysisToken) {
            console.log("ignore stale analysis response");
            return;
        }
        const analyzedParts = parseAnalyzeResponse(response);
        let filteredParts = [];
        for (const part of analyzedParts) {
            if (!isBreakdownWorthy(part.token)) {
                continue;
            }
            let filteredForms = [];
            for (const candidate of part.detectedForms) {
                if (candidate.tense != "infinitive") {
                    filteredForms.push(candidate);
                }
            }
            filteredParts.push(new AnalyzedPart(part.token, filteredForms, part.startTime, part.endTime));
        }
        this.setState({ breakdown: filteredParts, breakdownCueIndex: context.cueIndex, analyzing: false });
    }

    async handleAnalyzeError(context, responseTextPromise) {
        const text = await responseTextPromise;
        console.log(`analyze_sub error: ${text}`);
        if (context.token === this.analysisToken) {
            this.analysisCueIndex = -1; // allow a retry when this cue comes around again
            this.setState({ analyzing: false });
        }
    }

    // ===== AI analysis: per-sentence breakdowns of the displayed cue =====

    // The cue rendered by renderSubtitles(), or null when none is on screen.
    displayedCue() {
        const subtitles = this.state.subtitles || [];
        const idx = this.state.currentCueIndex;
        if (idx == null || idx < 0 || idx >= subtitles.length) {
            return null;
        }
        return subtitles[idx];
    }

    // Ends whatever generation job is in flight. Bumping the token makes every
    // response of that job - including one already awaiting its body - a no-op,
    // so an abandoned job can't resurrect its state or fire an enqueue.
    stopBreakdownJob() {
        this.bdToken += 1;
        if (this.bdPollTimer) {
            clearTimeout(this.bdPollTimer);
            this.bdPollTimer = null;
        }
        if (this.bdTimeoutTimer) {
            clearTimeout(this.bdTimeoutTimer);
            this.bdTimeoutTimer = null;
        }
    }

    onAiAnalysisClick() {
        if (this.props.lang !== I18N_LANG_RU) {
            this.setState({ bdLangUnsupported: true });
            return;
        }
        const cue = this.displayedCue();
        if (cue == null || this.transcriptionId == null) {
            return;
        }
        this.startBreakdownJob(cue.start_ms);
    }

    onAiAnalysisNoticeClose() {
        this.setState({ bdNotice: null, bdLangUnsupported: false });
    }

    // Asking about the cue's own start (rather than the raw playhead) keeps the
    // position inside a sentence, so the batch the server resolves always spans
    // the position we'll later look the result up by.
    startBreakdownJob(requestMs) {
        this.stopBreakdownJob();
        const token = this.bdToken;
        this.restartBreakdownTimeout(token);
        this.setState({
            bdNotice: null,
            bdActive: {
                requestMs, startMs: null, endMs: null, startedAt: Date.now(),
                enqueues: 0, preview: "", streaming: false,
            },
        });
        this.requestBreakdowns(token, requestMs);
    }

    // Restarted on every response that carries new sentences, so the timeout
    // measures the gap between installments of a streaming batch.
    restartBreakdownTimeout(token) {
        if (this.bdTimeoutTimer) {
            clearTimeout(this.bdTimeoutTimer);
        }
        this.bdTimeoutTimer = setTimeout(() => this.onBreakdownTimeout(token), BREAKDOWN_TIMEOUT_MS);
    }

    // Whether the batch already has sentences on hand: a job that delivered some
    // has nothing to fail about and nothing to re-enqueue.
    batchHasRows(batchStart) {
        const entry = (this.state.bdBatches || {})[batchStart];
        return entry != null && entry.breakdowns.length > 0;
    }

    requestBreakdowns(token, requestMs) {
        loadBreakdowns(
            this.transcriptionId,
            { start_ms: requestMs, lang: BREAKDOWN_LANG },
            this.handleBreakdownsResponse,
            this.handleBreakdownsError,
            { token, requestMs },
        );
    }

    // The position the next poll asks about: the live playhead while it is still
    // inside the batch being generated, so the `preview` that comes back is the
    // sentence the viewer is on. Before the batch bounds are known - or once the
    // playhead has left them - the position the job started from is kept, since
    // that is the one the batch was resolved from.
    pollPositionMs(fallbackMs) {
        const active = this.state.bdActive;
        const positionMs = this.lastPositionMs;
        if (active != null && positionMs != null && spanContains(active, positionMs)) {
            return positionMs;
        }
        return fallbackMs;
    }

    scheduleBreakdownPoll(token, requestMs, delayMs) {
        this.bdPollTimer = setTimeout(() => {
            // Only clear the handle when it is still ours: a job started after
            // this timer was scheduled owns the field by now.
            if (token !== this.bdToken) {
                return;
            }
            this.bdPollTimer = null;
            this.requestBreakdowns(token, this.pollPositionMs(requestMs));
        }, delayMs);
    }

    // Ends the job with a message the user can dismiss. The notice is anchored to
    // the region it is about, so it doesn't follow the playhead into a part of the
    // video it says nothing about.
    failBreakdownJob(messageKey) {
        const active = this.state.bdActive;
        this.stopBreakdownJob();
        if (active == null) {
            return;
        }
        this.setState({
            bdActive: null,
            bdNotice: {
                message: this.i18n(messageKey),
                startMs: active.startMs != null ? active.startMs : active.requestMs,
                endMs: active.endMs != null ? active.endMs : active.requestMs,
            },
        });
    }

    onBreakdownTimeout(token) {
        if (token !== this.bdToken) {
            return;
        }
        const active = this.state.bdActive;
        // A streaming batch that stalls has already put sentences on screen, so
        // it ends quietly instead of replacing them with an error.
        if (active != null && this.batchHasRows(active.batchStart)) {
            this.stopBreakdownJob();
            this.setState({ bdActive: null });
            return;
        }
        this.failBreakdownJob("aiAnalysisTimeout");
    }

    // Called every tick. Generation the user has moved away from is dropped
    // wholesale - polling stops and the panel comes back. The server keeps
    // working, so returning to the region and clicking again picks the result up.
    maybeAbandonBreakdownJob(cue) {
        const active = this.state.bdActive;
        if (active == null || active.startMs == null || cue == null) {
            return;
        }
        if (spanContains(active, cue.start_ms)) {
            return;
        }
        this.stopBreakdownJob();
        this.setState({ bdActive: null });
    }

    async handleBreakdownsResponse(context, responseJsonPromise) {
        const resp = await responseJsonPromise;
        if (context.token !== this.bdToken) {
            console.log("ignore stale breakdowns response");
            return;
        }
        const message = resp.message || "";
        if (!resp.ok && message === BREAKDOWN_NO_SENTENCES) {
            // batch_start/start_ms/end_ms are all 0 here, so there's no region to
            // anchor to: this is about the transcription as a whole.
            this.stopBreakdownJob();
            this.setState({ bdActive: null, bdNotice: null, bdUnavailable: true });
            return;
        }

        const span = batchSpan(resp, context.requestMs);
        const cue = this.displayedCue();
        // The playhead may have left the batch while this response was in flight.
        if (cue == null || !spanContains(span, cue.start_ms)) {
            this.stopBreakdownJob();
            this.setState({ bdActive: null });
            return;
        }
        const batchStart = resp.batch_start || 0;
        const knownEntry = (this.state.bdBatches || {})[batchStart];
        const prevRows = knownEntry != null ? knownEntry.breakdowns : [];
        // A response without a preview (or one for a position we did not ask
        // about yet) leaves the last one standing rather than blanking the panel.
        const prevPreview = this.state.bdActive != null ? this.state.bdActive.preview : "";
        const preview = resp.preview || prevPreview || "";
        const active = Object.assign({}, this.state.bdActive, span, { batchStart, preview });

        if (resp.ok) {
            const breakdowns = resp.breakdowns || [];
            if (breakdowns.length === 0) {
                // Documented as impossible ("ok is true only when breakdowns is
                // populated"), but caching it would make the panel un-clickable.
                console.log(`breakdowns: ok with no rows for batch ${batchStart}`);
                this.setState({ bdActive: active }, () => this.failBreakdownJob("aiAnalysisFailed"));
                return;
            }
            const entry = { batchStart, startMs: span.startMs, endMs: span.endMs, breakdowns };
            // The rest of the batch is still being generated: cache what arrived,
            // keep the job (and its token) alive, and poll for the next
            // installment. The sentences already show wherever they overlap the
            // displayed cue.
            if (resp.batch_running) {
                // Only sentences we didn't have count as progress: a stream that
                // keeps repeating what it already sent still has to time out.
                const knownSeqs = new Set(prevRows.map((sentence) => sentence.seq));
                if (breakdowns.some((sentence) => !knownSeqs.has(sentence.seq))) {
                    this.restartBreakdownTimeout(context.token);
                }
                this.setState((prevState) => ({
                    bdBatches: mergeBatch(prevState.bdBatches, entry),
                    bdActive: Object.assign({}, active, { streaming: true }),
                    bdNotice: null,
                }));
                this.scheduleBreakdownPoll(context.token, context.requestMs, BREAKDOWN_STREAM_POLL_MS);
                return;
            }
            this.stopBreakdownJob();
            this.setState((prevState) => ({
                bdBatches: mergeBatch(prevState.bdBatches, entry),
                bdActive: null,
                bdNotice: null,
            }));
            return;
        }

        // "running" is "pending" with a job actually working on the batch; both
        // mean the answer is on its way, and both carry the preview shown while
        // the user waits.
        if (message === BREAKDOWN_PENDING || message === BREAKDOWN_RUNNING) {
            this.setState({ bdActive: active });
            const delayMs = active.streaming ? BREAKDOWN_STREAM_POLL_MS : BREAKDOWN_POLL_MS;
            this.scheduleBreakdownPoll(context.token, context.requestMs, delayMs);
            return;
        }
        // "done" without rows behaves like "missing": a POST retries either one.
        // Flipping back to "missing" after we enqueued means the job failed, which
        // is why the attempts are capped.
        if (message === BREAKDOWN_MISSING || message === BREAKDOWN_DONE) {
            // A batch that already delivered sentences has just stopped
            // streaming; enqueueing it again would pay for the same generation
            // twice.
            if (this.batchHasRows(batchStart)) {
                this.stopBreakdownJob();
                this.setState({ bdActive: null });
                return;
            }
            if (active.enqueues >= BREAKDOWN_MAX_ENQUEUES) {
                console.log(`breakdowns: giving up on batch ${batchStart} after ${active.enqueues} enqueues`);
                this.setState({ bdActive: active }, () => this.failBreakdownJob("aiAnalysisFailed"));
                return;
            }
            active.enqueues += 1;
            this.setState({ bdActive: active });
            enqueueBreakdowns(
                { transcription_id: this.transcriptionId, lang: BREAKDOWN_LANG, sent_seq: batchStart },
                this.handleEnqueueResponse,
                this.handleEnqueueError,
                { token: context.token, requestMs: context.requestMs },
            );
            return;
        }
        console.log(`breakdowns: unexpected message "${message}"`);
        this.setState({ bdActive: active }, () => this.failBreakdownJob("aiAnalysisFailed"));
    }

    async handleBreakdownsError(context, responseTextPromise) {
        const text = await responseTextPromise;
        console.log(`breakdowns error: ${text}`);
        if (context.token !== this.bdToken) {
            return;
        }
        this.failBreakdownJob("aiAnalysisFailed");
    }

    async handleEnqueueResponse(context, responseJsonPromise) {
        const resp = await responseJsonPromise;
        if (context.token !== this.bdToken) {
            console.log("ignore stale enqueue response");
            return;
        }
        if (resp.proceed_to_polling) {
            this.scheduleBreakdownPoll(context.token, context.requestMs, BREAKDOWN_POLL_MS);
            return;
        }
        const message = resp.message || "";
        if (message === ENQUEUE_NO_SENTENCES) {
            this.stopBreakdownJob();
            this.setState({ bdActive: null, bdNotice: null, bdUnavailable: true });
            return;
        }
        if (message === ENQUEUE_NO_QUOTA) {
            this.failBreakdownJob("aiAnalysisNoQuota");
            return;
        }
        if (message === ENQUEUE_QUEUE_FULL) {
            // Nothing was queued, so this attempt is given back. The in-flight
            // batches of this transcription have to drain first; the job's own
            // timeout bounds how long we wait for that.
            this.setState((prevState) => ({
                bdActive: prevState.bdActive == null
                    ? null
                    : Object.assign({}, prevState.bdActive, { enqueues: Math.max(0, prevState.bdActive.enqueues - 1) }),
            }));
            this.scheduleBreakdownPoll(context.token, context.requestMs, BREAKDOWN_QUEUE_FULL_RETRY_MS);
            return;
        }
        console.log(`enqueue breakdowns: unexpected message "${message}"`);
        this.failBreakdownJob("aiAnalysisFailed");
    }

    async handleEnqueueError(context, responseTextPromise) {
        const text = await responseTextPromise;
        console.log(`enqueue breakdowns error: ${text}`);
        if (context.token !== this.bdToken) {
            return;
        }
        this.failBreakdownJob("aiAnalysisFailed");
    }

    // ===== APP_MODE_PROMPT =====

    onVideoCardClick(videoId, startMs) {
        this.probeById(videoId, startMs);
    }

    onPromptTabClick(tab) {
        this.setState({ promptTab: tab });
        if (tab === PROMPT_TAB_PLAYLISTS && !this.state.playlistsRequested) {
            this.setState({ playlistsRequested: true, playlistsLoading: true });
            loadSuggestedPlaylists("", this.handleSuggestedPlaylistsSuccess, this.handleSuggestedPlaylistsError, { append: false });
        }
    }

    async handleSuggestedPlaylistsSuccess(context, responseJsonPromise) {
        const resp = await responseJsonPromise;
        const items = (resp && resp.playlists) || [];
        const nextCursor = (resp && typeof resp.next_cursor === "number") ? resp.next_cursor : null;
        if (!context.append && items.length === 0) {
            this.setState({ playlistsError: true, playlistsLoading: false, playlistsLoadingMore: false });
            return;
        }
        this.setState((prevState) => ({
            playlists: context.append ? prevState.playlists.concat(items) : items,
            playlistsNextCursor: nextCursor,
            playlistsLoading: false,
            playlistsLoadingMore: false,
            playlistsError: false,
        }));
    }

    async handleSuggestedPlaylistsError(context, responseTextPromise) {
        const text = await responseTextPromise;
        console.log("suggested playlists error:", text);
        if (context.append) {
            this.setState({ playlistsLoadingMore: false });
        } else {
            this.setState({ playlistsError: true, playlistsLoading: false });
        }
    }

    // Opens the playlist overview at its default window - a card carries no page
    // token, so the API picks the first page.
    onPlaylistCardClick(playlistId) {
        this.enterPlaylistMode(new PlaylistRef(playlistId, ""));
    }

    onLoadMorePlaylistsClick() {
        const cursor = this.state.playlistsNextCursor;
        if (cursor == null || this.state.playlistsLoadingMore) {
            return;
        }
        this.setState({ playlistsLoadingMore: true });
        loadSuggestedPlaylists(`${cursor}`, this.handleSuggestedPlaylistsSuccess, this.handleSuggestedPlaylistsError, { append: true });
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
                            className="shadow appearance-none border rounded w-full p-3 text-base lg:text-lg text-gray-700 focus:outline-none focus:shadow-outline"
                            onChange={this.onInputChange}
                            autoFocus />
                        <button
                            type="button"
                            onClick={this.onSubmit}
                            className="ml-2 bg-blue-500 hover:bg-blue-700 text-white text-xl font-bold px-4 rounded focus:outline-none focus:shadow-outline">
                            →
                        </button>
                    </div>
                    {this.state.promptError && (
                        <div className="mt-2 text-red-600 text-base">{this.state.promptError}</div>
                    )}
                </form>
                {this.renderIntro()}
                {this.renderPromptTabs()}
                {this.renderPromptTabContent()}
            </div>
        );
    }

    renderIntro() {
        const steps = [
            { titleKey: "watchStep1Title", bodyKey: "watchStep1Body" },
            { titleKey: "watchStep2Title", bodyKey: "watchStep2Body" },
            { titleKey: "watchStep3Title", bodyKey: "watchStep3Body" },
            { titleKey: "watchStep4Title", bodyKey: "watchStep4Body" },
        ];
        return (
            <div className="mt-8 mb-12 px-3 max-w-3xl mx-auto text-gray-700 text-base lg:text-lg">
                <h2 className="text-xl lg:text-2xl font-bold text-gray-800">
                    {this.i18n("watchAboutHeading")}
                </h2>
                <p className="mt-3">{this.i18n("watchAboutIntro")}</p>
                <p className="mt-3">{this.i18n("watchAboutFlow")}</p>
                <p className="mt-3">{this.i18n("watchAboutNoSetup")}</p>

                <h2 className="mt-8 text-xl lg:text-2xl font-bold text-gray-800">
                    {this.i18n("watchHowToHeading")}
                </h2>
                <ol className="mt-3 list-decimal list-outside pl-8">
                    {steps.map((step) => (
                        <li key={step.titleKey} className="mt-4">
                            <h3 className="text-lg font-medium text-gray-800">
                                {this.i18n(step.titleKey)}
                            </h3>
                            <p className="mt-1">{this.i18n(step.bodyKey)}</p>
                        </li>
                    ))}
                </ol>
            </div>
        );
    }

    renderPromptTabs() {
        const tabs = [
            { key: PROMPT_TAB_RECS, labelKey: "tabRecommendations" },
            { key: PROMPT_TAB_PLAYLISTS, labelKey: "tabPlaylists" },
            { key: PROMPT_TAB_HISTORY, labelKey: "tabHistory" },
        ];
        const activeTab = this.state.promptTab;
        return (
            <div className="mt-4 px-3 flex flex-row justify-center gap-2 sm:gap-4">
                {tabs.map((tab) => {
                    const active = tab.key === activeTab;
                    const className = active
                        ? "px-4 sm:px-8 py-3 rounded-full text-base sm:text-lg font-medium bg-blue-500 text-white focus:outline-none"
                        : "px-4 sm:px-8 py-3 rounded-full text-base sm:text-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 focus:outline-none";
                    return (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => this.onPromptTabClick(tab.key)}
                            className={className}>
                            {this.i18n(tab.labelKey)}
                        </button>
                    );
                })}
            </div>
        );
    }

    // The recommendations tab stays mounted, hidden, so switching tabs and back
    // doesn't drop its loaded topics and videos.
    renderPromptTabContent() {
        const tab = this.state.promptTab;
        return (
            <div>
                <div className={tab === PROMPT_TAB_RECS ? "" : "hidden"}>
                    <RecommendationsTab lang={this.props.lang} onVideoClick={this.onVideoCardClick} />
                </div>
                {tab === PROMPT_TAB_PLAYLISTS && this.renderPlaylists()}
                {tab === PROMPT_TAB_HISTORY && this.renderHistory()}
            </div>
        );
    }

    renderComingSoon(labelKey) {
        return (
            <div className="mt-6 px-3 text-center text-gray-500">
                {this.i18n(labelKey)}
            </div>
        );
    }

    renderHistory() {
        const history = loadWatchHistory();
        if (history.length === 0) {
            return this.renderComingSoon("historyEmpty");
        }
        const items = history.map((h) => ({
            id: h.videoId,
            title: h.title,
            channelTitle: h.channelTitle,
            thumbnailUrl: h.thumbnailUrl,
            thumbnailWidth: h.thumbnailWidth,
            thumbnailHeight: h.thumbnailHeight,
            durationSecs: h.durationSecs,
            positionMs: h.positionMs,
            startMs: resumePositionMs(h.positionMs, h.durationSecs),
        }));
        return <VideoGrid items={items} onVideoClick={this.onVideoCardClick} />;
    }

    renderSpinner(className) {
        return <Spinner className={className} />;
    }

    renderPlaylists() {
        if (this.state.playlistsLoading) {
            return (
                <div className="flex justify-center py-4">
                    {this.renderSpinner("animate-spin rounded-full h-6 w-6 border-4 border-gray-200")}
                </div>
            );
        }
        if (this.state.playlistsError) {
            return (
                <div className="mt-6 px-3 text-center text-red-600">
                    {this.i18n("playlistsLoadError")}
                </div>
            );
        }
        const playlists = this.state.playlists || [];
        return (
            <div className="mt-4 px-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {playlists.map((p) => (
                        <div
                            key={p.online_playlist_id}
                            onClick={() => this.onPlaylistCardClick(p.online_playlist_id)}
                            className="cursor-pointer flex flex-col rounded-lg overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
                            <div className="relative" style={{ paddingBottom: "75%" }}>
                                <img
                                    src={p.thumbnail_url}
                                    alt={p.title}
                                    width={p.thumbnail_width}
                                    height={p.thumbnail_height}
                                    className="absolute inset-0 w-full h-full object-cover" />
                                <span className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-sm px-1 rounded">
                                    {this.i18n("playlistItemCountTempl")(p.item_count)}
                                </span>
                            </div>
                            <div className="p-2">
                                <div className="text-base font-medium text-gray-800 truncate" title={p.title}>{p.title}</div>
                            </div>
                        </div>
                    ))}
                </div>
                {this.state.playlistsNextCursor != null && (
                    <div className="mt-4 flex justify-center">
                        <button
                            type="button"
                            onClick={this.onLoadMorePlaylistsClick}
                            disabled={this.state.playlistsLoadingMore}
                            className="flex flex-row items-center bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 text-base font-medium py-3 px-4 rounded focus:outline-none">
                            {this.state.playlistsLoadingMore && this.renderSpinner("animate-spin rounded-full h-4 w-4 border-4 border-gray-300 mr-2")}
                            {this.i18n("loadMorePlaylists")}
                        </button>
                    </div>
                )}
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
                    className="rounded max-w-full h-auto" />
                <div className="mt-2 text-lg font-medium text-gray-800 text-center">{info.title}</div>
                <div className="text-sm text-gray-600">{info.channel_title}</div>
                <div className="text-sm text-gray-500">{formatDuration(info.duration_secs)}</div>
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
                        className="mt-3 bg-blue-500 hover:bg-blue-700 text-white text-base font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline">
                        {this.i18n("generateSubtitles")}
                    </button>
                    : <div className="mt-3 text-base text-red-600">
                        {this.i18n("cantGenerateSubtitles")}:&nbsp;{obstacle}
                    </div>
                }
                {this.renderPlaylistPanel()}
            </div>
        );
    }

    renderProbingForm() {
        return (
            <div className="flex justify-center py-4">
                <div className="text-base text-gray-500">{this.i18n("isLoading")}</div>
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
                    <div className="text-lg text-gray-700">
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
                    <div className="mt-1 text-base text-red-600">{process.error_message}</div>
                )}
                {queue.length > 0 && (
                    <div className="mt-3 text-base text-gray-700">
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
                            className="bg-blue-500 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-base font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline">
                            {this.i18n("refreshButton")}
                        </button>
                    )}
                    {process && process.state === "done" && (
                        <button
                            type="button"
                            onClick={this.onProceedClick}
                            disabled={!!this.state.proceeding}
                            className="bg-green-500 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-base font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline">
                            {this.i18n("watchButton")}
                        </button>
                    )}
                </div>
                {this.renderPlaylistPanel()}
            </div>
        );
    }

    renderAsrQuota(quota) {
        const pct = Math.min(100, Math.max(0, quota.used_percent));
        const barColor = pct >= 90 ? "bg-red-500" : "bg-blue-500";
        return (
            <div className="mt-3 w-full max-w-md text-left">
                <div className="text-sm text-gray-600">{this.i18n("asrQuota")}</div>
                <div className="mt-1 text-sm text-gray-700">{quota.day}</div>
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
                <div className="text-base text-red-600">{this.state.errorMessage}</div>
            </div>
        );
    }

    renderWatchView() {
        const probe = this.state.probe;
        const info = probe && probe.info;
        return (
            <div className="flex flex-col items-center w-full">
                <div className="w-full max-w-3xl px-2">
                    {info && (
                        <div className="flex flex-row items-start justify-between py-1">
                            <div className="min-w-0 flex-1 text-left">
                                <div className="text-base lg:text-lg font-medium text-gray-800 truncate" title={info.title}>{info.title}</div>
                                <div className="text-sm text-gray-500 truncate">{info.channel_title}</div>
                            </div>
                            {this.renderVideoMenu()}
                        </div>
                    )}
                    <div className="watch-video-box mx-auto">
                        <div id="watch_player"></div>
                    </div>
                    {this.renderSubtitles()}
                    {this.renderAiAnalysis()}
                    <div className="flex flex-row justify-end">
                        {/* Translations live inside the grammar cards, so the toggler
                            would do nothing visible while grammar is off. */}
                        {this.state.grammar && this.renderToggler(this.state.translations, this.onTranslationsToggle, "toggleTranslations")}
                        {this.renderToggler(this.state.grammar, this.onGrammarToggle, "toggleGrammar")}
                    </div>
                    {this.renderBreakdown()}
                </div>
                {this.renderPlaylistPanel()}
            </div>
        );
    }

    // The playlist as a list of clickable items with its prev/next paging
    // controls. Shared by the panel under a video (a bounded, scrollable strip)
    // and by APP_MODE_PLAYLIST, which is nothing but this list - hence
    // `opts.listClass`, which lets the overview drop the height cap and let the
    // page itself scroll.
    renderPlaylistPanel(opts) {
        const listClass = (opts && opts.listClass) || "max-h-72 lg:max-h-96 overflow-y-auto border border-gray-200 rounded-lg";
        const items = this.state.playlistItems || [];
        if (items.length === 0) {
            return null;
        }
        // Undefined in the overview, where no video is selected - so no row
        // comes out highlighted, which is what we want there.
        const currentVideoId = this.state.probe && this.state.probe.info && this.state.probe.info.online_video_id;
        return (
            <div className="w-full max-w-2xl px-4 py-2">
                <div className="text-base lg:text-lg font-medium text-gray-800 mb-2">{this.i18n("watchPlaylistHeading")}</div>
                <div className={listClass}>
                    {this.state.playlistPrevPageToken != null && (
                        <div className="flex justify-center py-2 border-b border-gray-100">
                            <button
                                type="button"
                                onClick={this.onPlaylistPrevPageClick}
                                disabled={this.state.playlistLoadingPrev}
                                className="flex flex-row items-center py-2 px-3 text-base text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none">
                                {this.state.playlistLoadingPrev && this.renderSpinner("animate-spin rounded-full h-4 w-4 border-4 border-gray-300 mr-2")}
                                {this.i18n("watchPlaylistLoadPrevious")}
                            </button>
                        </div>
                    )}
                    {items.map((item, i) => {
                        const active = item.online_video_id === currentVideoId;
                        const rowClass = active
                            ? "flex flex-row items-center gap-3 p-3 cursor-pointer bg-blue-50"
                            : "flex flex-row items-center gap-3 p-3 cursor-pointer hover:bg-gray-50";
                        const titleClass = active
                            ? "text-base font-semibold text-blue-700 truncate"
                            : "text-base text-gray-800 truncate";
                        return (
                            <div
                                key={`${item.online_video_id}-${i}`}
                                onClick={() => this.onPlaylistItemClick(item.online_video_id, item.playlist)}
                                className={rowClass}>
                                <img
                                    src={item.thumbnail_url}
                                    alt={item.title}
                                    className="w-24 h-16 object-cover rounded flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <div className={titleClass} title={item.title}>{item.title}</div>
                                    <div className="text-sm text-gray-500 truncate">{item.channel_title}</div>
                                </div>
                            </div>
                        );
                    })}
                    {this.state.playlistNextPageToken != null && (
                        <div className="flex justify-center py-2 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={this.onPlaylistNextPageClick}
                                disabled={this.state.playlistLoadingNext}
                                className="flex flex-row items-center py-2 px-3 text-base text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none">
                                {this.state.playlistLoadingNext && this.renderSpinner("animate-spin rounded-full h-4 w-4 border-4 border-gray-300 mr-2")}
                                {this.i18n("watchPlaylistLoadMore")}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // APP_MODE_PLAYLIST: the playlist on its own, before any video is picked.
    renderPlaylistView() {
        return (
            <div className="flex flex-col items-center w-full">
                {this.renderPlaylistViewBody()}
            </div>
        );
    }

    renderPlaylistViewBody() {
        if (this.state.playlistLoading) {
            return (
                <div className="flex justify-center py-4">
                    {this.renderSpinner("animate-spin rounded-full h-6 w-6 border-4 border-gray-200")}
                </div>
            );
        }
        if (this.state.playlistError) {
            return (
                <div className="mt-6 px-3 text-center text-red-600">
                    {this.i18n("playlistsLoadError")}
                </div>
            );
        }
        if ((this.state.playlistItems || []).length === 0) {
            return (
                <div className="mt-6 px-3 text-center text-gray-500">
                    {this.i18n("playlistEmpty")}
                </div>
            );
        }
        return this.renderPlaylistPanel({ listClass: "border border-gray-200 rounded-lg" });
    }

    renderSubtitles() {
        const subtitles = this.state.subtitles || [];
        const idx = this.state.currentCueIndex;
        const upcoming = !!this.state.currentCueUpcoming;
        const positionMs = this.state.positionMs || 0;

        if (this.state.subtitlesLoading && subtitles.length === 0) {
            return (
                <div className="text-center text-base text-gray-500">{this.i18n("isLoading")}</div>
            );
        }
        if (subtitles.length === 0) {
            return (
                <div className="text-center text-base text-gray-500">{this.i18n("noSubtitles")}</div>
            );
        }
        if (idx == null || idx < 0 || idx >= subtitles.length) {
            return null; // gap after the last loaded cue: nothing to show
        }
        const sub = subtitles[idx];
        const cardClass = upcoming
            ? "my-2 p-3 rounded bg-gray-100"
            : "my-2 p-3 rounded bg-blue-50";
        const stampClass = upcoming
            ? "font-mono text-sm text-gray-400 mr-2"
            : "font-mono text-sm text-blue-500 mr-2";
        const textClass = upcoming
            ? "text-gray-500 text-2xl lg:text-xl"
            : "text-gray-800 text-2xl lg:text-xl";

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
            <div className="mt-2 h-4 w-20 rounded bg-yellow-300 overflow-hidden">
                <div
                    className="h-4 bg-white"
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
                        // The separating space stays outside the span so only the
                        // word itself is a click target.
                        <React.Fragment key={i}>
                            <span
                                className={wordClass(i === activeWordIndex)}
                                onClick={() => this.onWordClick(i)}>
                                {w.word}
                            </span>
                            {" "}
                        </React.Fragment>
                    ))}
                </span>
            </div>
        );
    }

    // Sits under the cue, the same width, and follows the playhead: cached
    // sentences appear as their time comes, and whatever region has nothing
    // loaded falls back to the panel that starts a generation for it.
    renderAiAnalysis() {
        const cue = this.displayedCue();
        if (cue == null || this.transcriptionId == null) {
            return null;
        }
        if (this.state.bdLangUnsupported) {
            return this.renderAiAnalysisNotice(this.i18n("aiAnalysisLangUnsupported"), true);
        }
        if (this.state.bdUnavailable) {
            return this.renderAiAnalysisNotice(this.i18n("aiAnalysisNoSentences"), false);
        }
        const sentences = sentencesForRange(this.state.bdBatches || {}, cue.start_ms, cue.end_ms);
        const active = this.state.bdActive;
        // Before the first response the batch bounds are unknown, so the job is
        // only recognized as this cue's while the playhead is still on the cue it
        // was started from.
        const activeHere = active != null && (active.startMs != null
            ? spanContains(active, cue.start_ms)
            : active.requestMs === cue.start_ms);
        if (sentences.length > 0) {
            // In a silent gap the playhead sits before the cue, where the last
            // started sentence is one the viewer has already heard, so the cue
            // itself anchors the choice instead.
            const anchorMs = this.state.currentCueUpcoming ? cue.start_ms : this.state.positionMs;
            const shown = visibleSentences(sentences, anchorMs, PRECEDING_WORDS_LIMIT);
            const currentIndex = activeSentenceIndex(shown, anchorMs);
            const currentSeq = currentIndex === -1 ? null : shown[currentIndex].seq;
            // A job still running over this cue's batch has more sentences to
            // deliver, so the analysis says so instead of looking finished.
            return (
                <React.Fragment>
                    <AiAnalysisSentences sentences={shown} currentSeq={currentSeq} />
                    {activeHere && this.renderAiAnalysisMoreComing()}
                </React.Fragment>
            );
        }
        if (activeHere) {
            return this.renderAiAnalysisProgress(Date.now() - active.startedAt, active.preview);
        }
        const notice = this.state.bdNotice;
        if (notice != null && spanContains(notice, cue.start_ms)) {
            return this.renderAiAnalysisNotice(notice.message, true);
        }
        // The batch covering this cue is loaded, it just carries no sentence for
        // it (the API returns partial coverage as-is). Offering the panel here
        // would only re-fetch what we already have.
        if (findBatch(this.state.bdBatches || {}, cue.start_ms) != null) {
            return null;
        }
        return (
            <div
                onClick={this.onAiAnalysisClick}
                className="ai-analysis-panel my-2 p-4 rounded text-center text-white text-lg font-medium cursor-pointer select-none">
                {this.i18n("aiAnalysis")}
            </div>
        );
    }

    // `preview` is the sentence the analysis is being prepared for, as the server
    // resolved it from the position we asked about. With one, the panel is laid
    // out like a finished breakdown - the sentence first, the spinner a caption
    // under it - so the text doesn't move when the analysis replaces it.
    renderAiAnalysisProgress(elapsedMs, preview) {
        if (!preview) {
            return (
                <div className="my-2 p-3 rounded bg-gray-100 flex flex-col items-center">
                    <div className="flex flex-row items-center">
                        {this.renderSpinner("animate-spin rounded-full h-6 w-6 border-4 border-gray-200 mr-2")}
                        <span className="text-base text-gray-700">{this.i18n("aiAnalysisPreparing")}</span>
                    </div>
                    {elapsedMs >= BREAKDOWN_SLOW_MS && (
                        <div className="mt-1 text-sm text-gray-500">{this.i18n("aiAnalysisSlow")}</div>
                    )}
                </div>
            );
        }
        return (
            <div className="my-2 p-3 rounded bg-gray-100 flex flex-col items-start">
                <AiAnalysisSentenceText text={preview} />
                <div className="mt-2 flex flex-row items-center">
                    {this.renderSpinner("animate-spin rounded-full h-4 w-4 border-2 border-gray-200 mr-2")}
                    <span className="text-sm text-gray-500">{this.i18n("aiAnalysisPreparing")}</span>
                </div>
                {elapsedMs >= BREAKDOWN_SLOW_MS && (
                    <div className="mt-1 text-sm text-gray-500">{this.i18n("aiAnalysisSlow")}</div>
                )}
            </div>
        );
    }

    renderAiAnalysisMoreComing() {
        return (
            <div className="my-2 flex flex-row items-center justify-center">
                {this.renderSpinner("animate-spin rounded-full h-4 w-4 border-2 border-gray-200 mr-2")}
                <span className="text-sm text-gray-500">{this.i18n("aiAnalysisMoreComing")}</span>
            </div>
        );
    }

    renderAiAnalysisNotice(message, closable) {
        return (
            <div className="my-2 p-3 rounded bg-gray-100 flex flex-row items-start">
                <div className="flex-1 text-base text-gray-700">{message}</div>
                {closable && (
                    <button
                        type="button"
                        onClick={this.onAiAnalysisNoticeClose}
                        className="ml-2 p-2 text-xl leading-none text-gray-500 hover:text-gray-800 focus:outline-none">
                        ×
                    </button>
                )}
            </div>
        );
    }

    renderVideoMenu() {
        if (this.transcriptionId == null) {
            return null;
        }
        return (
            <div ref={this.menuRef} className="relative ml-2 flex-shrink-0">
                <button
                    type="button"
                    onClick={this.onMenuToggle}
                    aria-label={this.i18n("videoMenu")}
                    className="p-2 text-xl leading-none text-gray-500 hover:text-gray-800 focus:outline-none">
                    ···
                </button>
                {this.state.menuOpen && (
                    <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded shadow-md z-10">
                        <a
                            href={`/qarauapi/v1/export/${this.transcriptionId}`}
                            onClick={this.closeMenu}
                            className="block px-4 py-3 text-base text-gray-700 hover:bg-gray-100 whitespace-nowrap">
                            {this.i18n("downloadSubtitles")}
                        </a>
                    </div>
                )}
            </div>
        );
    }

    renderToggler(on, handler, labelKey) {
        return (
            <div
                className="mx-2 py-2 rounded flex flex-row items-center cursor-pointer select-none"
                onClick={handler}>
                <img
                    className="mx-2 h-6"
                    src={on ? "/toggle_on.svg" : "/toggle_off.svg"}
                />
                <span className="text-base">{this.i18n(labelKey)}</span>
            </div>
        );
    }

    renderBreakdown() {
        if (!this.state.grammar) {
            return null;
        }
        const breakdown = this.state.breakdown || [];
        // Only show a breakdown that belongs to the cue currently on screen, so a
        // stale one never lingers under a cue it doesn't describe.
        if (breakdown.length === 0 || this.state.breakdownCueIndex !== this.state.currentCueIndex) {
            return this.state.analyzing
                ? (<div className="m-4 text-center text-base text-gray-500">{this.i18n("analyzing")}</div>)
                : null;
        }

        const positionMs = this.state.positionMs || 0;
        const activePartIndex = computeActivePartIndex(positionMs, breakdown);
        // "relative" makes the scroll container the offsetParent of the parts, so
        // their offsetLeft is measured from its content box, the same coordinate
        // space as scrollLeft (see syncBreakdownScroll())
        return (
            <div ref={this.breakdownRef} className="relative my-4 overflow-x-auto">
                <div className="flex flex-row flex-nowrap items-start">
                    {breakdown.map((part, i) => (
                        // Flex children shrink by default, which would squeeze the cards
                        // instead of overflowing the row - pin each one's width.
                        <div key={i} className="flex-shrink-0">
                            <AnalyzedPartView
                                analyzedPart={part}
                                grammar={true}
                                translations={this.state.translations}
                                highlight={i === activePartIndex}
                                hintCallback={null}
                                verbFormsCallback={null}
                                lang={this.props.lang}
                            />
                        </div>
                    ))}
                </div>
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
        } else if (appMode == APP_MODE_PLAYLIST) {
            return this.renderPlaylistView();
        } else if (appMode == APP_MODE_ERROR) {
            return this.renderErrorForm();
        } else {
            return <div>Not implemented</div>;
        }
    }

    // The title itself already links to the prompt page; this puts the way back
    // to it in plain sight while a video is open. On the prompt page it would
    // lead nowhere new, so it is left out there.
    renderNewVideoButton() {
        if (this.state.appMode === APP_MODE_PROMPT) {
            return null;
        }
        return (
            <a
                href={buildWatchUrl([], this.props.lang)}
                className="ml-3 flex-shrink-0 flex flex-row items-center whitespace-nowrap bg-blue-500 hover:bg-blue-700 text-white text-sm sm:text-base font-medium py-2 px-3 rounded focus:outline-none">
                <img className="h-5 mr-1" src="/create.svg" alt="" />
                {this.i18n("newVideo")}
            </a>
        );
    }

    render() {
        const titleClass = this.state.appMode === APP_MODE_WATCH
            ? "text-center text-base italic text-gray-600"
            : "text-center text-xl italic text-gray-600";
        return (
            <div className="flex flex-col w-full">
                <div className="flex flex-row items-center justify-center">
                    <h1 className={titleClass}>
                        <a href={buildWatchUrl([], this.props.lang)}>
                            {this.i18n("titleSubtitlesForYt")}
                        </a>
                    </h1>
                    {this.renderNewVideoButton()}
                </div>
                {this.routeMode(this.state.appMode)}
            </div>
        );
    }
}

export default WatchApp;