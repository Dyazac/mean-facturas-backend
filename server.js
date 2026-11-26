import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import facturasRoutes from './routes/facturas.routes.js';

const app = express();
const PORT = process.env.PORT || 4000;

// CORS: debe ir antes de las rutas
app.use(cors({ origin: process.env.FRONTEND_URL || true }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/', (_req, res) => res.json({ ok: true, api: '/api/facturas' }));
app.use('/api/facturas', facturasRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('conectado');
    app.listen(PORT, () => console.log(`API en puerto ${PORT}`));
  })
  .catch(err => { console.error('Error de MongoDB:', err.message); process.exit(1); });
