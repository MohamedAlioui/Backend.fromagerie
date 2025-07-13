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

// Get all invoices
router.get('/', async (req, res) => {
  try {
    const invoices = await Invoice.find().sort({ createdAt: -1 });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single invoice
router.get('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new invoice
router.post('/', async (req, res) => {
  try {
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
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update invoice
router.put('/:id', async (req, res) => {
  try {
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
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete invoice
router.delete('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Generate PDF
router.get('/:id/pdf', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const pdfBuffer = await generateInvoicePDF(invoice);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="facture-${invoice.invoiceNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;