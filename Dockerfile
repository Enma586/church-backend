# 1. Base Node.js sobre Debian
FROM node:20-bullseye

# 2. Instalar mongodump desde el repo oficial de MongoDB 6.0
RUN apt-get update && \
    apt-get install -y gnupg curl && \
    curl -fsSL https://www.mongodb.org/static/pgp/server-6.0.asc | \
      gpg --dearmor -o /usr/share/keyrings/mongodb-server-6.0.gpg && \
    echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] http://repo.mongodb.org/apt/debian bullseye/mongodb-org/6.0 main" | \
      tee /etc/apt/sources.list.d/mongodb-org-6.0.list && \
    apt-get update && \
    apt-get install -y mongodb-database-tools && \
    rm -rf /var/lib/apt/lists/*

# 3. Directorio de trabajo
WORKDIR /app

# 4. Copiar dependencias primero (cache de capas)
COPY package*.json ./

# 5. Instalar dependencias exactas para producción
RUN npm ci --only=production

# 6. Copiar código fuente
COPY . .

# 7. Dar permisos de ejecución al entrypoint
RUN chmod +x docker-entrypoint.sh

# 8. Puerto
EXPOSE 3000

# 9. Entrypoint (seeds → app)
ENTRYPOINT ["./docker-entrypoint.sh"]