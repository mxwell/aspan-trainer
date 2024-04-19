import React from "react";
import { i18n } from "../lib/i18n";
import { loadTopList } from "../lib/requests";
import { buildViewerUrl2 } from "../lib/url";
import { SENTENCE_TYPES } from "../lib/sentence";

const VERB_COLORS = [
    "text-blue-600",
    "text-green-600",
    "text-orange-600",
    "text-red-600",
];

class TopItem {
    constructor(rank, verb, exceptional, colorIndex, strong, stats) {
        this.rank = rank;
        this.verb = verb;
        this.exceptional = exceptional;
        this.colorIndex = colorIndex;
        this.strong = strong;
        this.stats = stats;
    }
    getVerbInnerHtml() {
        if (this.strong) {
            return (
                <strong>{this.verb}</strong>
            );
        }
        return this.verb;
    }
    getVerbHtml() {
        const color = VERB_COLORS[this.colorIndex];
        return (
            <td className={`p-2 border-2 ${color}`}>
                {this.getVerbInnerHtml()}
            </td>
        );
    }
    getViewerUrl(lang) {
        return buildViewerUrl2(
            this.verb,
            SENTENCE_TYPES[0],
            this.exceptional,
            lang,
            null,
            false,
        );
    }
}

function parseTopList(topListText) {
    let lines = topListText.split("\n");
    let topList = [];
    let rank = 1;
    for (let line of lines) {
        if (line.length == 0) {
            continue;
        }
        let parts = line.split(":");
        if (parts.length != 9) {
            console.log(`Invalid line in top list: ${line}`);
            continue;
        }
        let verb = parts[0];
        let exceptional = parts[1] == "1";
        let colorIndex = parts[2];
        let strong = parts[3] == "1";
        let stats = parts.slice(4).map((x) => parseInt(x));
        topList.push(new TopItem(rank, verb, exceptional, colorIndex, strong, stats));
        rank++;
    }
    return topList;
}

class TopApp extends React.Component {
    constructor(props) {
        super(props);

        this.handleTopListResponse = this.handleTopListResponse.bind(this);
        this.handleTopListError = this.handleTopListError.bind(this);

        this.requestTopList();

        this.state = this.makeState();
    }

    makeState() {
        return {
            topList: []
        };
    }

    requestTopList() {
        console.log("Requesting top list")
        loadTopList(
            this.handleTopListResponse,
            this.handleTopListError
        );
    }

    i18n(key) {
        return i18n(key, this.props.lang);
    }

    async handleTopListResponse(context, responseTextPromise) {
        const response = await responseTextPromise;
        console.log(`Got response of length ${response.length}`);

        const topList = parseTopList(response);
        console.log(`Parsed top list of length ${topList.length}`);
        this.setState({ topList });
    }

    async handleTopListError(context, responseTextPromise) {
        const responseText = await responseTextPromise;
        console.log(`Got error on top list load: ${responseText}`);
    }

    renderLegend() {
        return (
            <div className="m-4">
                <h2 className="text-center text-3xl m-4">{this.i18n("legend")}</h2>
                <p className="text-xl">{this.i18n("frequency_source_is_issai_ksc2")}</p>
                <p className="text-xl">{this.i18n("verb_color_depends_on_aux_likelihood")}:</p>
                <ul className="text-xl m-4">
                    <li className="text-blue-600">- {this.i18n("verb_blue_jatyr")}</li>
                    <li className="text-green-600">- {this.i18n("verb_green_otyr")}</li>
                    <li className="text-orange-600">- {this.i18n("verb_orange_tur")}</li>
                    <li className="text-red-600">- {this.i18n("verb_red_jur")}</li>
                </ul>
                <p className="text-xl">{this.i18n("verb_bold_majority")}</p>
                <p className="text-xl">{this.i18n("feedback_invite")}</p>
            </div>
        );
    }

    renderTopList() {
        const topList = this.state.topList;
        if (topList.length == 0) {
            return <p>Loading...</p>;
        }
        return (
            <div>
                <table className="text-center text-xl m-4">
                    <thead>
                        <tr>
                            <th className="p-2 border-2">#</th>
                            <th className="p-2 border-2">{this.i18n("Verb")}</th>
                            <th className="p-2 border-2">↓&nbsp;{this.i18n("column_freq")}</th>
                            <th className="p-2 border-2">жатыр</th>
                            <th className="py-2 px-4 border-2">жүр</th>
                            <th className="p-2 border-2">отыр</th>
                            <th className="py-2 px-4 border-2">тұр</th>
                            <th className="p-2 border-2">{this.i18n("column_forms_link")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {topList.map((item, index) => (
                            <tr key={index}>
                                <td className="p-2 border-2">{item.rank}</td>
                                {item.getVerbHtml()}
                                <td className="p-2 border-2">{item.stats[0]}</td>
                                <td className="p-2 border-2">{item.stats[1]}</td>
                                <td className="p-2 border-2">{item.stats[2]}</td>
                                <td className="p-2 border-2">{item.stats[3]}</td>
                                <td className="p-2 border-2">{item.stats[4]}</td>
                                <td className="p-2 border-2">
                                    <a href={item.getViewerUrl(this.props.lang)}>→</a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {this.renderLegend()}
            </div>
        );
    }

    render() {
        return (
            <div>
                <h1 className="text-4xl m-4">{this.i18n("present_top_title")}</h1>
                {this.renderTopList()}
            </div>
        );
    }
}

export default TopApp;