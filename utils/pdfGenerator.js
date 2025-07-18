import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

export async function generateInvoicePDF(invoice) {
  let browser = null;
  
  try {
    // Configuration pour production (Vercel) et développement local
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;
    
    if (isProduction) {
      // Configuration pour Vercel avec @sparticuz/chromium
      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
        ignoreHTTPSErrors: true,
      });
    } else {
      // Configuration pour développement local
      const puppeteerRegular = await import("puppeteer");
      browser = await puppeteerRegular.default.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
    }

    const page = await browser.newPage();
    
    // Configuration de la page
    await page.setViewport({ width: 1200, height: 800 });
    
    const htmlContent = generateInvoiceHTML(invoice);
    await page.setContent(htmlContent, {
      waitUntil: "networkidle0",
      timeout: 30000,
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
  } catch (error) {
    console.error('Error in PDF generation:', error);
    throw new Error(`Erreur lors de la génération du PDF: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
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
        @media print {
          body { margin: 0; }
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
                  <img src="https://i.ibb.co/ZzzzhdRN/LOGO1.png" alt="Fromagerie Alioui Logo" width="120" 
                       style="max-width: 100px; max-height: 70px; object-fit: contain; border-radius: 4px;"
                       onerror="this.style.display='none'; this.parentElement.innerHTML='<div style=\'width:100px;height:70px;background:#f8f9fa;border:1px solid #dee2e6;display:flex;align-items:center;justify-content:center;text-align:center;color:#666;font-size:10px;border-radius:4px;\'>FROMAGERIE<br>ALIOUI</div>';" />
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
