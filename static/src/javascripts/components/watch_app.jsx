import React from "react";
import { buildWatchUrl, parseParams } from "../lib/url";
import { i18n } from "../lib/i18n";
import { probeVideo, fetchVideo } from "../lib/requests";

const APP_MODE_PROMPT = 1;
const APP_MODE_PROCESSING = 2;
const APP_MODE_WATCH = 3;
const APP_MODE_ERROR = 4;
const APP_MODE_PREVIEW = 5;
const APP_MODE_PROBING = 6;

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
            this.setState({ appMode: APP_MODE_PREVIEW, probe });
            this.pushVideoUrl(probe.info.online_video_id);
        } else if (processState === "done") {
            this.setState({ appMode: APP_MODE_WATCH, probe });
            this.pushVideoUrl(probe.info.online_video_id);
        } else if (isProcessingState(processState)) {
            this.setState({ appMode: APP_MODE_PROCESSING, probe, process: probe.process, processUpdatedAt: Date.now() });
            this.pushVideoUrl(probe.info.online_video_id);
        } else if (processState === "failed") {
            const errorMessage = (probe.process && probe.process.error_message) || this.i18n("service_error");
            this.setState({ appMode: APP_MODE_ERROR, errorMessage });
        } else {
            this.setState({ appMode: APP_MODE_ERROR, errorMessage: this.i18n("videoNotPreviewable") });
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
        this.setState({ appMode: APP_MODE_ERROR, errorMessage: this.extractErrorMessage(text) });
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
        this.setState({ appMode: APP_MODE_WATCH });
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
                            className="bg-green-500 hover:bg-green-700 text-white text-xl font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
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

    routeMode(appMode) {
        if (appMode == APP_MODE_PROMPT) {
            return this.renderPromptForm();
        } else if (appMode == APP_MODE_PROBING) {
            return this.renderProbingForm();
        } else if (appMode == APP_MODE_PROCESSING) {
            return this.renderProcessingScreen();
        } else if (appMode == APP_MODE_PREVIEW) {
            return this.renderPreviewForm();
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