// src/__tests__/utils/logger.test.js

// ✅ Mockear fs AL PRINCIPIO (antes de importar logger)
jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
  mkdirSync: jest.fn(),
  appendFileSync: jest.fn()
}));

const fs = require('fs');

// ✅ Importar logger DESPUÉS del mock
const { logger } = require('../../utils/logger');

describe('Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // ✅ Asegurar que existsSync retorne true
    fs.existsSync.mockReturnValue(true);
  });

  // ============================================
  // LOGGER INFO
  // ============================================
  describe('logger.info', () => {
    it('debe llamar a console.log con el mensaje', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      logger.info('Mensaje de prueba');
      
      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleSpy.mock.calls[0][0]).toContain('[INFO]');
      expect(consoleSpy.mock.calls[0][0]).toContain('Mensaje de prueba');
      
      consoleSpy.mockRestore();
    });

    it('debe escribir en el archivo de log', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      logger.info('Mensaje de prueba');
      
      expect(fs.appendFileSync).toHaveBeenCalled();
      expect(fs.appendFileSync.mock.calls[0][0]).toContain('info.log');
      
      consoleSpy.mockRestore();
    });

    it('debe incluir datos si se proporcionan', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const data = { userId: 1, action: 'login' };
      
      logger.info('Usuario logueado', data);
      
      // console.log se llama 2 veces: mensaje + datos
      expect(consoleSpy).toHaveBeenCalledTimes(2);
      
      consoleSpy.mockRestore();
    });

    it('debe incluir timestamp en el mensaje', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      logger.info('Test');
      
      const mensaje = consoleSpy.mock.calls[0][0];
      expect(mensaje).toContain('[INFO]');
      expect(mensaje).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      
      consoleSpy.mockRestore();
    });
  });

  // ============================================
  // LOGGER ERROR
  // ============================================
  describe('logger.error', () => {
    it('debe llamar a console.error', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      logger.error('Error de prueba');
      
      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleSpy.mock.calls[0][0]).toContain('[ERROR]');
      
      consoleSpy.mockRestore();
    });

    it('debe escribir en error.log', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      logger.error('Error de prueba');
      
      expect(fs.appendFileSync).toHaveBeenCalled();
      const logFile = fs.appendFileSync.mock.calls[0][0];
      expect(logFile).toContain('error.log');
      
      consoleSpy.mockRestore();
    });

    it('debe incluir el error si se proporciona', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Test error');
      
      logger.error('Algo falló', error);
      
      expect(consoleSpy).toHaveBeenCalledTimes(2);
      expect(consoleSpy.mock.calls[1][0]).toBe(error);
      
      consoleSpy.mockRestore();
    });

    it('debe manejar error sin stack trace', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = { message: 'Error sin stack' };
      
      expect(() => logger.error('Error', error)).not.toThrow();
      
      consoleSpy.mockRestore();
    });
  });

  // ============================================
  // LOGGER WARN
  // ============================================
  describe('logger.warn', () => {
    it('debe llamar a console.warn', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      logger.warn('Advertencia');
      
      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleSpy.mock.calls[0][0]).toContain('[WARN]');
      
      consoleSpy.mockRestore();
    });

    it('debe escribir en warn.log', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      logger.warn('Advertencia');
      
      expect(fs.appendFileSync).toHaveBeenCalled();
      const logFile = fs.appendFileSync.mock.calls[0][0];
      expect(logFile).toContain('warn.log');
      
      consoleSpy.mockRestore();
    });
  });

  // ============================================
  // LOGGER DEBUG
  // ============================================
  describe('logger.debug', () => {
    it('debe llamar a console.debug en modo no producción', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const consoleSpy = jest.spyOn(console, 'debug').mockImplementation();
      
      logger.debug('Debug message');
      
      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleSpy.mock.calls[0][0]).toContain('[DEBUG]');
      
      consoleSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });

    it('NO debe llamar a console.debug en producción', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const consoleSpy = jest.spyOn(console, 'debug').mockImplementation();
      
      logger.debug('Debug message');
      
      expect(consoleSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });

    it('debe incluir datos si se proporcionan', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const consoleSpy = jest.spyOn(console, 'debug').mockImplementation();
      
      logger.debug('Debug', { key: 'value' });
      
      expect(consoleSpy).toHaveBeenCalledTimes(2);
      
      consoleSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });
  });
});