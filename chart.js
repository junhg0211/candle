const chart = document.getElementById("chart");
const ctx = chart.getContext("2d");

const price = document.getElementById("price");
const walletInput = document.getElementById("wallet");
const propertyInput = document.getElementById("property");
const gross = document.getElementById("gross");
const savingInput = document.getElementById("saving");
const amountInput = document.getElementById("amount");

chart.width = window.innerWidth;
chart.height = window.innerHeight;

let chartOpen = false;
let chartData = [];

let lastValue;
const maxData = 100;

let lastBuy = undefined;
let lastSell = undefined;

let wallet = 10000;
let having = 0;

function updateChart(value) {
    if (lastValue === undefined) lastValue = value;
    let data;
    if (chartOpen) {
        data = chartData[chartData.length - 1];
        data.close = value;
        data.high = Math.max(data.open, data.close, data.high);
        data.low = Math.min(data.open, data.close, data.low);
    } else {
        data = {
            open: lastValue + Math.random() * 0.5 - 0.25,
            high: Math.max(lastValue, value),
            low: Math.min(lastValue, value),
            close: value
        };
        chartData.push(data);
        while (chartData.length > maxData) {
            chartData = chartData.slice(1);
        }
        chartOpen = true;
    }
    lastValue = value;

    price.innerText = value;
    gross.innerText = wallet + having * value - parseFloat(savingInput.value);
}

function closeChart() {
    chartOpen = false;
}

function lerp(t, x1, x2, y1, y2) {
    return (y2 - y1) * (t - x1) / (x2 - x1) + y1;
}

function numberWithCommas(x) {
    if (x === undefined) return "0";

    var parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}

let interpolationTemp;

function renderChart() {
    let candleWidth = chart.clientWidth / chartData.length * 0.8;

    let min = chartData[0].low, max = chartData[0].high;
    for (let i = 0; i < chartData.length; i++) {
        let datum = chartData[i];
        min = Math.min(min, datum.low);
        max = Math.max(max, datum.high);
    }
    if (lastBuy !== undefined) {
        min = Math.min(min, lastBuy);
        max = Math.max(max, lastBuy);
    }
    if (lastSell !== undefined) {
        min = Math.min(min, lastSell);
        max = Math.max(max, lastSell);
    }

    ctx.clearRect(0, 0, chart.clientWidth, chart.clientHeight);

    // candles
    for (let i = 0; i < chartData.length; i++) {
        let datum = chartData[i];
        ctx.fillStyle = datum.open > datum.close ? "#0F80DA" : "#F35B5A";
        ctx.strokeStyle = ctx.fillStyle;

        let x = chart.clientWidth / chartData.length * i;
        let low = lerp(datum.low, min, max, chart.clientHeight, 0);
        let high = lerp(datum.high, min, max, chart.clientHeight, 0);
        let open = lerp(datum.open, min, max, chart.clientHeight, 0);
        let close = lerp(datum.close, min, max, chart.clientHeight, 0);

        ctx.fillRect(x, Math.min(open, close), candleWidth, Math.abs(open - close));
        ctx.beginPath();
        ctx.moveTo(x + candleWidth / 2, high);
        ctx.lineTo(x + candleWidth / 2, low);
        ctx.stroke();
    }

    // interpolation line 0.5
    interpolationTemp = (chartData[0].close + chartData[0].open) / 2;
    ctx.strokeStyle = "orange";
    ctx.beginPath()
    ctx.moveTo(candleWidth / 2, lerp(interpolationTemp, min, max, chart.clientHeight, 0));
    for (let i = 1; i < chartData.length; i++) {
        interpolationTemp = lerp(0.5, 0, 1, interpolationTemp, chartData[i].close);
        ctx.lineTo(
            candleWidth/2 + chart.clientWidth / chartData.length * i,
            lerp(interpolationTemp, min, max, chart.clientHeight, 0)
        );
    }
    ctx.stroke();

    // interpolation line 0.2
    interpolationTemp = (chartData[0].close + chartData[0].open) / 2;
    ctx.strokeStyle = "green";
    ctx.beginPath()
    ctx.moveTo(candleWidth / 2, lerp(interpolationTemp, min, max, chart.clientHeight, 0));
    for (let i = 1; i < chartData.length; i++) {
        interpolationTemp = lerp(0.2, 0, 1, interpolationTemp, chartData[i].close);
        ctx.lineTo(
            candleWidth/2 + chart.clientWidth / chartData.length * i,
            lerp(interpolationTemp, min, max, chart.clientHeight, 0)
        );
    }
    ctx.stroke();

    // interpolation line 0.05
    interpolationTemp = chartData[0].close;
    ctx.strokeStyle = "darkgrey";
    ctx.beginPath()
    ctx.moveTo(candleWidth / 2, lerp(interpolationTemp, min, max, chart.clientHeight, 0));
    for (let i = 1; i < chartData.length; i++) {
        interpolationTemp = lerp(0.05, 0, 1, interpolationTemp, chartData[i].close);
        ctx.lineTo(
            candleWidth/2 + chart.clientWidth / chartData.length * i,
            lerp(interpolationTemp, min, max, chart.clientHeight, 0)
        );
    }
    ctx.stroke();

    // horizontal lines
    ctx.font = "17px Arial";
    ctx.textAlign = "right";
    let unit = Math.pow(2, Math.floor(Math.log2(max - min) - 3));
    for (let l = Math.floor(min / unit) * unit; l < max; l += unit) {
        ctx.strokeStyle = "grey";
        ctx.fillStyle = ctx.strokeStyle;
        let y = lerp(l, min, max, chart.clientHeight, 0);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(chart.clientWidth, y);
        ctx.stroke();
        ctx.fillText(numberWithCommas(l), chart.clientWidth - 10, y - 8);
    }

    y = lerp(lastBuy, min, max, chart.clientHeight, 0);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "blue";
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(chart.clientWidth, y);
    ctx.stroke();
    ctx.fillText(numberWithCommas(lastBuy), chart.clientWidth - 10, y - 8);

    y = lerp(lastSell, min, max, chart.clientHeight, 0);
    ctx.strokeStyle = "red";
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(chart.clientWidth, y);
    ctx.stroke();
    ctx.fillText(numberWithCommas(lastBuy), chart.clientWidth - 10, y - 8);

    ctx.lineWidth = 1;
}

updateChart(100);
let count = 0;

function tick() {
    let delta = Math.random() * 2 - 1;
    updateChart(lastValue + delta);
    if (count++ % 10 == 0) {
        count %= 10;
        closeChart();
    }
}

const fps = 10;
setInterval(() => {
    tick();
    renderChart();
}, 1000 / fps);

for (let i = 0; i < fps * maxData; i++) {
    tick();
}

window.addEventListener("resize", () => {
    chart.width = window.innerWidth;
    chart.height = window.innerHeight;
});

walletInput.value = wallet;
propertyInput.value = having;

function buy() {
    amountNow = parseInt(amountInput.value);
    if (wallet > lastValue * amountNow) {
        having += amountNow;
        wallet -= lastValue * amountNow;
    }
    walletInput.value = wallet;
    propertyInput.value = having;
    lastBuy = lastValue;
}

function sell() {
    if (having >= amountNow) {
        having -= amountNow;
        wallet += lastValue * amountNow;
    }
    walletInput.value = wallet;
    propertyInput.value = having;
    lastSell = lastValue;
}
