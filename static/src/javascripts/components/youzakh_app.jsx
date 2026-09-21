import React from "react";
import { i18n } from "../lib/i18n";
import { searchTranscriptions, searchInTranscription } from "../lib/requests";
import { Keyboard, backspaceTextInput, insertIntoTextInput } from "./keyboard";
import { buildYouzakhUrl } from "../lib/url";
import {
    computeDisplayedCue, computeActiveWordIndex,
    computeSeekTargetMs, computeNextTickDelayMs,
} from "../lib/subtitles";
import { SubtitleWindow } from "../lib/subtitle_window";
import { VIDEO_UNSTARTED, VIDEO_PLAYING, VIDEO_CUED } from "../lib/yt_player";
import { SubtitleCue } from "./subtitle_cue";
import { Spinner } from "./spinner";

const MODE_SEARCH_FORM = 1;
const MODE_PLAYER = 2;

const MAX_QUERY_LENGTH = 256;

// parseParams() in lib/url splits on "=" and decodes with decodeURI, which
// mangles a query carrying "&" or "=".
function parseQueryParam() {
    try {
        const value = new URLSearchParams(window.location.search).get("q");
        if (value == null) {
            return "";
        }
        return value.trim().substring(0, MAX_QUERY_LENGTH);
    } catch (e) {
        return "";
    }
}

class YouzakhApp extends React.Component {
    constructor(props) {
        super(props);

        this.onInputChange = this.onInputChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.onKeyboardClick = this.onKeyboardClick.bind(this);
        this.onInsert = this.onInsert.bind(this);
        this.onBackspace = this.onBackspace.bind(this);
        this.onPopState = this.onPopState.bind(this);
        this.onNewSearchClick = this.onNewSearchClick.bind(this);
        this.handleSearchResponse = this.handleSearchResponse.bind(this);
        this.handleSearchError = this.handleSearchError.bind(this);
        this.handleMatchesResponse = this.handleMatchesResponse.bind(this);
        this.handleMatchesError = this.handleMatchesError.bind(this);
        this.onPrevVideoClick = this.onPrevVideoClick.bind(this);
        this.onPrevMatchClick = this.onPrevMatchClick.bind(this);
        this.onNextMatchClick = this.onNextMatchClick.bind(this);
        this.onNextVideoClick = this.onNextVideoClick.bind(this);
        this.bootYouTubePlayer = this.bootYouTubePlayer.bind(this);
        this.loadVideo = this.loadVideo.bind(this);
        this.onPlayerReady = this.onPlayerReady.bind(this);
        this.onPlayerStateChange = this.onPlayerStateChange.bind(this);
        this.onPlayerRateChange = this.onPlayerRateChange.bind(this);
        this.tick = this.tick.bind(this);
        this.onSubtitlesUpdate = this.onSubtitlesUpdate.bind(this);
        this.onWordClick = this.onWordClick.bind(this);

        this.inputRef = React.createRef();
        this.player = null;
        this.playerReady = false;
        this.loadedVideoId = null;
        this.startMs = 0;
        this.tickTimer = null;
        this.lastPositionMs = 0;
        this.subtitleWindow = new SubtitleWindow(this.onSubtitlesUpdate);
        // Guards against responses of superseded requests: a second search, or a
        // video switched away from before its matches arrived.
        this.searchGen = 0;
        this.matchesGen = 0;

        this.state = {
            mode: MODE_SEARCH_FORM,
            query: parseQueryParam(),
            submittedQuery: "",
            transcriptions: [],
            videoIndex: 0,
            matchesById: {},
            matchIndex: 0,
            searching: false,
            matchesLoading: false,
            notFound: false,
            error: null,
            keyboard: false,
            subtitles: [],
            subtitlesLoading: false,
            currentCueIndex: -1,
            currentCueUpcoming: false,
            positionMs: 0,
        };
    }

    componentDidMount() {
        window.addEventListener("popstate", this.onPopState);
        const query = this.state.query;
        if (query.length > 0) {
            this.runSearch(query, /* pushUrl */ false);
        }
    }

    componentWillUnmount() {
        window.removeEventListener("popstate", this.onPopState);
        this.teardownPlayer();
        if (window.onYouTubeIframeAPIReady === this.loadVideo) {
            window.onYouTubeIframeAPIReady = null;
        }
    }

    i18n(key) {
        return i18n(key, this.props.lang);
    }

    // Must run before any setState that unmounts <div id="youzakh_player">: the
    // IFrame API replaces that div's content outside React's knowledge, and React
    // removing a child it never rendered throws.
    teardownPlayer() {
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
        this.loadedVideoId = null;
        this.lastPositionMs = 0;
        this.subtitleWindow.reset(null);
    }

    onPopState() {
        const query = parseQueryParam();
        if (query.length === 0) {
            this.resetToForm(/* pushUrl */ false);
            return;
        }
        if (query !== this.state.submittedQuery) {
            this.runSearch(query, /* pushUrl */ false);
        }
    }

    onInputChange(event) {
        this.setState({ query: event.target.value, notFound: false, error: null });
    }

    onKeyboardClick(event) {
        event.preventDefault();
        const keyboard = !this.state.keyboard;
        this.setState({ keyboard });
    }

    updateText(change) {
        this.setState(
            { query: change.newText, notFound: false, error: null },
            () => {
                const input = this.inputRef.current;
                if (input == null) {
                    return;
                }
                input.selectionStart = change.newSelectionStart;
                input.selectionEnd = change.newSelectionStart;
                input.focus();
            }
        );
    }

    onInsert(fragment) {
        const input = this.inputRef.current;
        if (input == null) {
            return;
        }
        this.updateText(insertIntoTextInput(input, fragment));
    }

    onBackspace() {
        const input = this.inputRef.current;
        if (input == null) {
            return;
        }
        this.updateText(backspaceTextInput(input));
    }

    onSubmit(event) {
        if (event != null) {
            event.preventDefault();
        }
        const query = this.state.query.trim();
        if (query.length === 0) {
            return;
        }
        this.runSearch(query, /* pushUrl */ true);
    }

    onNewSearchClick() {
        this.resetToForm(/* pushUrl */ true);
    }

    resetToForm(pushUrl) {
        this.searchGen += 1;
        this.matchesGen += 1;
        this.teardownPlayer();
        if (pushUrl) {
            window.history.pushState(null, "", buildYouzakhUrl([], this.props.lang));
        }
        this.setState({
            mode: MODE_SEARCH_FORM,
            submittedQuery: "",
            transcriptions: [],
            videoIndex: 0,
            matchesById: {},
            matchIndex: 0,
            searching: false,
            matchesLoading: false,
            notFound: false,
            error: null,
            subtitles: [],
            subtitlesLoading: false,
            currentCueIndex: -1,
            currentCueUpcoming: false,
            positionMs: 0,
        });
    }

    runSearch(query, pushUrl) {
        this.searchGen += 1;
        this.matchesGen += 1;
        const token = this.searchGen;
        this.teardownPlayer();
        if (pushUrl) {
            const url = buildYouzakhUrl([`q=${encodeURIComponent(query)}`], this.props.lang);
            window.history.pushState(null, "", url);
        }
        this.setState({
            mode: MODE_SEARCH_FORM,
            query,
            submittedQuery: query,
            transcriptions: [],
            videoIndex: 0,
            matchesById: {},
            matchIndex: 0,
            searching: true,
            matchesLoading: false,
            notFound: false,
            error: null,
            subtitles: [],
            subtitlesLoading: false,
            currentCueIndex: -1,
            currentCueUpcoming: false,
            positionMs: 0,
        });
        searchTranscriptions(query, this.handleSearchResponse, this.handleSearchError, { token });
    }

    async handleSearchResponse(context, responseJsonPromise) {
        const resp = await responseJsonPromise;
        if (context.token !== this.searchGen) {
            console.log("ignore stale search response");
            return;
        }
        const transcriptions = (resp && resp.transcriptions) ? resp.transcriptions : [];
        const first = (resp && resp.first) ? resp.first : [];
        if (transcriptions.length === 0 || first.length === 0) {
            this.setState({ searching: false, notFound: true });
            return;
        }
        const transcription = transcriptions[0];
        let matchesById = {};
        matchesById[transcription.transcription_id] = first;
        this.startMs = first[0].start_ms;
        this.loadedVideoId = transcription.online_video_id;
        this.setState({
            mode: MODE_PLAYER,
            searching: false,
            transcriptions,
            matchesById,
            videoIndex: 0,
            matchIndex: 0,
            subtitlesLoading: true,
        }, () => {
            this.startTranscript(transcription.transcription_id, this.startMs);
            this.bootYouTubePlayer();
        });
    }

    async handleSearchError(context, responseTextPromise) {
        const text = await responseTextPromise;
        console.log(`search error: ${text}`);
        if (context.token !== this.searchGen) {
            return;
        }
        this.setState({ searching: false, error: this.i18n("youzakhSearchFailed") });
    }

    currentTranscription() {
        const transcriptions = this.state.transcriptions;
        const index = this.state.videoIndex;
        if (index < 0 || index >= transcriptions.length) {
            return null;
        }
        return transcriptions[index];
    }

    currentMatches() {
        const transcription = this.currentTranscription();
        if (transcription == null) {
            return [];
        }
        const matches = this.state.matchesById[transcription.transcription_id];
        return matches != null ? matches : [];
    }

    bootYouTubePlayer() {
        if (this.player) {
            return;
        }
        if (this.loadedVideoId == null) {
            console.warn("no online_video_id to play");
            return;
        }
        if (!window.YT || !window.YT.Player) {
            console.log("Creating YT iFrame");
            const tag = document.createElement("script");
            tag.src = "https://www.youtube.com/iframe_api";
            window.onYouTubeIframeAPIReady = this.loadVideo;

            const firstScriptTag = document.getElementsByTagName("script")[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        } else {
            this.loadVideo();
        }
    }

    loadVideo() {
        const videoId = this.loadedVideoId;
        if (videoId == null) {
            return;
        }
        // The `start` cue parameter rather than a seekTo() once ready: its
        // resolution is whole seconds, which is close enough to a sentence start.
        const startSecs = Math.floor(this.startMs / 1000);
        console.log(`Creating YT player for ${videoId} at ${startSecs}s`);
        this.player = new window.YT.Player("youzakh_player", {
            videoId: videoId,
            playerVars: { autoplay: 1, start: startSecs },
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
        // A video switch requested while the player was still booting was dropped
        // by jumpTo(), so it is applied here.
        const videoData = this.player.getVideoData();
        if (this.loadedVideoId != null && videoData && videoData.video_id !== this.loadedVideoId) {
            this.player.loadVideoById({ videoId: this.loadedVideoId, startSeconds: this.startMs / 1000 });
        }
        this.tick();
    }

    onPlayerStateChange(event) {
        this.tick();
    }

    // A speed change invalidates the delay the pending timer was scheduled with
    // (it was computed against the old rate), so re-tick immediately rather than
    // waiting for it to fire late/early.
    onPlayerRateChange(event) {
        this.tick();
    }

    // ===== Subtitles: cues under the matching sentence, following the playhead =====

    // Points the subtitle window at a transcript - or at none, with a null id,
    // while the matches of the next video are still on their way - and loads the
    // cues around where playback is about to start.
    startTranscript(transcriptionId, startMs) {
        this.lastPositionMs = startMs;
        this.subtitleWindow.reset(transcriptionId);
        this.setState({
            subtitles: [],
            // The jump below starts a load right away; saying so here keeps the
            // empty window from rendering as "no subtitles" in between.
            subtitlesLoading: transcriptionId != null,
            currentCueIndex: -1,
            currentCueUpcoming: false,
            positionMs: startMs,
        });
        if (transcriptionId != null) {
            this.subtitleWindow.jumpTo(startMs);
        }
    }

    // The subtitle window started or finished a request, or delivered cues.
    onSubtitlesUpdate(update) {
        if (update.items == null) {
            this.setState({ subtitlesLoading: update.loading });
            return;
        }
        const subtitles = update.items;
        const cue = computeDisplayedCue(this.lastPositionMs, subtitles);
        this.setState({
            subtitles,
            subtitlesLoading: false,
            currentCueIndex: cue.index,
            currentCueUpcoming: cue.upcoming,
            positionMs: this.lastPositionMs,
        });
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
        this.subtitleWindow.syncTo(positionMs);
        if (this.player.getPlayerState() === VIDEO_PLAYING) {
            const delay = computeNextTickDelayMs(
                positionMs, this.player.getPlaybackRate(), this.state.subtitles || [], index, upcoming, activeWordIndex
            );
            this.tickTimer = setTimeout(() => this.tick(), delay);
        }
    }

    // The playhead as the rest of the app should see it. The `start` cue
    // parameter positions the player, but one that hasn't begun playing can
    // still report 0 for a moment; taking that at face value would load the cues
    // of the video's opening instead of the ones around the match. Inert once
    // the player leaves the unstarted/cued states.
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

    updateCurrentCue(positionMs) {
        this.lastPositionMs = positionMs;
        const subtitles = this.state.subtitles || [];
        const { index, upcoming } = computeDisplayedCue(positionMs, subtitles);
        const activeWordIndex = (!upcoming && index !== -1)
            ? computeActiveWordIndex(positionMs, subtitles[index].words)
            : -1;
        this.setState({ currentCueIndex: index, currentCueUpcoming: upcoming, positionMs });
        return { index, upcoming, activeWordIndex };
    }

    // Jumps playback to a word of the cue on screen, leaving the player playing
    // or paused as it was. The matching sentence above stays put: it is where
    // the search landed, not where playback is.
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
        // Falls back to 0 when the preceding cue isn't loaded (right after a
        // jump) or doesn't exist - then the lead is capped by the video start.
        const prevBoundaryMs = cueIndex > 0 ? subtitles[cueIndex - 1].end_ms : 0;
        const targetMs = computeSeekTargetMs(words, wordIndex, prevBoundaryMs);
        this.player.seekTo(targetMs / 1000, true);
        // getCurrentTime() can still report the pre-seek position for a moment,
        // so drive the UI from the target we asked for; the tick corrects drift.
        this.updateCurrentCue(targetMs);
        this.tick();
    }

    // Moves the playhead to a match, loading another video first when the jump
    // crosses a transcription boundary.
    jumpTo(startMs, videoId) {
        this.startMs = startMs;
        const switching = videoId != null && videoId !== this.loadedVideoId;
        if (videoId != null) {
            this.loadedVideoId = videoId;
        }
        if (!this.player || !this.playerReady) {
            return;
        }
        if (switching) {
            this.player.loadVideoById({ videoId: videoId, startSeconds: startMs / 1000 });
            return;
        }
        this.player.seekTo(startMs / 1000, true);
        this.player.playVideo();
        // getCurrentTime() can still report the pre-seek position for a moment,
        // so drive the UI from the target we asked for; the tick corrects drift.
        this.updateCurrentCue(startMs);
        this.tick();
    }

    // A video without matches is still worth showing, but there is nothing to
    // play towards, so it is cued rather than started.
    cueVideo(videoId) {
        this.startMs = 0;
        this.loadedVideoId = videoId;
        if (!this.player || !this.playerReady) {
            return;
        }
        this.player.cueVideoById({ videoId: videoId });
    }

    onPrevMatchClick() {
        this.moveMatch(-1);
    }

    onNextMatchClick() {
        this.moveMatch(1);
    }

    moveMatch(delta) {
        if (this.state.matchesLoading) {
            return;
        }
        const matches = this.currentMatches();
        const matchIndex = this.state.matchIndex + delta;
        if (matchIndex < 0 || matchIndex >= matches.length) {
            return;
        }
        this.setState({ matchIndex });
        this.jumpTo(matches[matchIndex].start_ms, null);
    }

    onPrevVideoClick() {
        this.moveVideo(-1);
    }

    onNextVideoClick() {
        this.moveVideo(1);
    }

    moveVideo(delta) {
        if (this.state.matchesLoading) {
            return;
        }
        const videoIndex = this.state.videoIndex + delta;
        const transcriptions = this.state.transcriptions;
        if (videoIndex < 0 || videoIndex >= transcriptions.length) {
            return;
        }
        const transcription = transcriptions[videoIndex];
        const cached = this.state.matchesById[transcription.transcription_id];
        if (cached != null) {
            this.setState({ videoIndex, matchIndex: 0, error: null });
            if (cached.length > 0) {
                this.jumpTo(cached[0].start_ms, transcription.online_video_id);
            } else {
                this.cueVideo(transcription.online_video_id);
            }
            this.startTranscript(transcription.transcription_id, this.startMs);
            return;
        }

        this.matchesGen += 1;
        const token = this.matchesGen;
        // The previous video keeps playing otherwise, while the sentence below it
        // already belongs to another one.
        if (this.player && this.playerReady) {
            this.player.pauseVideo();
        }
        this.setState({ videoIndex, matchIndex: 0, matchesLoading: true, error: null });
        // The cues of the video left behind would otherwise stay under a
        // sentence that no longer belongs to them.
        this.startTranscript(null, 0);
        searchInTranscription(
            transcription.transcription_id,
            this.state.submittedQuery,
            this.handleMatchesResponse,
            this.handleMatchesError,
            {
                token,
                transcriptionId: transcription.transcription_id,
                videoId: transcription.online_video_id,
            },
        );
    }

    async handleMatchesResponse(context, responseJsonPromise) {
        const resp = await responseJsonPromise;
        if (context.token !== this.matchesGen) {
            console.log("ignore stale transcription search response");
            return;
        }
        const results = (resp && resp.results) ? resp.results : [];
        let matchesById = Object.assign({}, this.state.matchesById);
        matchesById[context.transcriptionId] = results;
        this.setState({ matchesById, matchIndex: 0, matchesLoading: false, subtitlesLoading: true });
        if (results.length > 0) {
            this.jumpTo(results[0].start_ms, context.videoId);
        } else {
            this.cueVideo(context.videoId);
        }
        this.startTranscript(context.transcriptionId, this.startMs);
    }

    async handleMatchesError(context, responseTextPromise) {
        const text = await responseTextPromise;
        console.log(`transcription search error: ${text}`);
        if (context.token !== this.matchesGen) {
            return;
        }
        // Left uncached, so switching back to this video retries.
        this.setState({ matchesLoading: false, error: this.i18n("youzakhSearchFailed") });
    }

    renderSpinner(className) {
        return <Spinner className={className} />;
    }

    renderKeyboard() {
        if (!this.state.keyboard) {
            return null;
        }
        return (
            <div className="mx-6 py-2 bg-gray-200">
                <Keyboard
                    insertCallback={this.onInsert}
                    backspaceCallback={this.onBackspace}
                    enterCallback={this.onSubmit}
                    lat={false} />
            </div>
        );
    }

    renderSearchForm() {
        const keyboardClass = (
            this.state.keyboard
            ? "ml-2 flex-shrink-0 px-2 bg-blue-600 hover:bg-blue-700 rounded focus:outline-none"
            : "ml-2 flex-shrink-0 px-2 bg-gray-400 hover:bg-gray-600 rounded focus:outline-none"
        );
        const searching = this.state.searching;
        return (
            <div>
                <form onSubmit={this.onSubmit} className="px-3 py-2 flex flex-col">
                    <div className="flex flex-row">
                        <input
                            ref={this.inputRef}
                            type="text"
                            size="44"
                            maxLength={MAX_QUERY_LENGTH}
                            value={this.state.query}
                            placeholder={this.i18n("youzakhHintQuery")}
                            className="shadow appearance-none border rounded flex-1 min-w-0 p-3 text-base lg:text-lg text-gray-700 focus:outline-none focus:shadow-outline"
                            onChange={this.onInputChange}
                            autoFocus />
                        <button
                            type="button"
                            onClick={this.onKeyboardClick}
                            className={keyboardClass}>
                            <img src="/keyboard.svg" alt="keyboard show or hide" className="h-10" />
                        </button>
                        <button
                            type="submit"
                            disabled={searching}
                            className={`ml-2 flex-shrink-0 flex flex-row items-center ${searching ? "bg-gray-300 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-700"} text-white text-base lg:text-lg font-bold px-4 rounded focus:outline-none focus:shadow-outline`}>
                            <span className="hidden sm:inline">{this.i18n("youzakhSearchButton")}</span>
                            <img src="/search.svg" alt="search" className="h-8 sm:hidden" />
                        </button>
                    </div>
                </form>
                {this.renderKeyboard()}
                {this.state.searching && (
                    <div className="flex flex-row justify-center py-4">
                        {this.renderSpinner("animate-spin rounded-full h-6 w-6 border-4 border-gray-200")}
                    </div>
                )}
                {this.state.notFound && (
                    <div className="px-3 py-2 text-base lg:text-lg text-gray-700">
                        {this.i18n("youzakhNothingFound")}
                    </div>
                )}
                {this.state.error && (
                    <div className="px-3 py-2 text-base text-red-600">{this.state.error}</div>
                )}
                <div className="mt-6 px-3 max-w-3xl mx-auto text-gray-700 text-base lg:text-lg">
                    {this.i18n("youzakhIntro")}
                </div>
            </div>
        );
    }

    renderNavButton(labelKey, disabled, onClick) {
        const className = disabled
            ? "m-1 flex-1 bg-gray-300 text-white text-sm lg:text-base font-medium py-2 px-2 rounded cursor-not-allowed focus:outline-none"
            : "m-1 flex-1 bg-blue-500 hover:bg-blue-700 text-white text-sm lg:text-base font-medium py-2 px-2 rounded focus:outline-none";
        return (
            <button
                type="button"
                disabled={disabled}
                onClick={onClick}
                className={className}>
                {this.i18n(labelKey)}
            </button>
        );
    }

    renderNavRow() {
        const loading = this.state.matchesLoading;
        const matches = this.currentMatches();
        const videoIndex = this.state.videoIndex;
        const matchIndex = this.state.matchIndex;
        return (
            <div className="flex flex-row justify-between py-2">
                {this.renderNavButton("youzakhPrevVideo", loading || videoIndex <= 0, this.onPrevVideoClick)}
                {this.renderNavButton("youzakhPrevMatch", loading || matchIndex <= 0, this.onPrevMatchClick)}
                {this.renderNavButton("youzakhNextMatch", loading || matchIndex >= matches.length - 1, this.onNextMatchClick)}
                {this.renderNavButton("youzakhNextVideo", loading || videoIndex >= this.state.transcriptions.length - 1, this.onNextVideoClick)}
            </div>
        );
    }

    renderSentence() {
        if (this.state.matchesLoading) {
            return (
                <div className="flex flex-row justify-center py-4">
                    {this.renderSpinner("animate-spin rounded-full h-6 w-6 border-4 border-gray-200")}
                </div>
            );
        }
        if (this.state.error) {
            return <div className="py-2 text-base text-red-600">{this.state.error}</div>;
        }
        const matches = this.currentMatches();
        if (matches.length === 0) {
            return (
                <div className="py-2 text-base lg:text-lg text-gray-500">
                    {this.i18n("youzakhNoMatchesInVideo")}
                </div>
            );
        }
        const match = matches[this.state.matchIndex];
        return (
            <div className="py-2">
                <div className="text-sm text-gray-500">
                    {`${this.i18n("youzakhVideoCounter")} ${this.state.videoIndex + 1}/${this.state.transcriptions.length}`}
                    {" · "}
                    {`${this.i18n("youzakhMatchCounter")} ${this.state.matchIndex + 1}/${matches.length}`}
                </div>
                <div className="mt-1 text-base lg:text-lg text-gray-800">{match.text}</div>
                {this.renderSubtitles()}
            </div>
        );
    }

    // Follows the playhead under the static matching sentence: cues are swapped
    // as playback moves on, and more are loaded when it nears the end of what is
    // in the window.
    renderSubtitles() {
        const subtitles = this.state.subtitles || [];
        const idx = this.state.currentCueIndex;

        if (subtitles.length === 0) {
            const key = this.state.subtitlesLoading ? "isLoading" : "noSubtitles";
            return <SubtitleCue notice={this.i18n(key)} />;
        }
        const inRange = idx != null && idx >= 0 && idx < subtitles.length;
        return (
            <SubtitleCue
                cue={inRange ? subtitles[idx] : null}
                upcoming={!!this.state.currentCueUpcoming}
                positionMs={this.state.positionMs || 0}
                prevCueEndMs={inRange && idx > 0 ? subtitles[idx - 1].end_ms : 0}
                onWordClick={this.onWordClick} />
        );
    }

    renderPlayer() {
        const transcription = this.currentTranscription();
        return (
            <div className="flex flex-col items-center w-full">
                <div className="w-full max-w-3xl px-2">
                    {transcription && (
                        <div className="py-1 text-left">
                            <div className="text-base lg:text-lg font-medium text-gray-800 truncate" title={transcription.video_title}>
                                {transcription.video_title}
                            </div>
                            <div className="text-sm text-gray-500 truncate">{transcription.channel_title}</div>
                        </div>
                    )}
                    <div className="watch-video-box mx-auto">
                        <div id="youzakh_player"></div>
                    </div>
                    {this.renderNavRow()}
                    {this.renderSentence()}
                </div>
            </div>
        );
    }

    renderNewSearchButton() {
        if (this.state.mode !== MODE_PLAYER) {
            return null;
        }
        return (
            <button
                type="button"
                onClick={this.onNewSearchClick}
                className="ml-3 flex-shrink-0 whitespace-nowrap bg-blue-500 hover:bg-blue-700 text-white text-sm sm:text-base font-medium py-2 px-3 rounded focus:outline-none">
                {this.i18n("youzakhNewSearch")}
            </button>
        );
    }

    routeMode(mode) {
        if (mode == MODE_SEARCH_FORM) {
            return this.renderSearchForm();
        } else if (mode == MODE_PLAYER) {
            return this.renderPlayer();
        } else {
            return <div>Not implemented</div>;
        }
    }

    render() {
        const titleClass = this.state.mode === MODE_PLAYER
            ? "text-center text-base italic text-gray-600"
            : "text-center text-xl italic text-gray-600";
        return (
            <div className="flex flex-col w-full">
                <div className="flex flex-row items-center justify-center">
                    <h1 className={titleClass}>
                        <a href={buildYouzakhUrl([], this.props.lang)}>
                            {this.i18n("titleYouzakh")}
                        </a>
                    </h1>
                    {this.renderNewSearchButton()}
                </div>
                {this.routeMode(this.state.mode)}
            </div>
        );
    }
}

export default YouzakhApp;
