#!/bin/bash
set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Iglesia Young — Docker Bootstrap"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Esperar a MongoDB ────────────────────────────
echo ""
echo "Esperando conexión a MongoDB (mongodb:27017)..."
RETRIES=30
until node --input-type=commonjs -e "
  const net = require('net');
  const socket = net.createConnection(27017, 'mongodb', () => {
    socket.end();
    process.exit(0);
  });
  socket.on('error', () => process.exit(1));
  setTimeout(() => process.exit(1), 2000);
" 2>/dev/null; do
  RETRIES=$((RETRIES - 1))
  if [ $RETRIES -le 0 ]; then
    echo "MongoDB no disponible después de 30 intentos"
    exit 1
  fi
  sleep 2
done

# ── Seeds: solo la primera vez ───────────────────
MARKER="/app/.seeded"

if [ ! -f "$MARKER" ]; then
  echo ""
  echo "PRIMER ARRANQUE — Ejecutando seeders..."
  echo ""

  # 1. Honduras (departamentos + municipios)
  echo "   [1/2] Ejecutando seed-honduras.js..."
  node seed-honduras.js
  echo "   seed-honduras.js completado"

  # 2. Config + Usuario admin
  echo ""
  echo "   [2/2] Ejecutando seed-config.js (config + usuario admin)..."
  node seed-config.js
  echo "   seed-config.js completado"

  # 3. Marcar como sembrado
  touch "$MARKER"
  echo ""
  echo "Seed completado. Archivo marcador creado en $MARKER"
else
  echo ""
  echo "ℹEl sistema ya fue sembrado anteriormente — omitiendo seeds"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Iniciando servidor Node.js..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

exec node index.js