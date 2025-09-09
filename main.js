// --- Daten ---
const labels = ["Gesetzliche Rente", "Wohneigentum", "Betriebliche AV", "Private Vorsorge", "Gesamt"];
const erreicht = [1200, 600, 200, 150, 2150];
const richtwert = [1800, 600, 400, 500, 3300];
const luecke = richtwert.map((r, i) => Math.max(0, r - erreicht[i]));

// --- Chart.js Diagramm: gestapelt + Richtwert direkt daneben ---
const ctx = document.getElementById("chart").getContext("2d");

const chart = new Chart(ctx, {
    type: "bar",
    data: {
        labels: labels,
        datasets: [
            {
                label: "Bereits erreicht",
                data: erreicht,
                backgroundColor: "green",
                stack: "stack1",
            },
            {
                label: "Versorgungslücke",
                data: luecke,
                backgroundColor: "red",
                stack: "stack1",
            },
            {
                label: "Richtwert",
                data: richtwert,
                backgroundColor: "blue",
                stack: "stack2",
            },
        ],
    },
    options: {
        responsive: true,
        plugins: {
            title: { display: true, text: "Altersvorsorge: Gestapelt vs. Richtwert" },
            legend: { position: "top" },
        },
        scales: {
            x: {
                stacked: true,
                categoryPercentage: 1.0, // maximale Breite pro Kategorie
                barPercentage: 1.0, // Balken maximal breit
            },
            y: {
                stacked: true,
                beginAtZero: true,
            },
        },
    },
});

// --- PDF Generator ---
async function generatePDF() {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();

    // Logo laden und einfügen
    const logoImg = new Image();
    logoImg.src = "./logo.png";
    await new Promise((resolve) => {
        logoImg.onload = resolve;
    });
    // Füge das Logo oben links ein (Größe und Position ggf. anpassen)
    pdf.addImage(logoImg, "PNG", 15, 8, 30, 15);

    pdf.setFontSize(18).setFont("helvetica", "bold");
    pdf.text("Auswertung Altersvorsorge", 15, 35); // Titel etwas nach rechts, damit er nicht über dem Logo liegt

    pdf.setFontSize(11).setFont("helvetica", "normal");
    const text =
        "Der aktuelle Stand Ihrer Altersvorsorge wurde anhand der zu erwartenden Ausgaben im Ruhestand sowie gängiger Richtwerte verglichen. " +
        "Um den gewohnten Lebensstandard aufrechtzuerhalten, wird empfohlen, etwa 70–80 % des letzten Nettoeinkommens als monatliche Altersrente zur Verfügung zu haben.\n\n" +
        "Aktuell stehen Ihnen aus der gesetzlichen Rentenversicherung sowie durch Ihr im Alter abbezahltes Wohneigentum bereits feste Werte zur Verfügung. " +
        "Diese bilden eine solide Basis, reichen jedoch allein nicht aus, um den Richtwert vollständig zu erreichen.\n\n" +
        "Aus der Gegenüberstellung ergibt sich eine noch bestehende Versorgungslücke, die durch private Vorsorgeprodukte oder ergänzende Anlageformen geschlossen werden sollte.";
    // Text beginnt unterhalb von Logo und Titel (z.B. y=35)
    pdf.text(text, 15, 45, { maxWidth: 180 });

    // Tabelle ins PDF
    const startY = 95;
    const rowHeight = 8;
    pdf.setFontSize(12).setFont("helvetica", "bold");
    pdf.setFillColor(0, 123, 255);
    pdf.setTextColor(255, 255, 255);
    pdf.rect(15, startY, 180, rowHeight, "F");
    pdf.text("Vorsorgequelle", 20, startY + 6);
    pdf.text("Bereits erreicht", 90, startY + 6);
    pdf.text("Richtwert", 140, startY + 6);

    pdf.setFont("helvetica", "normal").setTextColor(0, 0, 0);
    const rows = [
        ["Gesetzliche Rente", "1.200", "1.800"],
        ["Wohneigentum", "600", "600"],
        ["Betriebliche AV", "200", "400"],
        ["Private Vorsorge", "150", "500"],
        ["Gesamtsumme", "2.150", "3.300"],
    ];

    rows.forEach((r, i) => {
        const y = startY + rowHeight * (i + 1);
        if (i % 2 === 0) pdf.setFillColor(245, 245, 245);
        else pdf.setFillColor(255, 255, 255);
        pdf.rect(15, y, 180, rowHeight, "F");
        pdf.text(r[0], 20, y + 6);
        pdf.text(r[1], 90, y + 6);
        pdf.text(r[2], 140, y + 6);
    });

    // Diagramm einfügen
    const chartImg = chart.toBase64Image();
    pdf.addImage(chartImg, "PNG", 15, startY + rowHeight * (rows.length + 2), 180, 100);

    // Versorgungslücke
    pdf.setFont("helvetica", "bold").setFontSize(13);
    pdf.text("Ermittelte Versorgungslücke: 1.150 € pro Monat", 15, startY + rowHeight * (rows.length + 2) + 110);

    pdf.save("altersvorsorge_onepager.pdf");
}
