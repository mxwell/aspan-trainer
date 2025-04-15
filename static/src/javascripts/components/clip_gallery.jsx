import React from "react";
import { i18n } from "../lib/i18n";
import { gcGetClips } from "../lib/gc_api";
import { buildTextAnalyzerVideoUrl } from "../lib/url";

function printDuration(durationSeconds) {
    const hours = Math.floor(durationSeconds / 3600);
    const minutes = Math.floor((durationSeconds % 3600) / 60);
    const seconds = durationSeconds % 60;

    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');

    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}

/**
 * props:
 * - pageSize: number
 * - lang
 */
export class ClipGallery extends React.Component {
    constructor(props) {
        super(props);

        this.handleGetClipsResponse = this.handleGetClipsResponse.bind(this)
        this.handleGetClipsError = this.handleGetClipsError.bind(this);

        this.state = {
            loading: true,
            error: false,
            page: 0,
            pages: [],
            loadedAll: false,
        };
        this.startLoading(0);
    }

    i18n(key) {
        return i18n(key, this.props.lang);
    }

    async handleGetClipsResponse(context, responseJsonPromise) {
        let response = await responseJsonPromise;
        const offset = context.offset;

        const clips = response.clips;
        const curOffset = this.state.page * this.props.pageSize;
        if (curOffset != offset) {
            console.log(`handleGetClipsResponse: unexpected offset: ${curOffset} instead of ${offset}`);
            this.setState({
                loading: false,
                error: true,
            });
            return
        }
        const loading = false;
        let pages = this.state.pages;
        if (clips.length > 0) {
            pages.push(clips);
        }
        const loadedAll = clips.length < this.props.pageSize;
        this.setState({
            loading,
            pages,
            loadedAll,
        });
    }

    async handleGetClipsError(context, responseTextPromise) {
        let responseText = await responseTextPromise;
        console.log(`Got error from get_clips: ${responseText}, offset ${context.offset}`);
        this.setState({ loading: false, error: true});
    }

    startLoading(page) {
        const offset = page * this.props.pageSize;
        gcGetClips(
            offset,
            this.props.pageSize,
            this.handleGetClipsResponse,
            this.handleGetClipsError,
            { offset }
        );
    }

    onPageChange(diff) {
        const page = this.state.page + diff;
        if (page < 0 || (page >= this.state.pages.length && this.state.loadedAll)) {
            console.log(`New page is out of range: ${page}`);
            return;
        }
        if (this.state.loading) {
            console.log("Already loading, page is not changed");
            return;
        }
        console.log(`changing page to  ${page}`);
        if (0 <= 0 && page < this.state.pages.length) {
            this.setState({ page });
        } else {
            const loading = true;
            this.setState({
                loading,
                page,
            });
            this.startLoading(page);
        }
    }

    renderPagination(page, pages) {
        const prevColor = (
            page > 0
            ? "text-gray-500 cursor-pointer hover:bg-gray-200"
            : "text-gray-300"
        );
        const nextColor = (
            (page + 1 < pages.length || !this.state.loadedAll)
            ? "text-gray-500 cursor-pointer hover:bg-gray-200"
            : "text-gray-300"
        );
        return (
            <div className="flex flex-row text-5xl w-full">
                <div onClick={ (e) => this.onPageChange(-1) }
                    className={`text-right px-10 bg-gradient-to-l from-gray-100 w-1/2 select-none ${prevColor}`}>←</div>
                <div
                    onClick={ (e) => this.onPageChange(1) }
                    className={`px-10 bg-gradient-to-r from-gray-100 w-1/2 select-none ${nextColor}`}>→</div>
            </div>
        );
    }

    renderPage() {
        if (this.state.loading) {
            return (<p>{this.i18n("isLoading")}</p>);
        }
        if (this.state.error) {
            return (
                <p className="text-center text-2xl text-red-600">{this.i18n("gotError")}</p>
            );
        }

        const page = this.state.page;
        const pages = this.state.pages;
        const clips = pages[page];

        let htmlItems = [];
        for (const clip of clips) {
            htmlItems.push(
                <li className="" key={htmlItems.length}>
                    <a className="hover:bg-gray-200"
                        href={buildTextAnalyzerVideoUrl(clip.video_id, this.props.lang)}>
                        <div className="my-4 flex flex-row">
                            <img className="mx-2 h-12 w-12" src="/video24.svg" />
                            <div className="flex flex-col">
                                <div className="text-lg font-bold">{clip.title}</div>
                                <div className="italic text-gray-700">
                                    {clip.author}
                                    &nbsp;•&nbsp;
                                    {clip.published_on}
                                    &nbsp;•&nbsp;
                                    {printDuration(clip.duration_secs)}
                                </div>
                            </div>
                        </div>
                    </a>
                </li>
            );
        }
        return (
            <ul>
                {this.renderPagination(page, pages)}
                {htmlItems}
            </ul>
        );
    }

    render() {
        return (
            <div className="flex flex-col">
                <h3 className="m-4 text-2xl text-gray-700">{this.i18n("videosTitle")}</h3>
                {this.renderPage()}
            </div>
        );
    }
}