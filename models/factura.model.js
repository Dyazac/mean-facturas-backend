import mongoose from 'mongoose';

// Forma de una factura en MongoDB
const facturaSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true, index: true }, // uid de Firebase Auth
    proveedor: { type: String, required: true, trim: true },
    fechaEmision: { type: String, required: true },      // 'YYYY-MM-DD'
    fechaVencimiento: { type: String, required: true },  // 'YYYY-MM-DD'
    monto: { type: Number, required: true, min: [0.01, 'El monto debe ser > 0'] },
    estado: { type: String, enum: ['Pendiente', 'Pagada'], default: 'Pendiente' },
  },
  { timestamps: true }
);

// Angular usa "id" (no "_id"): así el frontend casi no cambia
facturaSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => { ret.id = ret._id.toString(); delete ret._id; },
});

export default mongoose.model('Factura', facturaSchema);
