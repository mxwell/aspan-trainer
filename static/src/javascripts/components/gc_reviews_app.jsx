import React from "react";
import { i18n } from "../lib/i18n";
import { gcAddReviewVote, gcGetReviews } from "../lib/gc_api";
import { unixEpochToString } from "../lib/datetime";
import { renderComment } from "./gc_common";
import { buildGcReviewsUrl, parseParams } from "../lib/url";
import { COMMON_TRANS_DIRECTIONS, COMMON_TRANS_DIRECTION_BY_KEY } from "../lib/gc";

/**
 * props:
 * - lang
 */
class GcReviewsApp extends React.Component {
    constructor(props) {
        super(props);

        this.handleGetReviewsResponse = this.handleGetReviewsResponse.bind(this);
        this.handleGetReviewsError = this.handleGetReviewsError.bind(this);
        this.handleAddReviewVoteResponse = this.handleAddReviewVoteResponse.bind(this);
        this.handleAddReviewVoteError = this.handleAddReviewVoteError.bind(this);

        const state = this.readUrlState() || this.defaultState();
        this.state = state;
        this.startGetReviews(state.direction);
    }

    makeState(direction) {
        return {
            direction: direction,
            loading: true,
            voting: false,
            error: false,
            reviews: null,
        };
    }

    defaultState() {
        return this.makeState(null);
    }

    readUrlState() {
        const params = parseParams();
        const dirKey = params.dir;
        if (dirKey == null) {
            return null;
        }
        const direction = COMMON_TRANS_DIRECTION_BY_KEY[dirKey];
        if (direction == null) {
            console.log(`readUrlState: invalid direction ${dirKey}`);
            return null;
        }
        return this.makeState(direction);
    }

    i18n(key) {
        return i18n(key, this.props.lang);
    }

    putToErrorState() {
        this.setState({
            loading: false,
            voting: false,
            error: true,
        });
    }

    async handleGetReviewsResponse(context, responseJsonPromise) {
        const response = await responseJsonPromise;
        const message = response.message;
        if (message != "ok") {
            console.log(`handleGetReviewsResponse: error message: ${message}`);
            this.putToErrorState();
            return;
        }
        const reviews = response.reviews;
        if (reviews == null) {
            console.log("handleGetReviewsResponse: null reviews");
            this.putToErrorState();
            return;
        }
        console.log(`Loaded ${reviews.length} reviews(s)`);
        const loading = false;
        this.setState({ loading, reviews });
    }

    async handleGetReviewsError(context, responseTextPromise) {
        let responseText = await responseTextPromise;
        console.log(`handleGetReviewsError: ${responseText}`);
        this.putToErrorState();
    }

    startGetReviews(direction) {
        gcGetReviews(
            direction,
            this.handleGetReviewsResponse,
            this.handleGetReviewsError,
            {},
        );
    }

    async handleAddReviewVoteResponse(context, responseJsonPromise) {
        const response = await responseJsonPromise;
        const message = response.message;
        if (message != "ok") {
            console.log(`handleAddReviewVoteResponse: error message: ${message}`);
            if (message != "duplicate") {
                this.putToErrorState();
            }
            return;
        }
        const approves = response.approves;
        const disapproves = response.disapproves;
        if (approves == null || disapproves == null) {
            console.log("handleAddReviewVoteResponse: null approves or disapproves");
            this.putToErrorState();
            return;
        }
        const reviewId = context.reviewId;
        if (reviewId == null) {
            console.log("handleAddReviewVoteResponse: null reviewId in context");
            this.putToErrorState();
            return;
        }
        console.log(`Updated for review ${reviewId}: ${approves} approves, ${disapproves} disapproves`);
        const voting = false;
        let reviews = this.state.reviews;
        for (let review of reviews) {
            if (review.review_id == reviewId) {
                review.approves = approves;
                review.disapproves = disapproves;
                break;
            }
        }
        this.setState({ voting, reviews });
    }

    async handleAddReviewVoteError(context, responseTextPromise) {
        let responseText = await responseTextPromise;
        console.log(`handleAddReviewVoteError: ${responseText}, reviewId ${context.reviewId}`);
        try {
            const response = JSON.parse(responseText);
            if (response.message == "duplicate") {
                const voting = false;
                this.setState({ voting });
                return;
            }
        } catch (e) {
            console.log("handleAddReviewVoteError: failed to parse as JSON");
        }
        this.putToErrorState();
    }

    handleVoteClick(event, reviewId, vote) {
        event.preventDefault();
        console.log(`Vote clicked: ${reviewId}, ${vote}`);
        if (this.state.voting) {
            console.log(`Ignoring vote click due to voting in progress`);
            return;
        }
        const voting = true;
        this.setState({ voting });
        gcAddReviewVote(
            reviewId,
            vote,
            this.handleAddReviewVoteResponse,
            this.handleAddReviewVoteError,
            { reviewId },
        );
    }

    renderDirectionLink(titleKey, url) {
        if (url == null) {
            return (
                <span className="w-1/3 my-4 text-xl text-gray-600 text-center" key={titleKey}>{this.i18n(titleKey)}</span>
            );
        } else {
            return (
                <a href={url} className="w-1/3 my-4 text-xl text-green-400 text-center underline" key={titleKey}>{this.i18n(titleKey)}</a>
            );
        }
    }

    renderDirNavigation() {
        const direction = this.state.direction;
        const links = [
            this.renderDirectionLink("allReviews", direction != null ? buildGcReviewsUrl(null) : null)
        ];
        for (let transDirection of COMMON_TRANS_DIRECTIONS) {
            const matches = (
                direction != null
                && transDirection.src == direction.src
                && transDirection.dst == direction.dst
            );
            const url = matches ? null : buildGcReviewsUrl(transDirection.toKey());
            links.push(this.renderDirectionLink(transDirection.toKey(), url));
        }
        return (
            <div className="flex flex-row justify-between">
                {links}
            </div>
        );
    }

    renderPos(pos, excVerb) {
        if (pos) {
            if (excVerb > 0) {
                return (<span className="text-blue-500 text-xs italic pl-2">
                    &nbsp;{pos}, {this.i18n("feVerb")}
                </span>);
            }
            return (<span className="text-blue-500 text-xs italic pl-2">
                &nbsp;{pos}
            </span>);
        }
        return null;
    }

    renderReviews() {
        if (this.state.error) {
            return (
                <p className="text-red-600 text-center">{this.i18n("service_error")}</p>
            );
        }
        if (this.state.loading) {
            return (
                <p className="text-center">{this.i18n("loadingReviews")}</p>
            );
        }
        const reviews = this.state.reviews;
        if (reviews.length == 0) {
            return (
                <p className="text-center">{this.i18n("listIsEmpty")}</p>
            );
        }
        let listItems = [];
        const commentClass = "py-2 px-4 text-gray-700 italic";
        for (let entry of reviews) {
            const approves = (entry.approves > 0 ? String(entry.approves) : "");
            const disapproves = (entry.disapproves > 0 ? String(entry.disapproves) : "");
            listItems.push(
                <li key={listItems.length}
                    className="my-10 p-6 text-gray-700 border-2 bg-gray-100 rounded-2xl">
                    <div className="flex flex-row justify-between">
                        <div className="flex flex-row">
                            <span className="text-sm text-gray-600">
                                {unixEpochToString(entry.created_at)}
                            </span>
                            <strong className="px-2">
                                {entry.name}
                            </strong>
                            <span className="">
                                {this.i18n("userAddedReview")}
                            </span>
                        </div>
                        <span className="">
                            #{entry.review_id}
                        </span>
                    </div>
                    <table className="my-2 w-full">
                        <tbody>
                            <tr className="bg-gray-600 text-white text-center">
                                <th className="w-1/2 py-2">{this.i18n(entry.src_lang)}</th>
                                <th className="w-1/2 py-2 border-l-2">{this.i18n(entry.dst_lang)}</th>
                            </tr>
                            <tr className="border-t-2 text-base">
                                <td className="bg-gray-300 pl-4 py-2">
                                    {entry.src_word}
                                    {this.renderPos(entry.src_pos, entry.src_exc_verb)}
                                    {renderComment(entry.src_comment, commentClass)}
                                </td>
                                <td className="border-l-2 border-white bg-gray-300 pl-4 py-2">
                                    {entry.dst_word}
                                    {this.renderPos(entry.dst_pos, entry.dst_exc_verb)}
                                    {renderComment(entry.dst_comment, commentClass)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <div className="w-full flex flex-row justify-between">
                        <div className="p-2 border-2 rounded">
                            {this.i18n("reference")}: {entry.reference}
                        </div>
                        <div className="flex flex-row">
                            <button
                                type="button"
                                onClick={(event) => this.handleVoteClick(event, entry.review_id, "APPROVE")}
                                className="btn-gradient bg-blue-500 hover:bg-blue-700 mx-2 px-6 py-1 rounded focus:outline-none focus:shadow-outline flex flex-row">
                                <img src="/thumb_up.svg" alt="thumb up" className="h-8" />
                                <span className="pl-2 text-2xl text-white">{approves}</span>
                            </button>
                            <button
                                type="button"
                                onClick={(event) => this.handleVoteClick(event, entry.review_id, "DISAPPROVE")}
                                className="bg-gray-500 hover:bg-gray-700 px-4 py-1 rounded focus:outline-none focus:shadow-outline flex flex-row">
                                <img src="/thumb_down.svg" alt="thumb up" className="h-8" />
                                <span className="pl-2 text-2xl text-white">{disapproves}</span>
                            </button>
                        </div>
                    </div>
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
            <div className="w-full lg:w-1/2">
                <h1 className="my-4 text-center text-4xl italic text-gray-600">
                    {this.i18n("titleReviews")}
                </h1>
                {this.renderDirNavigation()}
                {this.renderReviews()}
            </div>
        );
    }
}

export default GcReviewsApp;