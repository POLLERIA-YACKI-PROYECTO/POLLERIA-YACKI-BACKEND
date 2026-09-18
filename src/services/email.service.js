// src/services/email.service.js
const nodemailer = require('nodemailer');
const { logger } = require('../utils/logger');
require('dotenv').config();

// Transporter reutilizable con timeouts para evitar cuelgues
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false, // true para 465, false para 587/25
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000
});

// Verificar conexion al iniciar (util para depurar)
transporter.verify((err) => {
  if (err) {
    logger.error('Error configurando transporter de correo: ' + err.message);
  } else {
    logger.info('Servidor de correo listo para enviar');
  }
});

/**
 * Envia el codigo de verificacion al cliente
 */
exports.enviarCodigoVerificacion = async ({ to, nombre, codigo }) => {
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; }
      .card { max-width: 520px; margin: 0 auto; background: #fff; border-radius: 12px;
              overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
      .header { background: #c5302a; color: #fff; padding: 24px; text-align: center; }
      .header h1 { margin: 0; font-size: 22px; }
      .body { padding: 30px; color: #333; line-height: 1.6; }
      .code { display: block; font-size: 38px; font-weight: bold; letter-spacing: 8px;
              text-align: center; background: #fff3f3; color: #c5302a;
              padding: 18px; border-radius: 10px; margin: 24px 0;
              border: 2px dashed #c5302a; }
      .spam-notice { font-size: 13px; color: #666; margin-top: 24px;
                     padding: 12px; background: #fff8e1; border-left: 3px solid #f9a825;
                     border-radius: 6px; }
      .footer { text-align: center; font-size: 12px; color: #999; padding: 16px; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="header">
        <h1>Polleria Dona Yacki</h1>
      </div>
      <div class="body">
        <p>Hola <strong>${nombre}</strong>,</p>
        <p>Gracias por registrarte. Usa este codigo para verificar tu correo:</p>
        <span class="code">${codigo}</span>
        <p>El codigo expira en <strong>15 minutos</strong>.</p>
        <p>Si no solicitaste este registro, ignora este mensaje.</p>

        <div class="spam-notice">
          Si no ves este correo en tu bandeja de entrada, revisa la carpeta de
          <strong>SPAM</strong> o <strong>Correo no deseado</strong> y marcalo
          como "No es spam" para futuros mensajes.
        </div>
      </div>
      <div class="footer">
        ${new Date().getFullYear()} Polleria Dona Yacki - Todos los derechos reservados
      </div>
    </div>
  </body>
  </html>
  `;

  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject: 'Codigo de verificacion - Polleria Dona Yacki',
    html
  });

  logger.info('Correo enviado a ' + to + ' (id: ' + info.messageId + ')');
  return info;
};