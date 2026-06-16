#!/bin/bash
set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Iglesia Young — Docker Bootstrap"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Esperar a PostgreSQL ────────────────────────
echo ""
echo "Esperando conexión a PostgreSQL..."
RETRIES=30
until PGPASSWORD=$PGPASSWORD pg_isready -h postgres -U church -d church_db -q 2>/dev/null; do
  RETRIES=$((RETRIES - 1))
  if [ $RETRIES -le 0 ]; then
    echo "PostgreSQL no disponible después de 30 intentos"
    exit 1
  fi
  sleep 2
done
echo "PostgreSQL está listo"

# ── Seeds: solo la primera vez ───────────────────
MARKER="/app/.seeded"

if [ ! -f "$MARKER" ]; then
  echo ""
  echo "PRIMER ARRANQUE — Ejecutando seeders..."
  echo ""

  # 1. Honduras (departamentos + municipios)
  echo "   [1/3] Ejecutando seed-honduras.js..."
  node seed-honduras.js
  echo "   seed-honduras.js completado"

  # 2. Config + Usuario admin
  echo ""
  echo "   [2/3] Ejecutando seed-config.js (config + usuario admin)..."
  node seed-config.js
  echo "   seed-config.js completado"

  # 3. Accounting
  echo ""
  echo "   [3/3] Ejecutando seed-accounting.js..."
  node seed-accounting.js
  echo "   seed-accounting.js completado"

  # Marcar como sembrado
  touch "$MARKER"
  echo ""
  echo "Seed completado. Archivo marcador creado en $MARKER"
else
  echo ""
  echo "ℹ El sistema ya fue sembrado anteriormente — omitiendo seeds"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Iniciando servidor Node.js..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

exec node index.js
