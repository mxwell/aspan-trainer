import React from "react";
import { i18n } from "../lib/i18n";
import { gcGetClips } from "../lib/gc_api";


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
        const prevPages = this.state.pages;
        if (prevPages.length != offset) {
            console.log(`handleGetClipsResponse: unexpected pages size: ${prevPages.length} instead of ${offset}`);
            this.setState({
                loading: false,
                error: true,
            });
            return
        }
        const loading = false;
        let pages = prevPages;
        if (clips.length > 0) {
            pages.push(clips);
        }
        const loadedAll = clips < this.props.pageSize;
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

    renderPage() {
        if (this.state.loading) {
            return (<p>{this.i18n("isLoading")}</p>);
        }
        if (this.state.error) {
            return (
                <p className="text-center text-2xl text-red-600">{this.i18n("gotError")}</p>
            );
        }

        const clips = this.state.pages[this.state.page];

        let htmlItems = [];
        for (const clip of clips) {
            htmlItems.push(
                <li className="list-disc list-inside" key={htmlItems.length}>
                    {clip.title}
                </li>
            );
        }
        return (
            <ul>
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