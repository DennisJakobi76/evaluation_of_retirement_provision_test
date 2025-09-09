// --- Daten ---
const labels = ["Gesetzliche Rente", "Wohneigentum", "Betriebliche AV", "Private Vorsorge", "Gesamt"];
const erreicht = [1200, 600, 200, 150, 2150];
const richtwert = [1800, 600, 400, 500, 3300];
const luecke = richtwert.map((r, i) => Math.max(0, r - erreicht[i]));

// --- Chart.js Diagramm ---
const ctx = document.getElementById("chart").getContext("2d");
const chart = new Chart(ctx, {
    type: "bar",
    data: {
        labels,
        datasets: [
            { label: "Bereits erreicht", data: erreicht, backgroundColor: "green" },
            { label: "Richtwert", data: richtwert, backgroundColor: "blue" },
            { label: "Versorgungslücke", data: luecke, backgroundColor: "red" },
        ],
    },
    options: {
        responsive: true,
        plugins: { title: { display: true, text: "Altersvorsorge: Richtwerte vs. Ist" } },
        scales: { y: { beginAtZero: true } },
    },
});

// --- PDF Generator ---
async function generatePDF() {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();

    // Titel
    pdf.setFontSize(18).setFont("helvetica", "bold");
    pdf.text("Auswertung Altersvorsorge", 15, 20);

    // Fließtext
    pdf.setFontSize(11).setFont("helvetica", "normal");
    const text =
        "Der aktuelle Stand Ihrer Altersvorsorge wurde anhand der zu erwartenden Ausgaben im Ruhestand sowie gängiger Richtwerte verglichen. " +
        "Um den gewohnten Lebensstandard aufrechtzuerhalten, wird empfohlen, etwa 70–80 % des letzten Nettoeinkommens als monatliche Altersrente zur Verfügung zu haben.\n\n" +
        "Aktuell stehen Ihnen aus der gesetzlichen Rentenversicherung sowie durch Ihr im Alter abbezahltes Wohneigentum bereits feste Werte zur Verfügung. " +
        "Diese bilden eine solide Basis, reichen jedoch allein nicht aus, um den Richtwert vollständig zu erreichen.\n\n" +
        "Aus der Gegenüberstellung ergibt sich eine noch bestehende Versorgungslücke, die durch private Vorsorgeprodukte oder ergänzende Anlageformen geschlossen werden sollte.";
    pdf.text(text, 15, 30, { maxWidth: 180 });

    // Tabelle
    const headers = ["Vorsorgequelle", "Bereits erreicht", "Richtwert"];
    const rows = [
        ["Gesetzliche Rente", "1.200 €", "1.800 €"],
        ["Wohneigentum", "600 €", "600 €"],
        ["Betriebliche AV", "200 €", "400 €"],
        ["Private Vorsorge", "150 €", "500 €"],
        ["Gesamtsumme", "2.150 €", "3.300 €"],
    ];

    let startY = 90;
    pdf.setFillColor(0, 123, 255);
    pdf.setTextColor(255, 255, 255);
    pdf.rect(15, startY, 180, 8, "F");
    pdf.text(headers.join("   "), 20, startY + 6);

    pdf.setTextColor(0, 0, 0);
    rows.forEach((row, i) => {
        pdf.text(row.join("   "), 20, startY + 15 + i * 8);
    });

    // Diagramm einfügen
    const chartImg = chart.toBase64Image();
    pdf.addImage(chartImg, "PNG", 15, startY + 60, 180, 100);

    // Versorgungslücke
    pdf.setFontSize(13).setFont("helvetica", "bold");
    pdf.text("Ermittelte Versorgungslücke: 1.150 € pro Monat", 15, startY + 170);

    // PDF speichern
    pdf.save("altersvorsorge_onepager.pdf");
}
