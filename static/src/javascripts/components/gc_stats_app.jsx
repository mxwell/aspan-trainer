import React from "react";
import { i18n } from "../lib/i18n";
import { gcGetDownloads, gcGetRankings, gcGetStats } from "../lib/gc_api";
import { ellipsize } from "../lib/gc";

/**
 * props:
 * - lang
 */
class GcStatsApp extends React.Component {
    constructor(props) {
        super(props);

        this.handleGetStatsResponse = this.handleGetStatsResponse.bind(this);
        this.handleGetStatsError = this.handleGetStatsError.bind(this);
        this.handleGetRankingsResponse = this.handleGetRankingsResponse.bind(this);
        this.handleGetRankingsError = this.handleGetRankingsError.bind(this);
        this.handleGetDownloadsResponse = this.handleGetDownloadsResponse.bind(this);
        this.handleGetDownloadsError = this.handleGetDownloadsError.bind(this);

        this.state = this.defaultState();
        this.startGetStats();
        this.startGetRankings();
        this.startGetDownloads();
    }

    makeState() {
        return {
            loading: true,
            error: false,
            stats: null,
            contribLoading: true,
            contribError: false,
            alltime: null,
            week: null,
            downloadsLoading: true,
            downloadsError: false,
            downloads: null,
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

    async handleGetStatsResponse(context, responseJsonPromise) {
        const response = await responseJsonPromise;
        const message = response.message;
        if (message != "ok") {
            console.log(`handleGetStatsResponse: error message: ${message}`);
            this.putToErrorState();
            return;
        }
        const stats = response.stats;
        if (stats == null) {
            console.log("handleGetStatsResponse: null feed");
            this.putToErrorState();
            return;
        }
        console.log(`Loaded stats: en ${stats.en_count}, ru ${stats.ru_count}`);
        const loading = false;
        this.setState({ loading, stats });
    }

    async handleGetStatsError(context, responseTextPromise) {
        let responseText = await responseTextPromise;
        console.log(`handleGetStatsError: ${responseText}`);
        this.putToErrorState();
    }

    startGetStats() {
        gcGetStats(
            this.handleGetStatsResponse,
            this.handleGetStatsError,
            {},
        );
    }

    putToContribErrorState() {
        this.setState({
            contribLoading: false,
            contribError: true,
        });
    }

    async handleGetRankingsResponse(context, responseJsonPromise) {
        const response = await responseJsonPromise;
        const message = response.message;
        if (message != "ok") {
            console.log(`handleGetRankingsResponse: error message: ${message}`);
            this.putToContribErrorState();
            return;
        }
        const alltime = response.alltime;
        const week = response.week;
        if (alltime == null || week == null) {
            console.log("handleGetRankingsResponse: data missing");
            this.putToContribErrorState();
            return;
        }
        console.log(`Loaded contribs: alltime ${alltime.length}, week ${week.length}`);
        const contribLoading = false;
        this.setState({ contribLoading, alltime, week });
    }

    async handleGetRankingsError(context, responseTextPromise) {
        let responseText = await responseTextPromise;
        console.log(`handleGetRankingsError: ${responseText}`);
        this.putToContribErrorState();
    }

    startGetRankings() {
        gcGetRankings(
            this.handleGetRankingsResponse,
            this.handleGetRankingsError,
            {},
        );
    }

    putToDownloadsErrorState() {
        this.setState({
            downloadsLoading: false,
            downloadsError: true,
        });
    }

    async handleGetDownloadsResponse(context, responseJsonPromise) {
        const response = await responseJsonPromise;
        const message = response.message;
        if (message != "ok") {
            console.log(`handleGetDownloadsResponse: error message: ${message}`);
            this.putToDownloadsErrorState();
            return;
        }
        const downloads = response.downloads;
        if (downloads == null) {
            console.log("handleGetDownloadsResponse: null downloads");
            this.putToDownloadsErrorState();
            return;
        }
        console.log(`Loaded ${downloads.length} downloads`);
        const downloadsLoading = false;
        this.setState({ downloadsLoading, downloads });
    }

    async handleGetDownloadsError(context, responseTextPromise) {
        let responseText = await responseTextPromise;
        console.log(`handleGetDownloadsError: ${responseText}`);
        this.putToDownloadsErrorState();
    }

    startGetDownloads() {
        gcGetDownloads(
            this.handleGetDownloadsResponse,
            this.handleGetDownloadsError,
            {},
        );
    }

    renderError() {
        return (
            <p className="text-red-600 text-center">{this.i18n("service_error")}</p>
        );
    }

    renderStats() {
        if (this.state.error) {
            return this.renderError();
        }
        if (this.state.loading) {
            return (
                <p className="text-center">{this.i18n("loadingStats")}</p>
            );
        }
        const stats = this.state.stats;
        const enCount = stats.en_count;
        const ruCount = stats.ru_count;
        if (!enCount || !ruCount) {
            return (
                <p className="text-center">{this.i18n("noStatsData")}</p>
            );
        }
        return (
            <div className="flex flex-col m-4">
                <div className="">
                    {this.i18n("statsEnTranslations")}:&nbsp;
                    <strong>{enCount}</strong>
                </div>
                <div className="">
                    {this.i18n("statsRuTranslations")}:&nbsp;
                    <strong>{ruCount}</strong>
                </div>
            </div>
        );
    }

    renderContribTable(titleKey, contributors) {
        if (contributors.length == 0) {
            return null;
        }
        let rows = [];
        for (const i in contributors) {
            const c = contributors[i];
            rows.push(
                <tr key={rows.length}>
                    <td className="p-2 border-2">{Number(i) + 1}</td>
                    <td className="p-2 border-2">{ellipsize(c.name, 16)}</td>
                    <td className="p-2 border-2">{c.contribs}</td>
                    <td className="p-2 border-2">{c.translations}</td>
                    <td className="p-2 border-2">{c.approves}</td>
                    <td className="p-2 border-2">{c.disapproves}</td>
                </tr>
            );
        }
        return (
            <div>
                <h3 className="my-2 text-center text-2xl italic text-gray-600">
                    {this.i18n(titleKey)}
                </h3>
                <table className="text-center m-4">
                    <thead>
                        <tr className="bg-blue-500 text-white">
                            <th className="p-2 border-2">#</th>
                            <th className="p-2 border-2">{this.i18n("columnName")}</th>
                            <th className="p-2 border-2">{this.i18n("columnContrib")}↓</th>
                            <th className="p-2 border-2">
                                <img className="gc_menu_icon" src="/create.svg" alt="translations"/>
                            </th>
                            <th className="p-2 border-2">
                                <img className="gc_menu_icon" src="/thumb_up.svg" alt="approves"/>
                            </th>
                            <th className="p-2 border-2">
                                <img className="gc_menu_icon" src="/thumb_down.svg" alt="disapproves"/>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows}
                    </tbody>
                </table>
            </div>
        );
    }

    renderTopContributors() {
        if (this.state.contribError) {
            return this.renderError();
        }
        if (this.state.contribLoading) {
            return (
                <p className="text-center">{this.i18n("loadingTopContributors")}</p>
            );
        }
        return (
            <div>
                {this.renderContribTable("titleAlltime", this.state.alltime)}
                {this.renderContribTable("titleWeek", this.state.week)}
            </div>
        );
    }

    renderDownloads() {
        if (this.state.downloadsError) {
            return this.renderError();
        }
        if (this.state.downloadsLoading) {
            return (
                <p className="text-center">{this.i18n("loadingDownloads")}</p>
            );
        }
        const downloads = this.state.downloads;
        return (
            <table className="text-center m-4">
                <thead>
                    <tr>
                        <th className="p-2 border-2">{this.i18n("columnDate")}</th>
                        <th className="p-2 border-2">{this.i18n("statsRuTranslations")}</th>
                        <th className="p-2 border-2">{this.i18n("statsEnTranslations")}</th>
                        <th className="p-2 border-2"></th>
                    </tr>
                </thead>
                <tbody>
                    {downloads.map((item, index) => (
                        <tr key={index}>
                            <td className="p-2 border-2">{item.id}</td>
                            <td className="p-2 border-2">{item.kkru}</td>
                            <td className="p-2 border-2">{item.kken}</td>
                            <td className="p-2 border-2">
                                <a href={item.url} className="underline text-red-400">{this.i18n("columnLink")}</a>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    }

    render() {
        return (
            <div>
                <h1 className="my-4 text-center text-4xl italic text-gray-600">
                    {this.i18n("titleData")}
                </h1>
                <h2 className="mt-10 text-center text-3xl text-gray-500">
                    {this.i18n("titleStats")}
                </h2>
                <div className="flex flex-row justify-center">
                    <div>
                        {this.renderStats()}
                    </div>
                </div>
                <h2 className="mt-10 text-center text-3xl text-gray-500">
                    {this.i18n("titleTopContributors")}
                </h2>
                <div className="flex flex-row justify-center">
                    <div>
                        {this.renderTopContributors()}
                    </div>
                </div>
                <h2 className="mt-10 text-center text-3xl text-gray-500">
                    {this.i18n("titleDownloads")}
                </h2>
                <div className="flex flex-row justify-center">
                    <div>
                        {this.renderDownloads()}
                    </div>
                </div>
            </div>
        );
    }
}

export default GcStatsApp;