import express from 'express';
import Invoice from '../models/Invoice.js';
import { generateInvoicePDF } from '../utils/pdfGenerator.js';

const router = express.Router();

// Helper function to calculate totals
const calculateInvoiceTotals = (invoiceData) => {
  const totalHT = invoiceData.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  const totalTVA = totalHT * 0.19; // 19% TVA
  const timbre = invoiceData.timbre || 0.1;
  const totalRemise = invoiceData.totalRemise || 0;
  const totalTTC = totalHT + totalTVA + timbre - totalRemise;
  
  return {
    totalHT,
    totalTVA,
    timbre,
    totalRemise,
    totalTTC
  };
};

// Error handling middleware specific to this router
const handleAsyncErrors = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Get all invoices
router.get('/', handleAsyncErrors(async (req, res) => {
  const invoices = await Invoice.find().sort({ createdAt: -1 });
  res.json(invoices);
}));

// Get single invoice
router.get('/:id', handleAsyncErrors(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) {
    return res.status(404).json({ message: 'Invoice not found' });
  }
  res.json(invoice);
}));

// Create new invoice
router.post('/', handleAsyncErrors(async (req, res) => {
  // Generate invoice number
  const lastInvoice = await Invoice.findOne().sort({ createdAt: -1 });
  let nextNumber = 1;
  if (lastInvoice) {
    const lastNumber = parseInt(lastInvoice.invoiceNumber.split('BCC')[1]);
    nextNumber = lastNumber + 1;
  }
  const invoiceNumber = `BCC${nextNumber.toString().padStart(3, '0')}`;

  // Calculate totals
  const calculatedTotals = calculateInvoiceTotals(req.body);

  const invoice = new Invoice({
    ...req.body,
    invoiceNumber,
    ...calculatedTotals
  });

  const savedInvoice = await invoice.save();
  res.status(201).json(savedInvoice);
}));

// Update invoice
router.put('/:id', handleAsyncErrors(async (req, res) => {
  // Calculate totals
  const calculatedTotals = calculateInvoiceTotals(req.body);

  const invoice = await Invoice.findByIdAndUpdate(
    req.params.id,
    {
      ...req.body,
      ...calculatedTotals
    },
    { new: true }
  );
  if (!invoice) {
    return res.status(404).json({ message: 'Invoice not found' });
  }
  res.json(invoice);
}));

// Delete invoice
router.delete('/:id', handleAsyncErrors(async (req, res) => {
  const invoice = await Invoice.findByIdAndDelete(req.params.id);
  if (!invoice) {
    return res.status(404).json({ message: 'Invoice not found' });
  }
  res.json({ message: 'Invoice deleted successfully' });
}));

// Generate PDF with enhanced error handling and progress tracking
router.get('/:id/pdf', handleAsyncErrors(async (req, res) => {
  console.log(`[PDF] Starting PDF generation for invoice ${req.params.id}`);
  
  // Validate invoice ID format
  if (!req.params.id || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ 
      message: 'Format d\'ID de facture invalide',
      code: 'INVALID_ID_FORMAT'
    });
  }

  // Find invoice
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) {
    console.log(`[PDF] Invoice not found: ${req.params.id}`);
    return res.status(404).json({ 
      message: 'Facture introuvable',
      code: 'INVOICE_NOT_FOUND'
    });
  }

  console.log(`[PDF] Invoice found: ${invoice.invoiceNumber}`);
  console.log(`[PDF] User: ${req.user?.username || 'Unknown'}`);

  try {
    // Set timeout for entire PDF generation process
    const timeoutMs = 120000; // 2 minutes
    const startTime = Date.now();
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('PDF generation timeout - Le serveur met trop de temps à générer le PDF'));
      }, timeoutMs);
    });

    // Generate PDF with enhanced error handling
    const pdfBuffer = await Promise.race([
      generateInvoicePDF(invoice, req.user),
      timeoutPromise
    ]);
    
    const generationTime = Date.now() - startTime;
    console.log(`[PDF] PDF generated successfully in ${generationTime}ms, size: ${pdfBuffer.length} bytes`);
    
    // Enhanced PDF validation
    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error('Le PDF généré est vide');
    }

    if (pdfBuffer.length < 1000) { // PDF should be at least 1KB
      throw new Error('Le PDF généré semble corrompu (trop petit)');
    }

    // Verify PDF header
    const pdfHeader = pdfBuffer.subarray(0, 4).toString();
    if (pdfHeader !== '%PDF') {
      console.error('[PDF] Invalid PDF header:', pdfHeader);
      throw new Error('Le fichier généré n\'est pas un PDF valide');
    }

    // Verify PDF footer (should end with %%EOF)
    const pdfEnd = pdfBuffer.subarray(-6).toString();
    if (!pdfEnd.includes('%%EOF')) {
      console.warn('[PDF] PDF may be incomplete - missing EOF marker');
    }

    // Set comprehensive headers for PDF download
    const filename = `Facture_${invoice.invoiceNumber}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Download-Options', 'noopen');
    
    // Add custom headers for frontend progress tracking
    res.setHeader('X-PDF-Generation-Time', generationTime.toString());
    res.setHeader('X-PDF-Size', pdfBuffer.length.toString());
    
    // Send PDF buffer
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('[PDF] Error:', error);
    
    // Enhanced error classification and user-friendly messages
    let statusCode = 500;
    let errorMessage = 'Erreur lors de la génération du PDF';
    let errorCode = 'PDF_GENERATION_ERROR';
    
    if (error.message.includes('timeout')) {
      statusCode = 504;
      errorMessage = 'La génération du PDF prend trop de temps. Veuillez réessayer.';
      errorCode = 'PDF_TIMEOUT';
    } else if (error.message.includes('memory') || error.message.includes('Memory')) {
      statusCode = 507;
      errorMessage = 'Mémoire insuffisante pour générer le PDF. Veuillez réessayer plus tard.';
      errorCode = 'INSUFFICIENT_MEMORY';
    } else if (error.message.includes('browser') || error.message.includes('puppeteer')) {
      statusCode = 503;
      errorMessage = 'Service de génération PDF temporairement indisponible.';
      errorCode = 'PDF_SERVICE_UNAVAILABLE';
    } else if (error.message.includes('not found')) {
      statusCode = 404;
      errorMessage = 'Facture introuvable';
      errorCode = 'INVOICE_NOT_FOUND';
    } else if (error.message.includes('vide') || error.message.includes('corrompu')) {
      statusCode = 422;
      errorMessage = error.message;
      errorCode = 'PDF_VALIDATION_ERROR';
    }
    
    // Log detailed error for debugging
    console.error('[PDF] Detailed error:', {
      invoiceId: req.params.id,
      invoiceNumber: invoice?.invoiceNumber,
      user: req.user?.username,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    res.status(statusCode).json({ 
      message: errorMessage,
      code: errorCode,
      invoiceNumber: invoice?.invoiceNumber,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && { 
        debug: {
          originalError: error.message,
          stack: error.stack
        }
      })
    });
  }
}));

// Add download route that redirects to PDF route for consistency
router.get('/:id/download', handleAsyncErrors(async (req, res) => {
  // Redirect to the PDF route
  res.redirect(`/api/invoices/${req.params.id}/pdf`);
}));

export default router;