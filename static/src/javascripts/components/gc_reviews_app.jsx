import React from "react";
import { i18n } from "../lib/i18n";
import { gcAddReviewVote, gcDiscardReview, gcGetReviews, gcRetractReviewVote } from "../lib/gc_api";
import { unixEpochToString } from "../lib/datetime";
import { renderComment } from "./gc_common";
import { buildGcReviewsUrl, parseParams } from "../lib/url";
import { COMMON_TRANS_DIRECTIONS, COMMON_TRANS_DIRECTION_BY_KEY } from "../lib/gc";

/**
 * props:
 * - lang
 * - userId
 */
class GcReviewsApp extends React.Component {
    constructor(props) {
        super(props);

        this.handleGetReviewsResponse = this.handleGetReviewsResponse.bind(this);
        this.handleGetReviewsError = this.handleGetReviewsError.bind(this);
        this.handleChangeReviewVoteResponse = this.handleChangeReviewVoteResponse.bind(this);
        this.handleChangeReviewVoteError = this.handleChangeReviewVoteError.bind(this);
        this.handleDiscardReviewResponse = this.handleDiscardReviewResponse.bind(this);
        this.handleDiscardReviewError = this.handleDiscardReviewError.bind(this);

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

    async handleChangeReviewVoteResponse(context, responseJsonPromise) {
        const response = await responseJsonPromise;
        const message = response.message;
        if (message != "ok") {
            console.log(`handleChangeReviewVoteResponse: error message: ${message}`);
            if (message != "duplicate" && message != "not found") {
                this.putToErrorState();
            }
            return;
        }
        const approves = response.approves;
        const disapproves = response.disapproves;
        if (approves == null || disapproves == null) {
            console.log("handleChangeReviewVoteResponse: null approves or disapproves");
            this.putToErrorState();
            return;
        }
        const ownApproves = response.own_approves;
        const ownDisapproves = response.own_disapproves;
        if (ownApproves == null || ownDisapproves == null) {
            console.log("handleChangeReviewVoteResponse: null own approves or disapproves");
            this.putToErrorState();
            return;
        }
        const gone = response.gone;
        if (gone == null) {
            console.log("handleChangeReviewVoteResponse: null gone field");
            this.putToErrorState();
            return;
        }
        const reviewId = context.reviewId;
        if (reviewId == null) {
            console.log("handleChangeReviewVoteResponse: null reviewId in context");
            this.putToErrorState();
            return;
        }
        console.log(`Updated for review ${reviewId}: ${approves} vs ${disapproves}, own ${ownApproves} vs ${ownDisapproves}, gone ${gone}`);
        const voting = false;
        let reviews = this.state.reviews;
        for (let review of reviews) {
            if (review.review_id == reviewId) {
                review.approves = approves;
                review.disapproves = disapproves;
                review.own_approves = ownApproves;
                review.own_disapproves = ownDisapproves;
                review.gone = gone;
                break;
            }
        }
        this.setState({ voting, reviews });
    }

    async handleChangeReviewVoteError(context, responseTextPromise) {
        let responseText = await responseTextPromise;
        console.log(`handleChangeReviewVoteError: ${responseText}, reviewId ${context.reviewId}`);
        try {
            const response = JSON.parse(responseText);
            if (response.message == "duplicate" || response.message == "not found") {
                const voting = false;
                this.setState({ voting });
                return;
            }
        } catch (e) {
            console.log("handleChangeReviewVoteError: failed to parse as JSON");
        }
        this.putToErrorState();
    }

    handleVoteClick(event, reviewId, vote, delta) {
        event.preventDefault();
        console.log(`Vote clicked: ${reviewId}, ${vote}, ${delta}`);
        if (this.state.voting) {
            console.log(`Ignoring vote click due to voting in progress`);
            return;
        }
        if (delta == 0) {
            console.log(`Ignoring click with zero delta`);
            return;
        }
        const voting = true;
        this.setState({ voting });
        if (delta > 0) {
            gcAddReviewVote(
                reviewId,
                vote,
                this.handleChangeReviewVoteResponse,
                this.handleChangeReviewVoteError,
                { reviewId },
            );
        } else {
            gcRetractReviewVote(
                reviewId,
                vote,
                this.handleChangeReviewVoteResponse,
                this.handleChangeReviewVoteError,
                { reviewId },
            );
        }
    }

    async handleDiscardReviewResponse(context, responseJsonPromise) {
        const response = await responseJsonPromise;
        const message = response.message;
        if (message != "ok") {
            console.log(`handleDiscardReviewResponse: error message: ${message}`);
            this.putToErrorState();
            return;
        }
        const reviewId = response.review_id;
        if (reviewId == null) {
            console.log("handleDiscardReviewResponse: null review_id");
            this.putToErrorState();
            return;
        }
        console.log(`Discarded review ${reviewId}`);
        const voting = false;
        let reviews = this.state.reviews;
        for (let review of reviews) {
            if (review.review_id == reviewId) {
                review.gone = true;
                break;
            }
        }
        this.setState({ voting, reviews });
    }

    async handleDiscardReviewError(context, responseTextPromise) {
        let responseText = await responseTextPromise;
        console.log(`handleDiscardReviewError: ${responseText}, reviewId ${context.reviewId}`);
        this.putToErrorState();
    }

    handleDiscardClick(event, reviewId) {
        event.preventDefault();
        console.log(`Delete clicked: ${reviewId}`);
        if (this.state.voting) {
            console.log(`Ignoring delete click due to voting in progress`);
            return;
        }
        const voting = true;
        this.setState({ voting });
        gcDiscardReview(
            reviewId,
            this.handleDiscardReviewResponse,
            this.handleDiscardReviewError,
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

    renderReviewControls(entry) {
        const gone = entry.gone == true;
        if (entry.user_id != this.props.userId) {
            const approves = (entry.approves > 0 ? String(entry.approves) : "");
            let approveClass;
            let approveDelta;
            if (gone) {
                approveClass = "bg-gray-400";
                approveDelta = 0;
            } else if (entry.own_approves > 0) {
                approveClass = "bg-blue-800";
                approveDelta = -1;
            } else {
                approveClass = "btn-gradient bg-blue-500 hover:bg-blue-700";
                approveDelta = 1;
            }
            const disapproves = (entry.disapproves > 0 ? String(entry.disapproves) : "");
            let disapproveClass;
            let disapproveDelta;
            if (gone) {
                disapproveClass = "bg-gray-400";
                disapproveDelta = 0;
            } else if (entry.own_disapproves > 0) {
                disapproveClass = "bg-gray-800";
                disapproveDelta = -1;
            } else {
                disapproveClass = "bg-gray-500 hover:bg-gray-700";
                disapproveDelta = 1;
            }
            return (
                <div className="flex flex-row">
                    <button
                        type="button"
                        onClick={(event) => this.handleVoteClick(event, entry.review_id, "APPROVE", approveDelta)}
                        className={`${approveClass} mx-2 px-6 py-1 rounded focus:outline-none focus:shadow-outline flex flex-row`}>
                        <img src="/thumb_up.svg" alt="thumb up" className="h-8" />
                        <span className="pl-2 text-2xl text-white">{approves}</span>
                    </button>
                    <button
                        type="button"
                        onClick={(event) => this.handleVoteClick(event, entry.review_id, "DISAPPROVE", disapproveDelta)}
                        className={`${disapproveClass} px-4 py-1 rounded focus:outline-none focus:shadow-outline flex flex-row`}>
                        <img src="/thumb_down.svg" alt="thumb down" className="h-8" />
                        <span className="pl-2 text-2xl text-white">{disapproves}</span>
                    </button>
                </div>
            );
        } else {
            const handler = (gone
                ? null
                : ((event) => this.handleDiscardClick(event, entry.review_id))
            );
            const discardClass = (gone
                ? "bg-gray-400"
                : "bg-gray-500 hover:bg-gray-700"
            );
            return (
                <button
                    type="button"
                    onClick={handler}
                    className={`${discardClass} mx-2 px-6 py-1 rounded focus:outline-none focus:shadow-outline`}>
                    <img src="/delete.svg" alt="thumb up" className="h-8" />
                </button>
            );
        }
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
                                    <span className="text-3xl text-indigo-800">{entry.src_word}</span>
                                    {this.renderPos(entry.src_pos, entry.src_exc_verb)}
                                    {renderComment(entry.src_comment, commentClass, 128)}
                                </td>
                                <td className="border-l-2 border-white bg-gray-300 pl-4 py-2">
                                    <span className="text-3xl text-indigo-800">{entry.dst_word}</span>
                                    {this.renderPos(entry.dst_pos, entry.dst_exc_verb)}
                                    {renderComment(entry.dst_comment, commentClass, 128)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <div className="w-full flex flex-row justify-between">
                        <div className="p-2 border-2 rounded">
                            {this.i18n("reference")}: {entry.reference}
                        </div>
                        {this.renderReviewControls(entry)}
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