import React from "react";
import { i18n } from "../lib/i18n";
import { gcGetRankings } from "../lib/gc_api";
import { ellipsize } from "../lib/gc";

class GcContribTop extends React.Component {
    constructor(props) {
        super(props);

        this.handleGetRankingsResponse = this.handleGetRankingsResponse.bind(this);
        this.handleGetRankingsError = this.handleGetRankingsError.bind(this);

        this.state = this.defaultState();
        this.startGetRankings();
    }

    makeState() {
        return {
            alltime: null,
            week: null,
        };
    }

    defaultState() {
        return this.makeState();
    }

    i18n(key) {
        return i18n(key, this.props.lang);
    }

    async handleGetRankingsResponse(context, responseJsonPromise) {
        const response = await responseJsonPromise;
        const message = response.message;
        if (message != "ok") {
            console.log(`handleGetRankingsResponse: error message: ${message}`);
            return;
        }
        const alltime = response.alltime;
        const week = response.week;
        if (alltime == null || week == null) {
            console.log("handleGetRankingsResponse: data missing");
            return;
        }
        console.log(`Loaded contribs: alltime ${alltime.length}, week ${week.length}`);
        this.setState({ alltime, week });
    }

    async handleGetRankingsError(context, responseTextPromise) {
        let responseText = await responseTextPromise;
        console.log(`handleGetRankingsError: ${responseText}`);
    }

    startGetRankings() {
        gcGetRankings(
            this.handleGetRankingsResponse,
            this.handleGetRankingsError,
            {},
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

    renderTopContributors(alltime, week) {
        return (
            <div className="flex flex-col">
                <h2 className="mt-10 text-center text-3xl text-gray-500">
                    {this.i18n("titleTopContributors")}
                </h2>
                <div className="flex flex-row">
                    {this.renderContribTable("titleAlltime", alltime)}
                    {this.renderContribTable("titleWeek", week)}
                </div>
            </div>
        );
    }

    render() {
        const alltime = this.state.alltime;
        const week = this.state.week;
        if (alltime == null || week == null) {
            return null;
        }
        return this.renderTopContributors(alltime, week);
    }
}

export default GcContribTop;