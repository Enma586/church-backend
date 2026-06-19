/**
 * reset-db.js — Limpia la base de datos y deja solo datos iniciales
 * 
 * Uso: node scripts/reset-db.js
 * 
 * Elimina toda la data y ejecuta los 3 seeds:
 *   seed-honduras.js → departamentos y municipios
 *   seed-config.js → usuario admin + configuración
 *   seed-accounting.js → catálogo contable de ejemplo
 */

import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

console.log('')
console.log('═══════════════════════════════════════════')
console.log('  Reset de base de datos')
console.log('═══════════════════════════════════════════')
console.log('')
console.log('Eliminando datos y recreando...')
console.log('')

try {
    console.log('1. seed-honduras.js (departamentos + municipios)')
    execSync(`node "${root}/seed-honduras.js"`, { cwd: root, stdio: 'inherit' })
    
    console.log('')
    console.log('2. seed-config.js (admin + configuración)')
    execSync(`node "${root}/seed-config.js"`, { cwd: root, stdio: 'inherit' })
    
    console.log('')
    console.log('3. seed-accounting.js (catálogo contable)')
    execSync(`node "${root}/seed-accounting.js"`, { cwd: root, stdio: 'inherit' })

    console.log('')
    console.log('═══════════════════════════════════════════')
    console.log('  ✅ Base de datos limpiada y reseed')
    console.log('  Usuario: admin / admin123 (Coordinador)')
    console.log('═══════════════════════════════════════════')
} catch (err) {
    console.error('')
    console.error('❌ Error durante reset:', err.message)
    process.exit(1)
}
