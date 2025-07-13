import mongoose from "mongoose";

const invoiceItemSchema = new mongoose.Schema({
  designation: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0,
  },
});

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
  },
  clientName: {
    type: String,
    required: true,
  },
  clientNumber: {
    type: String,
    required: true,
  },
  clientAddress: {
    type: String,
    required: true,
  },

  clientMF: {
    type: String,
    required: true,
  },
  livreurNom: {
    type: String,
    required: true,
    default: "AbdelMonaam Alioui",
  },
  date: {
    type: Date,
    default: Date.now,
  },
  items: [invoiceItemSchema],
  totalHT: {
    type: Number,
    required: true,
    min: 0,
  },
  totalRemise: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalTTC: {
    type: Number,
    required: true,
    min: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Invoice", invoiceSchema);
