// src\controllers\reporte.controller.js
const Venta = require('../models/Venta');
const Usuario = require('../models/Usuario');

exports.getReporteVentas = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    
    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({ 
        error: 'Fecha inicio y fin son requeridas' 
      });
    }

    const ventas = await Venta.findByFecha(fechaInicio, fechaFin);
    
    if (!ventas || ventas.length === 0) {
      return res.json({
        resumen: { 
          totalVentas: 0, 
          totalRecaudado: 0, 
          promedio: 0 
        },
        porMetodoPago: {},
        porUsuario: [],
        topProductos: [],
        detalle: []
      });
    }

    // Calcular resumen general
    const totalVentas = ventas.length;
    const totalRecaudado = ventas.reduce((sum, v) => sum + parseFloat(v.total || 0), 0);
    const promedio = totalVentas > 0 ? totalRecaudado / totalVentas : 0;

    // Agrupar por método de pago
    const porMetodoPago = {};
    ventas.forEach(v => {
      const metodo = v.metodo_pago || 'no_especificado';
      porMetodoPago[metodo] = (porMetodoPago[metodo] || 0) + parseFloat(v.total || 0);
    });

    // Agrupar por usuario
    const porUsuario = {};
    ventas.forEach(v => {
      if (v.usuario_id) {
        if (!porUsuario[v.usuario_id]) {
          porUsuario[v.usuario_id] = {
            usuario_id: v.usuario_id,
            usuario_nombre: v.usuario_nombre || 'Desconocido',
            rol: v.usuario_rol || 'desconocido',
            total: 0,
            cantidad: 0
          };
        }
        porUsuario[v.usuario_id].total += parseFloat(v.total || 0);
        porUsuario[v.usuario_id].cantidad += 1;
      }
    });

    // Calcular top productos
    const productosVendidos = {};
    ventas.forEach(v => {
      let items = [];
      try {
        items = typeof v.items === 'string' ? JSON.parse(v.items) : (v.items || []);
      } catch (e) {
        items = [];
      }
      
      if (Array.isArray(items)) {
        items.forEach(item => {
          const nombre = item.nombre || item.producto_nombre || 'Producto';
          const cantidad = parseInt(item.cantidad) || 1;
          productosVendidos[nombre] = (productosVendidos[nombre] || 0) + cantidad;
        });
      }
    });

    const topProductos = Object.entries(productosVendidos)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }));

    res.json({
      resumen: { totalVentas, totalRecaudado, promedio },
      porMetodoPago,
      porUsuario: Object.values(porUsuario),
      topProductos,
      detalle: ventas
    });

  } catch (error) {
    console.error('Error en getReporteVentas:', error);
    res.status(500).json({ 
      error: 'Error al generar reporte de ventas',
      detalle: error.message 
    });
  }
};

exports.getReporteDiarioCajero = async (req, res) => {
  try {
    const { fecha } = req.query;
    
    if (!fecha) {
      return res.status(400).json({ error: 'Fecha es requerida' });
    }

    // Obtener resumen diario
    const resumenDiario = await Venta.getResumenDiario(fecha);
    
    // Obtener ventas del día
    const ventas = await Venta.findByFecha(fecha, fecha);
    
    // Agrupar por usuario
    const porUsuario = {};
    ventas.forEach(v => {
      if (v.usuario_id) {
        if (!porUsuario[v.usuario_id]) {
          porUsuario[v.usuario_id] = {
            usuario_id: v.usuario_id,
            usuario_nombre: v.usuario_nombre || 'Desconocido',
            rol: v.usuario_rol || 'desconocido',
            total: 0,
            cantidad: 0,
            ventas: []
          };
        }
        porUsuario[v.usuario_id].total += parseFloat(v.total || 0);
        porUsuario[v.usuario_id].cantidad += 1;
        porUsuario[v.usuario_id].ventas.push(v);
      }
    });

    res.json({
      fecha,
      resumen: {
        totalVentas: resumenDiario.total_ventas || 0,
        totalRecaudado: resumenDiario.total_recaudado || 0,
        promedio: resumenDiario.promedio || 0,
        porMetodoPago: {
          efectivo: resumenDiario.total_efectivo || 0,
          tarjeta: resumenDiario.total_tarjeta || 0,
          yape: resumenDiario.total_yape || 0,
          plin: resumenDiario.total_plin || 0
        }
      },
      porUsuario: Object.values(porUsuario)
    });

  } catch (error) {
    console.error('Error en getReporteDiarioCajero:', error);
    res.status(500).json({ 
      error: 'Error al generar reporte diario de cajero',
      detalle: error.message 
    });
  }
};

// Endpoint para reporte de ventas por cliente
exports.getReportePorCliente = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    
    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({ error: 'Fecha inicio y fin son requeridas' });
    }

    const ventasPorCliente = await Venta.getVentasPorCliente(fechaInicio, fechaFin);
    
    res.json({
      periodo: { fechaInicio, fechaFin },
      clientes: ventasPorCliente
    });

  } catch (error) {
    console.error('Error en getReportePorCliente:', error);
    res.status(500).json({ 
      error: 'Error al generar reporte por cliente',
      detalle: error.message 
    });
  }
};

// Endpoint para ventas motorizadas
exports.getReporteMotorizada = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    
    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({ error: 'Fecha inicio y fin son requeridas' });
    }

    const ventas = await Venta.findByFecha(fechaInicio, fechaFin);
    
    // Filtrar ventas motorizadas
    const ventasMotorizadas = ventas.filter(v => 
      v.tipo_entrega === 'motorizada' || v.motorizado_id || v.tipo === 'motorizada'
    );

    res.json({
      periodo: { fechaInicio, fechaFin },
      totalMotorizadas: ventasMotorizadas.length,
      totalRecaudado: ventasMotorizadas.reduce((sum, v) => sum + parseFloat(v.total || 0), 0),
      detalle: ventasMotorizadas
    });

  } catch (error) {
    console.error('Error en getReporteMotorizada:', error);
    res.status(500).json({ 
      error: 'Error al generar reporte motorizada',
      detalle: error.message 
    });
  }
};