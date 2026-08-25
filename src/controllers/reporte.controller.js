const Venta = require('../models/Venta');

exports.getReporteVentas = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({ error: 'Fecha inicio y fin son requeridas' });
    }
    const ventas = await Venta.findByFecha(fechaInicio, fechaFin);
    const totalVentas = ventas.length;
    const totalRecaudado = ventas.reduce((sum, v) => sum + v.total, 0);
    const porMetodoPago = {};
    ventas.forEach(v => {
      porMetodoPago[v.metodo_pago] = (porMetodoPago[v.metodo_pago] || 0) + v.total;
    });
    const productosVendidos = {};
    ventas.forEach(v => {
      const items = typeof v.items === 'string' ? JSON.parse(v.items) : v.items;
      items.forEach(item => {
        productosVendidos[item.nombre] = (productosVendidos[item.nombre] || 0) + item.cantidad;
      });
    });
    const topProductos = Object.entries(productosVendidos)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }));
    res.json({
      resumen: { totalVentas, totalRecaudado, promedio: totalVentas > 0 ? totalRecaudado / totalVentas : 0 },
      porMetodoPago,
      topProductos,
      detalle: ventas
    });
  } catch (error) {
    console.error('Error en getReporteVentas:', error);
    res.status(500).json({ error: 'Error al generar reporte de ventas' });
  }
};

exports.getReporteDiarioCajero = async (req, res) => {
  try {
    const { fecha } = req.query;
    if (!fecha) {
      return res.status(400).json({ error: 'Fecha es requerida' });
    }
    const ventas = await Venta.findByFecha(fecha, fecha);
    const porUsuario = {};
    ventas.forEach(v => {
      if (!porUsuario[v.usuario_id]) {
        porUsuario[v.usuario_id] = { usuario_id: v.usuario_id, usuario_nombre: v.usuario_nombre || 'Desconocido', total: 0, cantidad: 0 };
      }
      porUsuario[v.usuario_id].total += v.total;
      porUsuario[v.usuario_id].cantidad += 1;
    });
    const resumenDiario = await Venta.getResumenDiario(fecha);
    res.json({ fecha, resumen: resumenDiario, porUsuario: Object.values(porUsuario) });
  } catch (error) {
    console.error('Error en getReporteDiarioCajero:', error);
    res.status(500).json({ error: 'Error al generar reporte diario de cajero' });
  }
};