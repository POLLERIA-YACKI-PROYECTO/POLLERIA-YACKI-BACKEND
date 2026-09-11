// src/__tests__/middleware/auth.test.js
const jwt = require('jsonwebtoken');

jest.mock('dotenv', () => ({
  config: jest.fn()
}));

const { verifyToken, isAdmin, isMesero } = require('../../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'polleria-yacky-secret-key-2026';

describe('Auth Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      headers: {},
      userId: null,
      userRol: null,
      userDni: null,
      user: null,
      token: null
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();
  });

  // ============================================
  // VERIFY TOKEN - CASOS EXITOSOS
  // ============================================
  describe('verifyToken - Casos exitosos', () => {
    it('debe permitir acceso con token válido de admin', () => {
      const payload = { id: 1, dni: '12345678', rol: 'admin' };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
      mockReq.headers.authorization = `Bearer ${token}`;

      verifyToken(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockReq.userId).toBe(1);
      expect(mockReq.userRol).toBe('admin');
      expect(mockReq.userDni).toBe('12345678');
      
      // ✅ Verificar propiedades específicas (JWT agrega iat y exp automáticamente)
      expect(mockReq.user).toHaveProperty('id', 1);
      expect(mockReq.user).toHaveProperty('dni', '12345678');
      expect(mockReq.user).toHaveProperty('rol', 'admin');
      expect(mockReq.user).toHaveProperty('iat');
      expect(mockReq.user).toHaveProperty('exp');
      
      expect(mockReq.token).toBe(token);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('debe permitir acceso con token de mesero', () => {
      const payload = { id: 3, dni: '11111111', rol: 'mesero' };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
      mockReq.headers.authorization = `Bearer ${token}`;

      verifyToken(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockReq.userRol).toBe('mesero');
    });

    it('debe permitir acceso con token de cajero', () => {
      const payload = { id: 2, dni: '87654321', rol: 'cajero' };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
      mockReq.headers.authorization = `Bearer ${token}`;

      verifyToken(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockReq.userRol).toBe('cajero');
    });
  });

  // ============================================
  // VERIFY TOKEN - ERRORES DE FORMATO
  // ============================================
  describe('verifyToken - Errores de formato', () => {
    it('debe retornar 401 si no hay header Authorization', () => {
      verifyToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token no proporcionado o formato inválido'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe retornar 401 si el header no empieza con "Bearer "', () => {
      mockReq.headers.authorization = 'Token abc123';

      verifyToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe retornar 401 si el header está vacío', () => {
      mockReq.headers.authorization = '';

      verifyToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe retornar 401 si el header es solo "Bearer"', () => {
      mockReq.headers.authorization = 'Bearer';

      verifyToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // VERIFY TOKEN - ERRORES DE JWT
  // ============================================
  describe('verifyToken - Errores de JWT', () => {
    it('debe retornar 401 si el token es inválido (firma incorrecta)', () => {
      const payload = { id: 1, dni: '12345678', rol: 'admin' };
      const token = jwt.sign(payload, 'firma-incorrecta', { expiresIn: '7d' });
      mockReq.headers.authorization = `Bearer ${token}`;

      verifyToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      // ✅ El middleware traduce el código a INVALID_SIGNATURE
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Firma de token inválida',
          code: 'INVALID_SIGNATURE'
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe retornar 401 si el token está expirado', () => {
      const payload = { id: 1, dni: '12345678', rol: 'admin' };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '-1s' });
      mockReq.headers.authorization = `Bearer ${token}`;

      verifyToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      // ✅ El middleware traduce el código a TOKEN_EXPIRED
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Token expirado. Por favor, inicie sesión nuevamente',
          code: 'TOKEN_EXPIRED'
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe retornar 401 si el token está malformado', () => {
      mockReq.headers.authorization = 'Bearer token.malformado.aqui';

      verifyToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      // ✅ Verificar que devuelve un error 401 (cualquier formato)
      expect(mockRes.json).toHaveBeenCalled();
      const respuesta = mockRes.json.mock.calls[0][0];
      expect(respuesta.success).toBe(false);
      expect(respuesta).toHaveProperty('error');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe retornar 401 si el token es un string random', () => {
      mockReq.headers.authorization = 'Bearer abc123xyz';

      verifyToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // IS ADMIN
  // ============================================
  describe('isAdmin - Casos exitosos', () => {
    it('debe permitir acceso a admin', () => {
      mockReq.userRol = 'admin';
      isAdmin(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('debe permitir acceso a cajero', () => {
      mockReq.userRol = 'cajero';
      isAdmin(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  describe('isAdmin - Casos denegados', () => {
    it('debe denegar acceso a mesero', () => {
      mockReq.userRol = 'mesero';
      isAdmin(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe denegar acceso a cocinero', () => {
      mockReq.userRol = 'cocinero';
      isAdmin(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe denegar acceso a delivery', () => {
      mockReq.userRol = 'delivery';
      isAdmin(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe denegar acceso si no hay rol', () => {
      mockReq.userRol = undefined;
      isAdmin(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe denegar acceso si el rol es null', () => {
      mockReq.userRol = null;
      isAdmin(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe denegar acceso con rol vacío', () => {
      mockReq.userRol = '';
      isAdmin(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // IS MESERO
  // ============================================
  describe('isMesero', () => {
    it('debe permitir acceso a mesero', () => {
      mockReq.userRol = 'mesero';
      isMesero(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('debe denegar acceso a admin', () => {
      mockReq.userRol = 'admin';
      isMesero(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe denegar acceso a cajero', () => {
      mockReq.userRol = 'cajero';
      isMesero(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe denegar acceso si no hay rol', () => {
      mockReq.userRol = undefined;
      isMesero(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});