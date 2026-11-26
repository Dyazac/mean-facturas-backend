import { Router } from 'express';
import Factura from '../models/factura.model.js';

const router = Router();
const DIA_MS = 1000 * 60 * 60 * 24;

// --- Reglas de negocio en el SERVIDOR (como en la guía de Inventario) ---
function diasParaVencer(fechaVencimiento) {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const venc = new Date(fechaVencimiento + 'T00:00:00');
  return Math.ceil((venc - hoy) / DIA_MS);
}

function validar(body) {
  const proveedor = String(body.proveedor ?? '').trim();
  const monto = Number(body.monto);
  const { fechaEmision, fechaVencimiento } = body;
  const estado = body.estado ?? 'Pendiente';
  if (!body.uid) return 'Falta el uid del usuario';
  if (!proveedor) return 'El proveedor es obligatorio';
  if (!fechaEmision || !fechaVencimiento) return 'Las fechas son obligatorias';
  if (!(monto > 0)) return 'El monto debe ser mayor que 0';
  if (!['Pendiente', 'Pagada'].includes(estado)) return 'Estado inválido';
  if (fechaVencimiento < fechaEmision) return 'El vencimiento no puede ser anterior a la emisión';
  return null;
}

const limpiar = (b) => ({
  uid: b.uid,
  proveedor: String(b.proveedor).trim(),
  fechaEmision: b.fechaEmision,
  fechaVencimiento: b.fechaVencimiento,
  monto: Number(b.monto),
  estado: b.estado ?? 'Pendiente',
});

// GET /api/facturas?uid=XXX  -> facturas del usuario + resumen calculado
router.get('/', async (req, res) => {
  try {
    const { uid } = req.query;
    if (!uid) return res.status(400).json({ error: 'Falta el parámetro uid' });
    const facturas = await Factura.find({ uid }).sort({ fechaVencimiento: 1 });
    res.json(facturas);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/facturas/resumen?uid=XXX -> total pendiente, vencidas, conteo por estado
router.get('/resumen', async (req, res) => {
  try {
    const { uid } = req.query;
    if (!uid) return res.status(400).json({ error: 'Falta el parámetro uid' });
    const facturas = await Factura.find({ uid });
    const pendientes = facturas.filter(f => f.estado === 'Pendiente');
    res.json({
      totalPendiente: pendientes.reduce((a, f) => a + f.monto, 0),
      cantidadPendientes: pendientes.length,
      cantidadPagadas: facturas.length - pendientes.length,
      cantidadVencidas: pendientes.filter(f => diasParaVencer(f.fechaVencimiento) < 0).length,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/facturas
router.post('/', async (req, res) => {
  const error = validar(req.body);
  if (error) return res.status(400).json({ error });
  try {
    const creada = await Factura.create(limpiar(req.body));
    res.status(201).json(creada);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/facturas/:id
router.put('/:id', async (req, res) => {
  const error = validar(req.body);
  if (error) return res.status(400).json({ error });
  try {
    const act = await Factura.findOneAndUpdate(
      { _id: req.params.id, uid: req.body.uid }, // solo el dueño la edita
      limpiar(req.body),
      { new: true, runValidators: true }
    );
    if (!act) return res.status(404).json({ error: 'Factura no encontrada' });
    res.json(act);
  } catch (e) { res.status(400).json({ error: 'ID inválido o ' + e.message }); }
});

// DELETE /api/facturas/:id?uid=XXX
router.delete('/:id', async (req, res) => {
  try {
    const del = await Factura.findOneAndDelete({ _id: req.params.id, uid: req.query.uid });
    if (!del) return res.status(404).json({ error: 'Factura no encontrada' });
    res.status(204).end();
  } catch (e) { res.status(400).json({ error: 'ID inválido' }); }
});

export default router;
