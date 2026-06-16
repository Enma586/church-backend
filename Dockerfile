# 1. Base Node.js sobre Debian
FROM node:20-bullseye

# 2. Instalar pg_dump y herramientas PostgreSQL
RUN apt-get update && \
    apt-get install -y gnupg curl postgresql-client && \
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
