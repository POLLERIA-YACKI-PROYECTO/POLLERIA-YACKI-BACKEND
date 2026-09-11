// src/__tests__/setup.js
// ============================================
// SETUP GLOBAL DE JEST (setupFilesAfterEach)
// ============================================
// Este archivo se ejecuta DESPUÉS del framework.
// ✅ Aquí SÍ puedes usar afterEach, describe, it, expect

jest.setTimeout(30000);

if (process.env.NODE_ENV === 'test') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

afterEach(() => {
  jest.clearAllMocks();
});