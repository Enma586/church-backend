# Migración de MongoDB a PostgreSQL

## Requisitos

- Docker y Docker Compose instalados
- MongoDB corriendo con datos existentes
- PostgreSQL corriendo (vacío)

## Un solo comando

```bash
docker compose exec backend npm run migrate
```

Esto:
1. Exporta todos los datos de MongoDB
2. Los importa a PostgreSQL
3. Respeta los `_id` originales (compatibilidad con frontend)
4. No modifica ni borra MongoDB

## Después de migrar

```bash
# 1. Verificar que los datos llegaron
docker compose exec postgres psql -U church -d church_db -c "SELECT 'members: ' || COUNT(*) FROM members;"

# 2. Si todo está bien, eliminar MongoDB
docker compose rm -sf mongodb

# 3. (Opcional) Eliminar el volumen de MongoDB
docker volume rm church_db_data
```

## Notas

- MongoDB no se modifica durante la migración
- Si algo sale mal, solo reinicia PostgreSQL y vuelve a ejecutar la migración
- Los `_id` se mantienen como UUIDs para que el frontend no requiera cambios
