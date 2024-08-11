import React from "react";
import { i18n } from "../lib/i18n";
import { gcGetStats } from "../lib/gc_api";

/**
 * props:
 * - lang
 */
class GcStatsApp extends React.Component {
    constructor(props) {
        super(props);

        this.handleGetStatsResponse = this.handleGetStatsResponse.bind(this);
        this.handleGetStatsError = this.handleGetStatsError.bind(this);

        this.state = this.defaultState();
        this.startGetStats();
    }

    makeState() {
        return {
            loading: true,
            error: false,
            stats: null,
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

    renderStats() {
        if (this.state.error) {
            return (
                <p className="text-red-600 text-center">{this.i18n("service_error")}</p>
            );
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
            <div className="flex flex-col">
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

    render() {
        return (
            <div>
                <h1 className="my-4 text-center text-4xl italic text-gray-600">
                    {this.i18n("titleStats")}
                </h1>
                {this.renderStats()}
            </div>
        );
    }
}

export default GcStatsApp;