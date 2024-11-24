const { initUiLangSwitcher } = require("./lib/i18n");
const { initViewerMenuButton } = require("./lib/viewer_menu");

initViewerMenuButton();
initUiLangSwitcher();

google.charts.load('current', {'packages':["bar", "corechart"]});

function drawStuff() {
    var data = new google.visualization.arrayToDataTable([
        ["Dictionary", "Recall", { role: "style" }],
        ["sozdik.kz [ru]", 0.8158, "color: #3399ff"],
        ["acelinguo.com [ru]", 0.8158, "color: #eb4444"],
        ["Oxford [en]", 0.6842, "color: #1d0c42"],
        ["leneshmidt.com [en,ru]", 0.4868, "color: #b19a74"],
        ["glosbe.com [ru]", 0.4211, "color: #ffbe49"],
        ["A1 learner [ru]", 0.3947, "color: #44aa00"],
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
        title: "Benchmarking Kazakh-Language Dictionary Coverage",
        bars: "horizontal", // Required for Material Bar Charts.
        series: {
        0: { axis: "Recall" },
        },
        axes: {
        x: {
            distance: {label: 'ratio of words with translation'},
        }
        },
        hAxis: {
        title: "ratio of words with translation",
        minValue: 0.0
        },
        legend: { position: "none" },
};

    var chart = new google.visualization.BarChart(document.getElementById("dict_vocab_chart"));
    chart.draw(view, options);
};

google.charts.setOnLoadCallback(drawStuff);