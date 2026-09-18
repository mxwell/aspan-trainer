import React from "react";
import { i18n, topicLabel } from "../lib/i18n";
import { loadTopics, loadVideosOnTopics } from "../lib/requests";
import { MIN_TOPICS, loadSelectedTopics, saveSelectedTopics } from "../lib/topics";
import { Spinner } from "./spinner";
import { VideoGrid } from "./video_grid";

const PHASE_LOADING_TOPICS = 1;
const PHASE_PICKING = 2;
const PHASE_LOADING_VIDEOS = 3;
const PHASE_READY = 4;
const PHASE_ERROR = 5;

// Self-contained tab: the topic choice lives here and in local storage, and the
// only thing it needs from the app around it is where a clicked video goes.
class RecommendationsTab extends React.Component {
    constructor(props) {
        super(props);

        const stored = loadSelectedTopics();
        this.state = {
            // Topics kept from a previous visit skip the picker: the videos
            // request answers with `available_topics` anyway.
            phase: stored.length >= MIN_TOPICS ? PHASE_LOADING_VIDEOS : PHASE_LOADING_TOPICS,
            allTopics: [],
            selected: stored,
            videos: [],
            errorKey: null,
        };

        // Discards a response of a request abandoned by a re-submit.
        this.reqToken = 0;

        this.handleTopicsSuccess = this.handleTopicsSuccess.bind(this);
        this.handleTopicsError = this.handleTopicsError.bind(this);
        this.handleVideosSuccess = this.handleVideosSuccess.bind(this);
        this.handleVideosError = this.handleVideosError.bind(this);
        this.onSubmitClick = this.onSubmitClick.bind(this);
        this.onConfigureClick = this.onConfigureClick.bind(this);
        this.onRetryClick = this.onRetryClick.bind(this);
    }

    componentDidMount() {
        if (this.state.phase === PHASE_LOADING_VIDEOS) {
            this.requestVideos(this.state.selected);
        } else {
            this.requestTopics();
        }
    }

    i18n(key) {
        return i18n(key, this.props.lang);
    }

    requestTopics() {
        const token = ++this.reqToken;
        this.setState({ phase: PHASE_LOADING_TOPICS, errorKey: null });
        loadTopics(this.handleTopicsSuccess, this.handleTopicsError, { token });
    }

    requestVideos(topics) {
        const token = ++this.reqToken;
        this.setState({ phase: PHASE_LOADING_VIDEOS, errorKey: null });
        loadVideosOnTopics(topics, this.handleVideosSuccess, this.handleVideosError, { token, topics });
    }

    async handleTopicsSuccess(context, responseJsonPromise) {
        const resp = await responseJsonPromise;
        if (context.token !== this.reqToken) {
            return;
        }
        const slugs = (resp && resp.slugs) || [];
        if (slugs.length === 0) {
            this.setState({ phase: PHASE_ERROR, errorKey: "topicsLoadError" });
            return;
        }
        this.setState((prevState) => ({
            phase: PHASE_PICKING,
            allTopics: slugs,
            selected: prevState.selected.filter((slug) => slugs.indexOf(slug) >= 0),
        }));
    }

    async handleTopicsError(context, responseTextPromise) {
        const text = await responseTextPromise;
        console.log("topics error:", text);
        if (context.token !== this.reqToken) {
            return;
        }
        this.setState({ phase: PHASE_ERROR, errorKey: "topicsLoadError" });
    }

    async handleVideosSuccess(context, responseJsonPromise) {
        const resp = await responseJsonPromise;
        if (context.token !== this.reqToken) {
            return;
        }
        const available = (resp && resp.available_topics) || [];
        const videos = (resp && resp.videos) || [];
        // A stored topic the backend no longer offers is dropped, which can take
        // the choice below the minimum and back to the picker.
        const selected = available.length > 0
            ? context.topics.filter((slug) => available.indexOf(slug) >= 0)
            : context.topics;
        if (selected.length !== context.topics.length) {
            saveSelectedTopics(selected);
        }
        if (selected.length < MIN_TOPICS) {
            this.setState({ phase: PHASE_PICKING, allTopics: available, selected });
            return;
        }
        this.setState({
            phase: PHASE_READY,
            allTopics: available.length > 0 ? available : selected,
            selected,
            videos,
        });
    }

    async handleVideosError(context, responseTextPromise) {
        const text = await responseTextPromise;
        console.log("videos on topics error:", text);
        if (context.token !== this.reqToken) {
            return;
        }
        this.setState({ phase: PHASE_ERROR, errorKey: "recommendationsLoadError" });
    }

    onTopicClick(slug) {
        this.setState((prevState) => ({
            selected: prevState.selected.indexOf(slug) >= 0
                ? prevState.selected.filter((s) => s !== slug)
                : prevState.selected.concat([slug]),
        }));
    }

    onSubmitClick() {
        const selected = this.state.selected;
        if (selected.length < MIN_TOPICS) {
            return;
        }
        saveSelectedTopics(selected);
        this.requestVideos(selected);
    }

    onConfigureClick() {
        this.setState({ phase: PHASE_PICKING });
    }

    onRetryClick() {
        if (this.state.errorKey === "recommendationsLoadError") {
            this.requestVideos(this.state.selected);
        } else {
            this.requestTopics();
        }
    }

    renderLoading() {
        return (
            <div className="flex justify-center py-4">
                <Spinner className="animate-spin rounded-full h-6 w-6 border-4 border-gray-200" />
            </div>
        );
    }

    renderError() {
        return (
            <div className="mt-6 px-3 text-center">
                <div className="text-red-600">{this.i18n(this.state.errorKey)}</div>
                <button
                    type="button"
                    onClick={this.onRetryClick}
                    className="mt-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-base font-medium py-3 px-4 rounded focus:outline-none">
                    {this.i18n("retryButton")}
                </button>
            </div>
        );
    }

    renderPicker() {
        const selected = this.state.selected;
        return (
            <div className="my-32 px-3 flex flex-col items-center">
                <div className="text-gray-700 text-base lg:text-lg text-center">
                    {this.i18n("pickTopicsPrompt")}
                </div>
                <div className="mt-4 flex flex-row flex-wrap justify-center gap-2">
                    {this.state.allTopics.map((slug) => {
                        const active = selected.indexOf(slug) >= 0;
                        const className = active
                            ? "px-4 py-2 rounded-full text-base font-medium bg-blue-500 text-white focus:outline-none"
                            : "px-4 py-2 rounded-full text-base font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 focus:outline-none";
                        return (
                            <button
                                key={slug}
                                type="button"
                                onClick={() => this.onTopicClick(slug)}
                                className={className}>
                                {topicLabel(slug, this.props.lang)}
                            </button>
                        );
                    })}
                </div>
                <button
                    type="button"
                    onClick={this.onSubmitClick}
                    disabled={selected.length < MIN_TOPICS}
                    className="my-12 bg-blue-500 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-base font-medium py-3 px-6 rounded focus:outline-none">
                    {this.i18n("showRecommendations")}
                </button>
            </div>
        );
    }

    renderSelectedTopics() {
        const configureTitle = this.i18n("configureTopics");
        return (
            <div className="mt-4 px-3 flex flex-row items-center">
                <div className="flex flex-row flex-wrap gap-2">
                    {this.state.selected.map((slug) => (
                        <span
                            key={slug}
                            className="px-4 py-2 rounded-full text-base font-medium bg-gray-100 text-gray-700">
                            {topicLabel(slug, this.props.lang)}
                        </span>
                    ))}
                </div>
                <button
                    type="button"
                    onClick={this.onConfigureClick}
                    title={configureTitle}
                    className="ml-auto flex-shrink-0 p-2 rounded hover:bg-gray-100 focus:outline-none">
                    <img className="h-6 w-6" src="/gear.svg" alt={configureTitle} />
                </button>
            </div>
        );
    }

    renderRecommendations() {
        const videos = this.state.videos;
        const items = videos.map((v) => ({
            id: v.online_video_id,
            title: v.title,
            channelTitle: v.channel_title,
            thumbnailUrl: v.thumbnail_url,
            thumbnailWidth: v.thumbnail_width,
            thumbnailHeight: v.thumbnail_height,
            durationSecs: v.duration_secs,
        }));
        return (
            <div>
                {this.renderSelectedTopics()}
                {items.length === 0
                    ? <div className="mt-6 px-3 text-center text-gray-500">{this.i18n("recommendationsEmpty")}</div>
                    : <VideoGrid items={items} onVideoClick={this.props.onVideoClick} />}
            </div>
        );
    }

    render() {
        switch (this.state.phase) {
            case PHASE_LOADING_TOPICS:
            case PHASE_LOADING_VIDEOS:
                return this.renderLoading();
            case PHASE_PICKING:
                return this.renderPicker();
            case PHASE_ERROR:
                return this.renderError();
            case PHASE_READY:
            default:
                return this.renderRecommendations();
        }
    }
}

export { RecommendationsTab };
