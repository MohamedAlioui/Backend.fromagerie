import puppeteer from "puppeteer";

export async function generateInvoicePDF(invoice) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    const htmlContent = generateInvoiceHTML(invoice);
    await page.setContent(htmlContent, {
      waitUntil: "networkidle0",
    });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "10mm",
        right: "10mm",
        bottom: "10mm",
        left: "10mm",
      },
    });

    return pdf;
  } finally {
    await browser.close();
  }
}

function generateInvoiceHTML(invoice) {
  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("fr-FR");
  };

  const formatCurrency = (amount) => {
    if (isNaN(amount)) return "0,000 TND";
    return `${amount.toFixed(3).replace(".", ",")} TND`;
  };

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        body {
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
        .border-black {
          border-color: #000 !important;
        }
      </style>
    </head>
    <body class="text-gray-900 font-sans">
      <div class="max-w-4xl mx-auto p-8">
        <!-- Invoice Template -->
        <div class="bg-white">
          <!-- Header -->
          <div class="border-2 border-black p-5 mb-6">
            <div class="flex justify-between items-start mb-6">
              <!-- Left side - Logo and Company Info -->
              <div class="flex flex-col">
                <div class="mb-4">
                  <img src="https://i.ibb.co/ZzzzhdRN/LOGO1.png" alt="Logo" width="100" />
                </div>
                <div>
                  <h3 class="text-lg font-bold text-gray-900 mb-2">Fromagerie Alioui</h3>
                  <p class="text-sm text-gray-700 mb-1">Zhena, Utique Bizerte</p>
                  <p class="text-sm text-gray-700 mb-1"><strong>TEL:</strong> 98136638</p>
                  <p class="text-sm text-gray-700"><strong>MF:</strong> 1798066/G</p>
                  <p class="text-sm text-gray-700">Livreur :laamiri omar  </p>
                </div>
              </div>
              <!-- Right side - Invoice Info and Client Details -->
              <div class="text-right mr-20 mt-10">
                <div class="text-xl font-bold text-center mb-6">
                  Facture : N° ${invoice.invoiceNumber || "BCC21-"}
                </div>
                <div class="text-left">
                  <p class="text-sm mb-2"><strong>Nom client:</strong> ${
                    invoice.clientName || ""
                  }</p>
                  <p class="text-sm mb-2"><strong>N° client:</strong> ${
                    invoice.clientNumber || ""
                  }</p>
                  <p class="text-sm mb-2"><strong>Adresse:</strong> ${
                    invoice.clientAddress || ""
                  }</p>
                  <p class="text-sm mb-4"><strong>MF:</strong> ${
                    invoice.clientMF || ""
                  }</p>
                  <p class="text-sm font-bold"><strong>Date:</strong> ${formatDate(
                    invoice.date
                  )}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Items Table -->
          <table class="w-full border-collapse border border-black mb-6">
            <thead>
              <tr class="bg-gray-100">
                <th class="border border-black px-4 py-2 text-left font-bold">Désignation Article</th>
                <th class="border border-black px-4 py-2 text-center font-bold">Quantité (kg)</th>
                <th class="border border-black px-4 py-2 text-center font-bold">Prix Uni. TTC</th>
                <th class="border border-black px-4 py-2 text-center font-bold">Montant TTC</th>
              </tr>
            </thead>
            <tbody>
              ${(invoice.items || [])
                .map(
                  (item) => `
                <tr>
                  <td class="border border-black px-4 py-2">${
                    item.designation || ""
                  }</td>
                  <td class="border border-black px-4 py-2 text-center">${
                    item.quantity || 0
                  }</td>
                  <td class="border border-black px-4 py-2 text-center">${formatCurrency(
                    item.unitPrice || 0
                  )}</td>
                  <td class="border border-black px-4 py-2 text-center">${formatCurrency(
                    item.totalPrice || 0
                  )}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>

          <!-- Summary Table -->
          <table class="w-full border-collapse border border-black mb-6">
            <tbody>
              <tr>
                <td class="border border-black px-4 py-2 bg-gray-100 font-bold">Montant Total HT</td>
                <td class="border border-black px-4 py-2 text-right">${formatCurrency(
                  invoice.totalHT || 0
                )}</td>
              </tr>
              <tr>
                <td class="border border-black px-4 py-2 bg-gray-100 font-bold">TVA (19%)</td>
                <td class="border border-black px-4 py-2 text-right">${formatCurrency(
                  (invoice.totalHT || 0) * 0.19
                )}</td>
              </tr>
              <tr>
                <td class="border border-black px-4 py-2 bg-gray-100 font-bold">Total REMISE</td>
                <td class="border border-black px-4 py-2 text-right">${formatCurrency(
                  invoice.totalRemise || 0
                )}</td>
              </tr>
              <tr>
                <td class="border border-black px-4 py-2 bg-gray-100 font-bold">Total TTC</td>
                <td class="border border-black px-4 py-2 text-right">${formatCurrency(
                  invoice.totalTTC || 0
                )}</td>
              </tr>
            </tbody>
          </table>

          <!-- Footer Section -->
          <div class="border border-black p-4 mb-6 h-32">
            <p class="font-bold text-sm">Arrêté Le présent la facture à la somme de ${formatCurrency(
              invoice.totalTTC || 0
            )}.</p>
          </div>

          <!-- Bottom Footer -->
          <div class="border border-black p-2 text-xs flex justify-between bg-gray-50">
            <span>Page : 1/1</span>
            <span>Utilisateur : Alioui Assil</span>
            <span>Date d'impression : ${formatDate(new Date())}</span>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}
