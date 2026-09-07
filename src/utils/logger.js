// src/utils/logger.js
const fs = require('fs');
const path = require('path');

// Crear directorio de logs si no existe
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Logger simple pero efectivo
const logger = {
  info: (message, data = null) => {
    const log = `[INFO] ${new Date().toISOString()} - ${message}`;
    console.log(log);
    if (data) console.log(JSON.stringify(data, null, 2));
    fs.appendFileSync(path.join(logDir, 'info.log'), log + '\n');
  },
  
  error: (message, error = null) => {
    const log = `[ERROR] ${new Date().toISOString()} - ${message}`;
    console.error(log);
    if (error) {
      console.error(error);
      fs.appendFileSync(path.join(logDir, 'error.log'), log + '\n' + JSON.stringify(error, null, 2) + '\n');
    } else {
      fs.appendFileSync(path.join(logDir, 'error.log'), log + '\n');
    }
  },
  
  warn: (message) => {
    const log = `[WARN] ${new Date().toISOString()} - ${message}`;
    console.warn(log);
    fs.appendFileSync(path.join(logDir, 'warn.log'), log + '\n');
  },
  
  debug: (message, data = null) => {
    if (process.env.NODE_ENV !== 'production') {
      const log = `[DEBUG] ${new Date().toISOString()} - ${message}`;
      console.debug(log);
      if (data) console.debug(JSON.stringify(data, null, 2));
      fs.appendFileSync(path.join(logDir, 'debug.log'), log + '\n');
    }
  }
};

module.exports = { logger };