// src/__tests__/validations/validations.test.js
const schemas = require('../../validations/validations');

describe('Validations Schemas', () => {
  // ============================================
  // SCHEMA: USUARIO
  // ============================================
  describe('usuario schema', () => {
    const usuarioValido = {
      nombre: 'Juan',
      apellido: 'Perez',
      dni: '12345678',
      email: 'juan@test.com',
      telefono: '987654321',
      rol: 'mesero',
      password: '123456',
      salario: 2500
    };

    it('debe validar un usuario correcto', () => {
      const { error } = schemas.usuario.validate(usuarioValido);
      expect(error).toBeUndefined();
    });

    it('debe rechazar si falta el nombre', () => {
      const { error } = schemas.usuario.validate({ ...usuarioValido, nombre: undefined });
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('nombre');
    });

    it('debe rechazar si el nombre es muy corto', () => {
      const { error } = schemas.usuario.validate({ ...usuarioValido, nombre: 'J' });
      expect(error).toBeDefined();
    });

    it('debe rechazar si el DNI no tiene 8 dígitos', () => {
      const { error } = schemas.usuario.validate({ ...usuarioValido, dni: '123' });
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('dni');
    });

    it('debe rechazar si el DNI tiene letras', () => {
      const { error } = schemas.usuario.validate({ ...usuarioValido, dni: '1234567a' });
      expect(error).toBeDefined();
    });

    it('debe rechazar si el email es inválido', () => {
      const { error } = schemas.usuario.validate({ ...usuarioValido, email: 'no-es-email' });
      expect(error).toBeDefined();
    });

    it('debe rechazar si el teléfono no tiene 9 dígitos', () => {
      const { error } = schemas.usuario.validate({ ...usuarioValido, telefono: '123' });
      expect(error).toBeDefined();
    });

    it('debe rechazar si el rol es inválido', () => {
      const { error } = schemas.usuario.validate({ ...usuarioValido, rol: 'rol_invalido' });
      expect(error).toBeDefined();
    });

    it('debe rechazar si la contraseña es muy corta', () => {
      const { error } = schemas.usuario.validate({ ...usuarioValido, password: '123' });
      expect(error).toBeDefined();
    });

    it('debe permitir apellido, email, telefono y salario nulos', () => {
      const { error } = schemas.usuario.validate({
        nombre: 'Juan',
        dni: '12345678',
        password: '123456',
        apellido: null,
        email: null,
        telefono: null,
        salario: null
      });
      expect(error).toBeUndefined();
    });
  });

  // ============================================
  // SCHEMA: CLIENTE
  // ============================================
  describe('cliente schema', () => {
    const clienteValido = {
      nombre: 'Maria',
      apellido: 'Garcia',
      dni: '87654321',
      email: 'maria@test.com',
      telefono: '987654321',
      direccion: 'Av. Principal 123'
    };

    it('debe validar un cliente correcto', () => {
      const { error } = schemas.cliente.validate(clienteValido);
      expect(error).toBeUndefined();
    });

    it('debe rechazar si falta el nombre', () => {
      const { error } = schemas.cliente.validate({ ...clienteValido, nombre: undefined });
      expect(error).toBeDefined();
    });

    it('debe rechazar si el DNI no tiene 8 dígitos', () => {
      const { error } = schemas.cliente.validate({ ...clienteValido, dni: '123' });
      expect(error).toBeDefined();
    });

    it('debe permitir DNI nulo', () => {
      const { error } = schemas.cliente.validate({ ...clienteValido, dni: null });
      expect(error).toBeUndefined();
    });

    it('debe rechazar email inválido', () => {
      const { error } = schemas.cliente.validate({ ...clienteValido, email: 'invalido' });
      expect(error).toBeDefined();
    });

    it('debe rechazar dirección muy larga', () => {
      const { error } = schemas.cliente.validate({
        ...clienteValido,
        direccion: 'x'.repeat(256)
      });
      expect(error).toBeDefined();
    });
  });

  // ============================================
  // SCHEMA: PRODUCTO
  // ============================================
  describe('producto schema', () => {
    const productoValido = {
      categoria_id: 1,
      nombre: '1/4 de pollo',
      precio: 12.00,
      descripcion: 'Cuarto de pollo',
      stock: 50
    };

    it('debe validar un producto correcto', () => {
      const { error } = schemas.producto.validate(productoValido);
      expect(error).toBeUndefined();
    });

    it('debe rechazar si falta categoria_id', () => {
      const { error } = schemas.producto.validate({ ...productoValido, categoria_id: undefined });
      expect(error).toBeDefined();
    });

    it('debe rechazar si el precio es negativo', () => {
      const { error } = schemas.producto.validate({ ...productoValido, precio: -1 });
      expect(error).toBeDefined();
    });

    it('debe rechazar si el stock es negativo', () => {
      const { error } = schemas.producto.validate({ ...productoValido, stock: -1 });
      expect(error).toBeDefined();
    });

    it('debe aplicar defaults correctamente', () => {
      const { value, error } = schemas.producto.validate({
        categoria_id: 1,
        nombre: 'Test',
        precio: 10
      });
      expect(error).toBeUndefined();
      expect(value.stock).toBe(0);
      expect(value.stock_minimo).toBe(5);
      expect(value.unidad_medida).toBe('unidad');
      expect(value.disponible).toBe(true);
      expect(value.agotado).toBe(false);
    });
  });

  // ============================================
  // SCHEMA: PEDIDO
  // ============================================
  describe('pedido schema', () => {
    const pedidoValido = {
      items: [
        { id: 1, nombre: '1/4 pollo', cantidad: 2, precio: 12, subtotal: 24 }
      ],
      total: 28.32,
      tipo_entrega: 'local'
    };

    it('debe validar un pedido correcto', () => {
      const { error } = schemas.pedido.validate(pedidoValido);
      expect(error).toBeUndefined();
    });

    it('debe rechazar si no hay items', () => {
      const { error } = schemas.pedido.validate({ ...pedidoValido, items: [] });
      expect(error).toBeDefined();
    });

    it('debe rechazar items sin id', () => {
      const { error } = schemas.pedido.validate({
        ...pedidoValido,
        items: [{ nombre: 'Test', cantidad: 1, precio: 10 }]
      });
      expect(error).toBeDefined();
    });

    it('debe rechazar cantidad 0', () => {
      const { error } = schemas.pedido.validate({
        ...pedidoValido,
        items: [{ id: 1, nombre: 'Test', cantidad: 0, precio: 10 }]
      });
      expect(error).toBeDefined();
    });

    it('debe rechazar tipo_entrega inválido', () => {
      const { error } = schemas.pedido.validate({ ...pedidoValido, tipo_entrega: 'invalido' });
      expect(error).toBeDefined();
    });

    it('debe aplicar defaults correctamente', () => {
      const { value, error } = schemas.pedido.validate(pedidoValido);
      expect(error).toBeUndefined();
      expect(value.tipo).toBe('local');
      expect(value.pagado).toBe(false);
    });
  });

  // ============================================
  // SCHEMA: LOGIN
  // ============================================
  describe('login schema', () => {
    it('debe validar DNI de 8 dígitos', () => {
      const { error } = schemas.login.validate({ dni: '12345678' });
      expect(error).toBeUndefined();
    });

    it('debe rechazar DNI de menos dígitos', () => {
      const { error } = schemas.login.validate({ dni: '123' });
      expect(error).toBeDefined();
    });

    it('debe rechazar DNI con letras', () => {
      const { error } = schemas.login.validate({ dni: '1234567a' });
      expect(error).toBeDefined();
    });
  });

  // ============================================
  // SCHEMA: PAGO
  // ============================================
  describe('pago schema', () => {
    it('debe aceptar métodos de pago válidos', () => {
      const metodos = ['efectivo', 'tarjeta', 'yape', 'plin', 'transferencia'];
      metodos.forEach(metodo => {
        const { error } = schemas.pago.validate({ metodo_pago: metodo });
        expect(error).toBeUndefined();
      });
    });

    it('debe rechazar método de pago inválido', () => {
      const { error } = schemas.pago.validate({ metodo_pago: 'bitcoin' });
      expect(error).toBeDefined();
    });

    it('debe rechazar si falta metodo_pago', () => {
      const { error } = schemas.pago.validate({});
      expect(error).toBeDefined();
    });
  });

  // ============================================
  // SCHEMA: ESTADO
  // ============================================
  describe('estado schema', () => {
    it('debe aceptar estados válidos', () => {
      const estados = ['pendiente', 'preparando', 'listo', 'entregado', 'cancelado'];
      estados.forEach(estado => {
        const { error } = schemas.estado.validate({ estado });
        expect(error).toBeUndefined();
      });
    });

    it('debe rechazar estado inválido', () => {
      const { error } = schemas.estado.validate({ estado: 'invalido' });
      expect(error).toBeDefined();
    });
  });

  // ============================================
  // SCHEMA: CONFIGURACION
  // ============================================
  describe('configuracion schema', () => {
    it('debe validar un valor correcto', () => {
      const { error } = schemas.configuracion.validate({ valor: 'Doña Yacki' });
      expect(error).toBeUndefined();
    });

    it('debe rechazar si falta valor', () => {
      const { error } = schemas.configuracion.validate({});
      expect(error).toBeDefined();
    });
  });

  // ============================================
  // SCHEMA: MESA
  // ============================================
  describe('mesa schema', () => {
    it('debe validar una mesa correcta', () => {
      const { error } = schemas.mesa.validate({ numero: 1, capacidad: 4 });
      expect(error).toBeUndefined();
    });

    it('debe rechazar número negativo', () => {
      const { error } = schemas.mesa.validate({ numero: -1 });
      expect(error).toBeDefined();
    });

    it('debe aplicar capacidad por defecto', () => {
      const { value, error } = schemas.mesa.validate({ numero: 1 });
      expect(error).toBeUndefined();
      expect(value.capacidad).toBe(4);
    });

    it('debe rechazar capacidad mayor a 20', () => {
      const { error } = schemas.mesa.validate({ numero: 1, capacidad: 25 });
      expect(error).toBeDefined();
    });
  });

  // ============================================
  // SCHEMA: OCUPAR MESA
  // ============================================
  describe('ocuparMesa schema', () => {
    it('debe validar ocupación correcta', () => {
      const { error } = schemas.ocuparMesa.validate({
        cliente: 'Juan Perez',
        cantidad_personas: 4
      });
      expect(error).toBeUndefined();
    });

    it('debe rechazar si falta cliente', () => {
      const { error } = schemas.ocuparMesa.validate({ cantidad_personas: 2 });
      expect(error).toBeDefined();
    });

    it('debe rechazar cantidad_personas mayor a 20', () => {
      const { error } = schemas.ocuparMesa.validate({
        cliente: 'Juan',
        cantidad_personas: 25
      });
      expect(error).toBeDefined();
    });

    it('debe aplicar default cantidad_personas = 1', () => {
      const { value, error } = schemas.ocuparMesa.validate({ cliente: 'Juan' });
      expect(error).toBeUndefined();
      expect(value.cantidad_personas).toBe(1);
    });
  });
});