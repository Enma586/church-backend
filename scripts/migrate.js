#!/usr/bin/env node
/**
 * Script de migración: MongoDB → PostgreSQL
 * 
 * Uso:
 *   node scripts/migrate.js
 * 
 * Requisitos:
 *   - MongoDB y PostgreSQL corriendo
 *   - Ejecutar con npm run migrate (instala mongoose automáticamente)
 */

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/church_db'
const { execSync } = await import('child_process')

console.log('')
console.log('═══════════════════════════════════════════')
console.log('  Migración: MongoDB → PostgreSQL')
console.log('═══════════════════════════════════════════')
console.log('')

async function main() {
  // 1. Conectar a MongoDB usando mongosh para exportar datos
  console.log('1. Conectando a MongoDB...')
  const { stdout: mongoCheck } = execSync(
    `mongosh "${MONGO_URI}" --quiet --eval "JSON.stringify(db.admin().serverStatus().ok)"`,
    { encoding: 'utf8', timeout: 10000 }
  )
  if (mongoCheck.trim() !== '1') {
    console.error('❌ No se pudo conectar a MongoDB')
    process.exit(1)
  }
  console.log('   ✅ MongoDB conectado')

  // 2. Verificar si hay datos en MongoDB
  console.log('')
  console.log('2. Verificando datos existentes...')
  const { stdout: dbStats } = execSync(
    `mongosh "${MONGO_URI}" --quiet --eval "
      const stats = db.stats();
      print(JSON.stringify({ collections: db.getCollectionNames().length, objects: stats.objects }));
    "`,
    { encoding: 'utf8', timeout: 10000 }
  )
  const stats = JSON.parse(dbStats.trim())
  if (stats.objects === 0) {
    console.log('   ℹ MongoDB está vacío — no hay datos que migrar')
    console.log('')
    console.log('✅ Migración completada (sin datos)')
    process.exit(0)
  }
  console.log(`   ℹ ${stats.objects} documentos en ${stats.collections} colecciones`)

  // 3. Instalar mongoose temporalmente para importar datos
  console.log('')
  console.log('3. Instalando mongoose temporalmente...')
  execSync('npm install mongoose', { encoding: 'utf8', timeout: 30000 })
  console.log('   ✅ mongoose instalado')

  // 4. Exportar datos de MongoDB y migrar a PostgreSQL
  console.log('')
  console.log('4. Migrando datos...')

  const { default: mongoose } = await import('mongoose')
  await mongoose.connect(MONGO_URI)

  // Importar modelos de Sequelize (PostgreSQL)
  const sequelize = (await import('../src/config/db.js')).default
  await sequelize.sync()

  // Obtener datos de MongoDB por colección
  const db = mongoose.connection.db

  // Orden de migración (respetando FK)
  const COLLECTIONS_ORDER = [
    'departments',
    'municipalities',
    'members',
    'users',
    'configurations',
    'sacraments',
    'pastoralnotes',
    'appointments',
    'accounts',
    'products',
    'journalentries',
    'counters',
    'cashclosings',
  ]

  for (const colName of COLLECTIONS_ORDER) {
    const collection = db.collection(colName)
    const docs = await collection.find({}).toArray()
    if (docs.length === 0) {
      console.log(`   → ${colName}: 0 documentos (vacío)`)
      continue
    }

    // Transformar _id a string para PostgreSQL
    const transformed = docs.map(doc => {
      const obj = {}
      for (const [key, value] of Object.entries(doc)) {
        if (key === '_id') {
          obj._id = value.toString()
        } else if (value && typeof value === 'object' && value._id) {
          // ObjectId references
          obj[key] = value.toString()
        } else if (value && Array.isArray(value)) {
          // Arrays (family, godparents, participants, denominations)
          obj[key] = value
        } else {
          obj[key] = value
        }
      }
      return obj
    })

    // Migrar según la colección
    try {
      switch (colName) {
        case 'departments':
          for (const d of transformed) {
            await sequelize.models.Department.upsert({
              _id: d._id, name: d.name, isoCode: d.isoCode || null
            })
          }
          break

        case 'municipalities':
          for (const m of transformed) {
            await sequelize.models.Municipality.upsert({
              _id: m._id, name: m.name, departmentId: m.departmentId,
              code: m.code || null
            })
          }
          break

        case 'members':
          for (const m of transformed) {
            const family = m.family || []
            const { family: fam, ...memberData } = m
            await sequelize.models.Member.upsert({
              ...memberData,
              dateOfBirth: memberData.dateOfBirth,
              phone: memberData.phone || null,
              email: memberData.email || null,
              addressDetails: memberData.addressDetails || null,
            })
            if (family.length > 0) {
              await sequelize.models.FamilyMember.destroy({ where: { memberId: m._id } })
              for (const f of family) {
                await sequelize.models.FamilyMember.upsert({
                  memberId: m._id, name: f.name, relationship: f.relationship,
                  contactNumber: f.contactNumber || null, isMember: f.isMember || false
                })
              }
            }
          }
          break

        case 'users':
          for (const u of transformed) {
            await sequelize.models.User.upsert({
              _id: u._id, memberId: u.memberId, username: u.username,
              password: u.password, role: u.role || 'Subcoordinador',
              isActive: u.isActive !== false
            })
          }
          break

        case 'configurations':
          for (const c of transformed) {
            if (c.defaultCashAccountId) c.defaultCashAccountId = c.defaultCashAccountId
            await sequelize.models.Configuration.upsert(c)
          }
          break

        case 'sacraments':
          for (const s of transformed) {
            const godparents = s.godparents || []
            const { godparents: gps, ...sacData } = s
            await sequelize.models.Sacrament.upsert(sacData)
            if (godparents.length > 0) {
              await sequelize.models.Godparent.destroy({ where: { sacramentId: s._id } })
              for (const g of godparents) {
                await sequelize.models.Godparent.upsert({
                  sacramentId: s._id, name: g.name, role: g.role || 'Padrino/Madrina'
                })
              }
            }
          }
          break

        case 'pastoralnotes':
          for (const n of transformed) {
            await sequelize.models.PastoralNote.upsert(n)
          }
          break

        case 'appointments':
          for (const a of transformed) {
            const participants = a.participants || []
            const { participants: parts, ...appData } = a
            await sequelize.models.Appointment.upsert(appData)
            if (participants.length > 0) {
              await sequelize.models.AppointmentParticipant.destroy({ where: { appointmentId: a._id } })
              for (const p of participants) {
                await sequelize.models.AppointmentParticipant.upsert({
                  appointmentId: a._id,
                  memberId: typeof p === 'object' ? p._id?.toString() : p
                })
              }
            }
          }
          break

        case 'accounts':
          for (const a of transformed) {
            if (a.parentAccount) a.parentAccount = a.parentAccount.toString()
            await sequelize.models.Account.upsert(a)
          }
          break

        case 'products':
          for (const p of transformed) {
            await sequelize.models.Product.upsert(p)
          }
          break

        case 'journalentries':
          for (const e of transformed) {
            await sequelize.models.JournalEntry.upsert(e)
          }
          break

        case 'counters':
          for (const c of transformed) {
            await sequelize.models.Counter.upsert({
              _id: c._id.toString(), seq: c.seq || 0
            })
          }
          break

        case 'cashclosings':
          for (const c of transformed) {
            const denoms = c.denominations || []
            const { denominations: dens, ...ccData } = c
            await sequelize.models.CashClosing.upsert(ccData)
            if (denoms.length > 0) {
              await sequelize.models.CashDenomination.destroy({ where: { cashClosingId: c._id } })
              for (const d of denoms) {
                await sequelize.models.CashDenomination.upsert({
                  cashClosingId: c._id, denomination: d.denomination,
                  quantity: d.quantity, subtotal: d.subtotal
                })
              }
            }
          }
          break
      }
      console.log(`   ✓ ${colName}: ${docs.length} documentos migrados`)
    } catch (err) {
      console.error(`   ✗ ${colName}: ERROR - ${err.message}`)
      throw err
    }
  }

  await mongoose.disconnect()
  await sequelize.close()

  // 5. Crear marcador de migración
  execSync('touch /app/.migrated', { encoding: 'utf8' })

  // 6. Limpiar
  console.log('')
  console.log('5. Limpiando...')
  execSync('npm uninstall mongoose', { encoding: 'utf8', timeout: 15000 })
  console.log('   mongoose eliminado')

  console.log('')
  console.log('═══════════════════════════════════════════')
  console.log('  ✅ Migración completada exitosamente')
  console.log('═══════════════════════════════════════════')
  console.log('')
  console.log('Ahora puedes:')
  console.log('  1. Detener MongoDB: docker compose rm -sf mongodb')
  console.log('  2. O eliminar del docker-compose.yaml el servicio mongodb')
  console.log('')
}

main().catch(err => {
  console.error('')
  console.error('❌ Error durante la migración:', err.message)
  console.error('')
  console.error('Los datos en PostgreSQL pueden estar incompletos.')
  console.error('MongoDB no fue modificado — tus datos originales están seguros.')
  console.error('')
  process.exit(1)
})
