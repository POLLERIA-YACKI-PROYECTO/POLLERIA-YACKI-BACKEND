# backend/Dockerfile
# ============================================
# BACKEND - Node.js + Express
# ============================================

FROM node:20-alpine

# Directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json primero
# (aprovecha la cache de Docker)
COPY package*.json ./

# Instalar dependencias de produccion
RUN npm install --omit=dev

# Copiar el resto del codigo
COPY . .

# Crear carpeta de uploads si no existe
RUN mkdir -p uploads/comprobantes public/uploads

# Puerto que expone (el mismo que usa tu backend)
EXPOSE 3000

# Variables de entorno por defecto (se sobreescriben con docker-compose)
ENV NODE_ENV=production
ENV PORT=3000

# Comando para iniciar el servidor
CMD ["node", "server.js"]