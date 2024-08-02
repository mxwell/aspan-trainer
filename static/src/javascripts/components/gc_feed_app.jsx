import React from "react";
import { gcGetFeed } from "../lib/gc_api";
import { unixEpochToString } from "../lib/datetime";
import { i18n } from "../lib/i18n";
import { buildGcSearchUrl } from "../lib/url";

/**
 * props:
 * - lang
 */
class GcFeedApp extends React.Component {
    constructor(props) {
        super(props);

        this.handleGetFeedResponse = this.handleGetFeedResponse.bind(this);
        this.handleGetFeedError = this.handleGetFeedError.bind(this);

        this.state = this.defaultState();
        this.startGetFeed();
    }

    makeState() {
        return {
            loading: true,
            error: false,
            feed: null,
        };
    }

    defaultState() {
        return this.makeState();
    }

    i18n(key) {
        return i18n(key, this.props.lang);
    }

    putToErrorState() {
        this.setState({
            loading: false,
            error: true,
        });
    }

    async handleGetFeedResponse(context, responseJsonPromise) {
        const response = await responseJsonPromise;
        const message = response.message;
        if (message != "ok") {
            console.log(`handleGetFeedResponse: error message: ${message}`);
            this.putToErrorState();
            return;
        }
        const feed = response.feed;
        if (feed == null) {
            console.log("handleGetFeedResponse: null feed");
            this.putToErrorState();
            return;
        }
        console.log(`Loading ${feed.length} feed item(s)`);
        const loading = false;
        this.setState({ loading, feed });
    }

    async handleGetFeedError(context, responseTextPromise) {
        let responseText = await responseTextPromise;
        console.log(`handleGetFeedError: ${responseText}`);
        this.putToErrorState();
    }

    startGetFeed() {
        gcGetFeed(
            this.handleGetFeedResponse,
            this.handleGetFeedError,
            {},
        );
    }

    renderFeed() {
        if (this.state.error) {
            return (
                <p className="text-red-600 text-center">{this.i18n("service_error")}</p>
            );
        }
        if (this.state.loading) {
            return (
                <p className="text-center">{this.i18n("loadingUpdates")}</p>
            );
        }
        const feed = this.state.feed;
        if (feed.length == 0) {
            return (
                <p className="text-center">{this.i18n("noUpdatesYet")}</p>
            );
        }
        let listItems = [];
        for (let entry of feed) {
            const dirKey = `${entry.src_lang}${entry.dst_lang}`;
            const dir = this.i18n(dirKey);
            const url = buildGcSearchUrl(entry.src_word, entry.src_lang, entry.dst_lang);
            listItems.push(
                <li key={listItems.length}
                    className="py-1 text-gray-700">
                    <span className="px-2 text-sm text-gray-600">
                        {unixEpochToString(entry.created_at)}
                    </span>
                    <strong className="px-2">
                        {entry.name}
                    </strong>
                    <span className="px-2">
                        {this.i18n("userAddedTranslation")}
                    </span>
                    <strong className="px-2">
                        {dir}
                    </strong>
                    <a href={url}>
                        <span className="px-2 text-blue-600">
                            {entry.src_word}
                        </span>
                        →
                        <span className="px-2 text-green-600">
                            {entry.dst_word}
                        </span>
                    </a>
                </li>
            );
        }
        return (
            <ul>
                {listItems}
            </ul>
        );
    }

    render() {
        return (
            <div>
                <h1 className="my-4 text-center text-4xl italic text-gray-600">
                    {this.i18n("titleRecentUpdates")}
                </h1>
                {this.renderFeed()}
            </div>
        );
    }
}

export default GcFeedApp;