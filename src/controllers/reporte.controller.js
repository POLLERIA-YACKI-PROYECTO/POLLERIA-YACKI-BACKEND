// src/controllers/reporte.controller.js
const Venta = require('../models/Venta');
const db = require('../config/database');

// ============================================
// REPORTE GENERAL DE VENTAS
// ============================================
exports.getReporteVentas = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    console.log('=== REPORTE DE VENTAS ===');
    console.log('Fecha Inicio:', fechaInicio);
    console.log('Fecha Fin:', fechaFin);

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        error: 'Fecha inicio y fin son requeridas'
      });
    }

    const ventas = await Venta.findByFecha(fechaInicio, fechaFin);

    console.log(`${ventas.length} ventas encontradas`);

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

    // Parsear items
    ventas.forEach(v => {
      if (typeof v.items === 'string') {
        try {
          v.items = JSON.parse(v.items);
        } catch (e) {
          v.items = [];
        }
      }
    });

    const totalVentas = ventas.length;
    const totalRecaudado = ventas.reduce(
      (sum, v) => sum + parseFloat(v.total || 0),
      0
    );
    const promedio = totalVentas > 0 ? totalRecaudado / totalVentas : 0;

    // Por método de pago
    const porMetodoPago = {};
    ventas.forEach(v => {
      const metodo = v.metodo_pago || 'no_especificado';
      porMetodoPago[metodo] =
        (porMetodoPago[metodo] || 0) + parseFloat(v.total || 0);
    });

    // Por usuario
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

    // Top productos
    const productosVendidos = {};
    ventas.forEach(v => {
      let items = v.items || [];
      if (Array.isArray(items)) {
        items.forEach(item => {
          const nombre =
            item.nombre || item.producto_nombre || 'Producto';
          const cantidad = parseInt(item.cantidad) || 1;
          productosVendidos[nombre] =
            (productosVendidos[nombre] || 0) + cantidad;
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

// ============================================
// REPORTE DIARIO CAJERO
// ============================================
exports.getReporteDiarioCajero = async (req, res) => {
  try {
    const { fecha } = req.query;

    console.log('=== REPORTE DIARIO CAJERO ===');
    console.log('Fecha:', fecha);

    if (!fecha) {
      return res.status(400).json({ error: 'Fecha es requerida' });
    }

    const resumenDiario = await Venta.getResumenDiario(fecha);
    const ventas = await Venta.findByFecha(fecha, fecha);

    ventas.forEach(v => {
      if (typeof v.items === 'string') {
        try {
          v.items = JSON.parse(v.items);
        } catch (e) {
          v.items = [];
        }
      }
    });

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

// ============================================
// REPORTE POR CLIENTE
// ============================================
exports.getReportePorCliente = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    console.log('=== REPORTE POR CLIENTE ===');

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        error: 'Fecha inicio y fin son requeridas'
      });
    }

    const ventasPorCliente = await Venta.getVentasPorCliente(
      fechaInicio,
      fechaFin
    );

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

// ============================================
// REPORTE MOTORIZADA
// ============================================
exports.getReporteMotorizada = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    console.log('=== REPORTE MOTORIZADA ===');

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        error: 'Fecha inicio y fin son requeridas'
      });
    }

    const ventas = await Venta.findByFecha(fechaInicio, fechaFin);

    const ventasMotorizadas = ventas.filter(
      v =>
        v.tipo_entrega === 'delivery' ||
        v.tipo_entrega === 'motorizada' ||
        v.tipo === 'motorizada'
    );

    ventasMotorizadas.forEach(v => {
      if (typeof v.items === 'string') {
        try {
          v.items = JSON.parse(v.items);
        } catch (e) {
          v.items = [];
        }
      }
    });

    res.json({
      periodo: { fechaInicio, fechaFin },
      totalMotorizadas: ventasMotorizadas.length,
      totalRecaudado: ventasMotorizadas.reduce(
        (sum, v) => sum + parseFloat(v.total || 0),
        0
      ),
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

// ============================================
// REPORTE POR MESERO
// ============================================
exports.getReporteVentasPorMesero = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, usuarioId } = req.query;

    console.log('=== REPORTE POR MESERO ===');

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        error: 'Fecha inicio y fin son requeridas'
      });
    }

    let ventas = await Venta.findByFecha(fechaInicio, fechaFin);

    if (usuarioId) {
      ventas = ventas.filter(v => v.usuario_id === parseInt(usuarioId));
    }

    ventas.forEach(v => {
      if (typeof v.items === 'string') {
        try {
          v.items = JSON.parse(v.items);
        } catch (e) {
          v.items = [];
        }
      }
    });

    // Agrupar por usuario
    const porUsuario = {};
    ventas.forEach(v => {
      if (v.usuario_id) {
        if (!porUsuario[v.usuario_id]) {
          porUsuario[v.usuario_id] = {
            usuario_id: v.usuario_id,
            usuario_nombre:
              v.usuario_nombre_completo || v.usuario_nombre || 'Desconocido',
            rol: v.usuario_rol || 'mesero',
            total: 0,
            cantidad: 0
          };
        }
        porUsuario[v.usuario_id].total += parseFloat(v.total || 0);
        porUsuario[v.usuario_id].cantidad += 1;
      }
    });

    res.json({
      periodo: { fechaInicio, fechaFin },
      usuarios: Object.values(porUsuario),
      totalVentas: ventas.length,
      totalRecaudado: ventas.reduce(
        (sum, v) => sum + parseFloat(v.total || 0),
        0
      )
    });
  } catch (error) {
    console.error('Error en getReporteVentasPorMesero:', error);
    res.status(500).json({
      error: 'Error al generar reporte por mesero',
      detalle: error.message
    });
  }
};

// ============================================
// ✅ NUEVO: REPORTE SEMANAL
// Agrupa las ventas por semana y muestra desglose por día
// ============================================
exports.getReporteSemanal = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    console.log('=== REPORTE SEMANAL ===');
    console.log('Fecha Inicio:', fechaInicio);
    console.log('Fecha Fin:', fechaFin);

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        error: 'Fecha inicio y fin son requeridas'
      });
    }

    const ventas = await Venta.findByFecha(fechaInicio, fechaFin);

    // Parsear items
    ventas.forEach(v => {
      if (typeof v.items === 'string') {
        try {
          v.items = JSON.parse(v.items);
        } catch (e) {
          v.items = [];
        }
      }
    });

    // Función auxiliar: obtener lunes de la semana
    const obtenerLunes = (fecha) => {
      const d = new Date(fecha);
      const dia = d.getDay();
      const diff = dia === 0 ? -6 : 1 - dia;
      d.setDate(d.getDate() + diff);
      d.setHours(0, 0, 0, 0);
      return d;
    };

    // Función auxiliar: formatear fecha
    const formatearFecha = (fecha) => {
      const d = new Date(fecha);
      const dia = String(d.getDate()).padStart(2, '0');
      const mes = String(d.getMonth() + 1).padStart(2, '0');
      const anio = d.getFullYear();
      return `${dia}/${mes}/${anio}`;
    };

    // Función auxiliar: obtener número de semana ISO
    const obtenerNumeroSemana = (fecha) => {
      const d = new Date(Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()));
      const dia = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dia);
      const inicioAnio = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      return Math.ceil(((d - inicioAnio) / 86400000 + 1) / 7);
    };

    // Agrupar por semana
    const semanasMap = new Map();

    ventas.forEach(venta => {
      const fechaVenta = new Date(venta.fecha_venta || venta.created_at);
      if (isNaN(fechaVenta.getTime())) return;

      const lunes = obtenerLunes(fechaVenta);
      const claveSemana = `${lunes.getFullYear()}-${String(lunes.getMonth() + 1).padStart(2, '0')}-${String(lunes.getDate()).padStart(2, '0')}`;

      if (!semanasMap.has(claveSemana)) {
        // Crear los 7 días de la semana
        const dias = [];
        const nombresDias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
        const hoy = new Date();
        const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

        for (let i = 0; i < 7; i++) {
          const dia = new Date(lunes);
          dia.setDate(dia.getDate() + i);
          const diaClave = `${dia.getFullYear()}-${String(dia.getMonth() + 1).padStart(2, '0')}-${String(dia.getDate()).padStart(2, '0')}`;

          dias.push({
            dia: nombresDias[i],
            fecha: `${String(dia.getDate()).padStart(2, '0')}/${String(dia.getMonth() + 1).padStart(2, '0')}`,
            ventas: 0,
            total: 0,
            esHoy: diaClave === hoyStr
          });
        }

        const domingo = new Date(lunes);
        domingo.setDate(domingo.getDate() + 6);

        semanasMap.set(claveSemana, {
          numeroSemana: obtenerNumeroSemana(lunes),
          anio: lunes.getFullYear(),
          fechaDesde: formatearFecha(lunes),
          fechaHasta: formatearFecha(domingo),
          ventasLocal: 0,
          ventasMotorizado: 0,
          totalLocal: 0,
          totalMotorizado: 0,
          total: 0,
          dias,
          _fechaOrden: lunes.getTime()
        });
      }

      const semana = semanasMap.get(claveSemana);
      const total = parseFloat(venta.total) || 0;
      const tipo = String(venta.tipo_entrega || venta.tipo || 'local').toLowerCase();
      const esDelivery = tipo === 'delivery' || tipo === 'motorizada';

      // Sumar a la semana
      if (esDelivery) {
        semana.ventasMotorizado++;
        semana.totalMotorizado += total;
      } else {
        semana.ventasLocal++;
        semana.totalLocal += total;
      }
      semana.total += total;

      // Sumar al día correspondiente
      const diaSemana = fechaVenta.getDay(); // 0=Dom, 1=Lun...
      const indiceDia = diaSemana === 0 ? 6 : diaSemana - 1;
      if (semana.dias[indiceDia]) {
        semana.dias[indiceDia].ventas++;
        semana.dias[indiceDia].total += total;
      }
    });

    // Convertir a array ordenado
    const semanas = Array.from(semanasMap.values())
      .sort((a, b) => a._fechaOrden - b._fechaOrden)
      .map((s, idx) => {
        const { _fechaOrden, ...rest } = s;
        return {
          id: idx + 1,
          semana: `Semana ${s.numeroSemana} (${s.anio})`,
          fechaDesde: s.fechaDesde,
          fechaHasta: s.fechaHasta,
          ventasLocal: s.ventasLocal,
          ventasMotorizado: s.ventasMotorizado,
          totalLocal: s.totalLocal,
          totalMotorizado: s.totalMotorizado,
          total: s.total,
          dias: s.dias
        };
      });

    res.json({
      periodo: { fechaInicio, fechaFin },
      semanas,
      totalVentas: ventas.length,
      totalRecaudado: ventas.reduce(
        (sum, v) => sum + parseFloat(v.total || 0),
        0
      )
    });
  } catch (error) {
    console.error('Error en getReporteSemanal:', error);
    res.status(500).json({
      error: 'Error al generar reporte semanal',
      detalle: error.message
    });
  }
};