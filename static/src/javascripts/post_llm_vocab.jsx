const { initUiLangSwitcher } = require("./lib/i18n");
const { initViewerMenuButton } = require("./lib/viewer_menu");

initViewerMenuButton();
initUiLangSwitcher();

google.charts.load('current', {'packages':["bar", "corechart"]});

function drawStuff() {
    var data = new google.visualization.arrayToDataTable([
        ["Model", "Precision", { role: "style" }],
        ["GPT-4o", 0.853333, "color: #4e4c4c"],
        ["Claude 3.5 Sonnet", 0.744667, "color: #d97858"],
        ["GPT-4o-mini", 0.636667, "color: #4e4c4c"],
        ["Claude 3 Haiku", 0.630000, "color: #d97858"],
        ["Gemini 1.5 Pro", 0.627333, "color: #1a73e8"],
        ["Gemini 1.5 Flash", 0.526000, "color: #1a73e8"],
    ]);
    var view = new google.visualization.DataView(data);
    view.setColumns([0, 1,
                    { calc: "stringify",
                        sourceColumn: 1,
                        type: "string",
                        role: "annotation" },
                    2]);

    var options = {
        width: 900,
        height: 500,
        title: "LLM Knowledge of Kazakh Vocab",
        bars: "horizontal", // Required for Material Bar Charts.
        series: {
        0: { axis: "Precision" },
        },
        axes: {
        x: {
            distance: {label: 'ratio of correct translations'},
        }
        },
        hAxis: {
        title: "ratio of correct word translations",
        minValue: 0.0
        },
        legend: { position: "none" },
};

    var chart = new google.visualization.BarChart(document.getElementById("llm_vocab_chart"));
    chart.draw(view, options);
};

google.charts.setOnLoadCallback(drawStuff);