// =====================
// Einkommen & Richtwert
// =====================
const bruttoJahresgehalt = 50000; // Beispielwert
const sonstigeJahreseinnahmen = 0; // z. B. Bonus etc.
const abzug = 0.25; // Steuern + Sozialabgaben

const nettoJahreseinkommen = (bruttoJahresgehalt + sonstigeJahreseinnahmen) * (1 - abzug);
const nettoMonat = nettoJahreseinkommen / 12;

// Richtwerte (80 % Netto)
const richtwert2025 = nettoMonat * 0.8;
const inflation = 0.02;
const jahre = 2050 - 2025;
const faktor = Math.pow(1 + inflation, jahre);
const richtwert2050 = richtwert2025 * faktor;

// =====================
// Einnahmen-Kategorien
// =====================
const categories = ["Gesetzliche Rente", "Sonstige Einnahmen", "Betriebliche & geförderte Vorsorge", "Private Vorsorge"];

// 2025 Werte
const erreicht2025 = [1450, 400, 500, 100];

// 2050 Hochrechnung
const erreicht2050 = erreicht2025.map((v) => v * faktor);

// Summen
const sumErreicht2025 = erreicht2025.reduce((a, b) => a + b, 0);
const sumErreicht2050 = erreicht2050.reduce((a, b) => a + b, 0);

// "Deckel" für Netto-Einkommen
const nettoDeckel2025 = Math.max(0, nettoMonat - sumErreicht2025);
const nettoDeckel2050 = Math.max(0, nettoMonat * faktor - sumErreicht2050);

// =====================
// DIN 77230 Mindestsoll
// =====================
const minWage = 12.41; // €/h
const hoursPerDay = 8;
const daysPerMonth = 21;
const taxesAndSocialInsurance = 0.25;

const din2025 = minWage * hoursPerDay * daysPerMonth * (1 - taxesAndSocialInsurance);
const din2050 = din2025 * faktor;

// =======================================================
// HTML-Tabelle dynamisch
// =======================================================
(function fillHtmlTable() {
    const body = document.getElementById("vorsorgeTableBody");
    if (!body) return;
    body.innerHTML = "";

    // Kategorien
    for (let i = 0; i < categories.length; i++) {
        const tr = document.createElement("tr");
        if (i % 2 === 0) tr.style.backgroundColor = "#f2f2f2";
        tr.innerHTML = `
      <td>${categories[i]}</td>
      <td>${Math.round(erreicht2025[i]).toLocaleString()}</td>
      <td>${Math.round(erreicht2050[i]).toLocaleString()}</td>
    `;
        body.appendChild(tr);
    }

    // Summen & Zusatzzeilen
    const sums = [
        ["Gesamtsumme", sumErreicht2025, sumErreicht2050],
        ["Netto-Einkommen", nettoMonat, nettoMonat * faktor],
        ["Richtwert (80% Netto)", richtwert2025, richtwert2050],
        ["DIN 77230 Mindestsoll", din2025, din2050],
    ];
    sums.forEach((r, i) => {
        const tr = document.createElement("tr");
        if (i % 2 === 0) tr.style.backgroundColor = "#f2f2f2";
        tr.innerHTML = `
      <td><b>${r[0]}</b></td>
      <td>${Math.round(r[1]).toLocaleString()}</td>
      <td>${Math.round(r[2]).toLocaleString()}</td>
    `;
        body.appendChild(tr);
    });
})();

// =======================================================
// Chart.js – Plugin für GELBE + BLAUE LINIEN
// =======================================================
const refLinePlugin = {
    id: "refLinePlugin",
    afterDatasetsDraw(chart, args, opts) {
        const { ctx, scales } = chart;
        const x = scales.x;
        const y = scales.y;
        if (!x || !y) return;

        let catHalfWidth;
        if (chart.data.labels.length > 1) {
            const x0 = x.getPixelForTick(0);
            const x1 = x.getPixelForTick(1);
            catHalfWidth = Math.abs(x1 - x0) * 0.45;
        } else {
            catHalfWidth = (x.right - x.left) * 0.45;
        }

        ctx.save();
        ctx.lineWidth = opts.lineWidth ?? 2;

        // 2025
        if (chart.data.labels.length >= 1) {
            const cx0 = x.getPixelForTick(0);

            const yDIN = y.getPixelForValue(opts.din2025);
            ctx.strokeStyle = "yellow";
            ctx.beginPath();
            ctx.moveTo(cx0 - catHalfWidth, yDIN);
            ctx.lineTo(cx0 + catHalfWidth, yDIN);
            ctx.stroke();

            const yRicht = y.getPixelForValue(opts.richtwert2025);
            ctx.strokeStyle = "blue";
            ctx.beginPath();
            ctx.moveTo(cx0 - catHalfWidth, yRicht);
            ctx.lineTo(cx0 + catHalfWidth, yRicht);
            ctx.stroke();
        }

        // 2050
        if (chart.data.labels.length >= 2) {
            const cx1 = x.getPixelForTick(1);

            const yDIN = y.getPixelForValue(opts.din2050);
            ctx.strokeStyle = "yellow";
            ctx.beginPath();
            ctx.moveTo(cx1 - catHalfWidth, yDIN);
            ctx.lineTo(cx1 + catHalfWidth, yDIN);
            ctx.stroke();

            const yRicht = y.getPixelForValue(opts.richtwert2050);
            ctx.strokeStyle = "blue";
            ctx.beginPath();
            ctx.moveTo(cx1 - catHalfWidth, yRicht);
            ctx.lineTo(cx1 + catHalfWidth, yRicht);
            ctx.stroke();
        }

        ctx.restore();
    },
};
if (window.Chart && Chart.register) Chart.register(refLinePlugin);

// ===================================
// Chart.js – Diagramm erstellen
// ===================================
(function makeChart() {
    const canvas = document.getElementById("chart");
    if (!canvas) return;

    if (canvas.parentElement) {
        canvas.parentElement.style.height = "550px"; // höher machen
        canvas.parentElement.style.width = "50%"; // gleiche Breite wie Tabelle
    }

    const ctx = canvas.getContext("2d");

    window.chart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["2025", "2050"],
            datasets: [
                {
                    label: "Gesetzliche Rente",
                    data: [erreicht2025[0], erreicht2050[0]],
                    backgroundColor: "#2ca02c",
                    stack: "stackErreicht",
                },
                {
                    label: "Sonstige Einnahmen",
                    data: [erreicht2025[1], erreicht2050[1]],
                    backgroundColor: "#7fc97f",
                    stack: "stackErreicht",
                },
                {
                    label: "Betriebliche & geförderte Vorsorge",
                    data: [erreicht2025[2], erreicht2050[2]],
                    backgroundColor: "#1f7a1f",
                    stack: "stackErreicht",
                },
                {
                    label: "Private Vorsorge",
                    data: [erreicht2025[3], erreicht2050[3]],
                    backgroundColor: "#008080",
                    stack: "stackErreicht",
                },
                // Deckel zum Netto-Einkommen
                {
                    label: "Netto-Einkommen",
                    data: [nettoDeckel2025, nettoDeckel2050],
                    backgroundColor: "#66bb66", // Grünton
                    stack: "stackErreicht",
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: "Altersvorsorge: Einnahmen, Netto-Einkommen, Richtwert & Mindestsoll",
                    font: { size: 18 },
                },
                legend: { position: "top" },
                tooltip: { mode: "index", intersect: false },
                refLinePlugin: {
                    din2025,
                    din2050,
                    richtwert2025,
                    richtwert2050,
                    lineWidth: 2,
                },
            },
            scales: {
                x: { stacked: true, categoryPercentage: 1.0, barPercentage: 0.9 },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    ticks: {
                        stepSize: 100,
                        callback: function (value) {
                            return value.toLocaleString("de-DE") + " €";
                        },
                    },
                    suggestedMax: Math.ceil(Math.max(richtwert2050, nettoMonat * faktor, din2050) / 100) * 100,
                },
            },
        },
    });
})();

// =========================
// PDF-Generator (jsPDF)
// =========================
async function generatePDF() {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "mm", "a4");

    // Logo
    const logoImg = new Image();
    logoImg.src = "./logo.png";
    await new Promise((resolve) => {
        logoImg.onload = resolve;
    });
    pdf.addImage(logoImg, "PNG", 15, 8, 30, 15);

    // Titel
    pdf.setFontSize(18).setFont("helvetica", "bold");
    pdf.text("Auswertung Altersvorsorge", 15, 35);

    // Fließtext
    pdf.setFontSize(11).setFont("helvetica", "normal");
    const text =
        "Diese Auswertung stellt Ihre aktuelle Altersvorsorgesituation (Stand 2025) dar " +
        "und ergänzt eine Hochrechnung bis zum Jahr 2050 unter Annahme einer jährlichen Inflationsrate von 2 %. " +
        "Berücksichtigt werden die einzelnen Vorsorgebausteine – gesetzliche Rente, sonstige Einnahmen, betriebliche sowie private Vorsorge. \n\n" +
        "Der empfohlene Richtwert liegt bei etwa 80 % des letzten Nettoeinkommens. " +
        "Zusätzlich wurde der nach DIN 77230 definierte Mindestsollwert berechnet, " +
        "der sich am gesetzlichen Mindestlohn orientiert und als gelbe Referenzlinie in der Grafik hervorgehoben ist. \n\n" +
        "Diese Auswertung wurde in Anlehnung an die DIN 77230 erstellt. " +
        "Aus der Gegenüberstellung ergibt sich eine Versorgungslücke, " +
        "die langfristig durch gezielte Vorsorgemaßnahmen geschlossen werden sollte.";
    pdf.text(text, 15, 45, { maxWidth: 180 });

    // Tabelle
    const startY = 80;
    const rowHeight = 8;
    pdf.setFontSize(12).setFont("helvetica", "bold");
    pdf.setFillColor(0, 123, 255);
    pdf.setTextColor(255, 255, 255);
    pdf.rect(15, startY, 180, rowHeight, "F");
    pdf.text("Vorsorgequelle", 20, startY + 6);
    pdf.text("Bereits erreicht 2025", 90, startY + 6);
    pdf.text("Projektion 2050", 140, startY + 6);

    pdf.setFont("helvetica", "normal").setTextColor(0, 0, 0);

    // Kategorien
    for (let i = 0; i < categories.length; i++) {
        const y = startY + rowHeight * (i + 1);
        pdf.setFillColor(i % 2 === 0 ? 245 : 255);
        pdf.rect(15, y, 180, rowHeight, "F");
        pdf.text(categories[i], 20, y + 6);
        pdf.text(Math.round(erreicht2025[i]).toLocaleString(), 90, y + 6);
        pdf.text(Math.round(erreicht2050[i]).toLocaleString(), 140, y + 6);
    }

    // Summen
    const sums = [
        ["Gesamtsumme", sumErreicht2025, sumErreicht2050],
        ["Netto-Einkommen", nettoMonat, nettoMonat * faktor],
        ["Richtwert (80% Netto)", richtwert2025, richtwert2050],
        ["Versorgungslücke", luecke2025, luecke2050],
        ["DIN 77230 Mindestsoll", din2025, din2050],
    ];
    sums.forEach((r, i) => {
        const y = startY + rowHeight * (categories.length + i + 1);
        pdf.setFillColor(i % 2 === 0 ? 245 : 255);
        pdf.rect(15, y, 180, rowHeight, "F");
        pdf.text(r[0], 20, y + 6);
        pdf.text(Math.round(r[1]).toLocaleString(), 90, y + 6);
        pdf.text(Math.round(r[2]).toLocaleString(), 140, y + 6);
    });

    // Chart
    await new Promise(requestAnimationFrame);
    const chartImg = window.chart.toBase64Image();
    pdf.addImage(chartImg, "PNG", 15, startY + rowHeight * (categories.length + sums.length + 2), 160, 90);

    // Versorgungslücke Text
    pdf.setFont("helvetica", "bold").setFontSize(13);
    pdf.text(`Ermittelte Versorgungslücke: ${Math.round(luecke2025)} € (2025), ${Math.round(luecke2050)} € (2050, nominal)`, 15, startY + rowHeight * (categories.length + sums.length + 2) + 100);

    pdf.save("altersvorsorge_onepager.pdf");
}
window.generatePDF = generatePDF;

function calculateMinimumTargetValue() {
    const minWage = 12;
    const hoursPerDay = 8;
    const daysPerMonth = 21;

    result = minWage * hoursPerDay * daysPerMonth * (1 - taxesAndSocialInsurance);

    return result;
}

function calcualuteNettoFromBrutto(brutto) {
    return (brutto * (1 - taxesAndSocialInsurance)) / 12;
}

function calculateReferenceValueIncome(netto) {
    return netto * 0.8;
}

// Werte zu berücksichtigen
// Einkommen (Bruttomonatseinkommen, Anzahl der Gehälter, Sonstige Einkünfte(Miete, Pacht, etc.))
// -> Nettoeinkommen
// -> Richtwert (80% des Nettoeinkommens)
// Gesetzliche Rente
// Betriebliche Altersvorsorge (Monatlicher Beitrag, Geplante Rente)
// Private Vorsorge (Monatlicher Beitrag, Geplante Rente)

// Versorgungslücke = Richtwert - (Gesetzliche Rente + Betriebliche AV + Private Vorsorge)
