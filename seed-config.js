import bcrypt from 'bcryptjs'
import sequelize, { connectDB } from './src/config/db.js'
import { Configuration, Department, Municipality, Member, User } from './src/models/index.js'

async function seedConfig() {
    console.log('⏳ Conectando a PostgreSQL...')
    await connectDB()
    console.log('✅ Conectado\n')

    // ── 1. CREAR USUARIO ADMIN ──────────────────────────────────
    console.log('Verificando si ya existen usuarios...')

    const userCount = await User.count()

    if (userCount === 0) {
        const dept = await Department.findOne()
        if (!dept) {
            throw new Error('No hay departamentos. Ejecuta seed-honduras.js primero.')
        }

        const muni = await Municipality.findOne({ where: { departmentId: dept._id } })
        if (!muni) {
            throw new Error('No hay municipios. Ejecuta seed-honduras.js primero.')
        }

        const member = await Member.create({
            fullName: 'Administrador del Sistema',
            dateOfBirth: new Date('2004-03-03'),
            gender: 'Femenino',
            phone: '8761-4785',
            email: 'admin@iglesia.local',
            departmentId: dept._id,
            municipalityId: muni._id,
            status: 'Activo',
        })
        console.log(`   Miembro creado: ${member.fullName} (${member._id})`)

        const hashedPassword = await bcrypt.hash('admin123', 10)
        const user = await User.create({
            memberId: member._id,
            username: 'admin',
            password: hashedPassword,
            role: 'Coordinador',
            isActive: true,
        })
        console.log(`   Usuario creado: admin / admin123`)
        console.log(`      Rol: ${user.role}`)
    } else {
        console.log(`    Ya existen usuarios — omitiendo creación del admin`)
    }

    // ── 2. CREAR CONFIGURACIÓN ──────────────────────────────────
    console.log('\n  Verificando configuración del sistema...')

    const existingConfig = await Configuration.findOne()

    if (!existingConfig) {
        await Configuration.create({
            churchName: 'Parroquia Local',
            googleCalendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
            googleServiceAccountEmail: process.env.GOOGLE_CLIENT_EMAIL || '',
            enableLocalNotifications: true,
            notificationRefreshInterval: 60,
            backupFrequencyDays: 7,
            accountingClosedDate: null,
            defaultCashAccountId: null,
            rolePermissions: {
                Coordinador: [
                    'dashboard:view',
                    'members:read', 'members:write',
                    'appointments:read', 'appointments:write',
                    'schedule:read', 'schedule:write',
                    'sacraments:read', 'sacraments:write',
                    'pastoral_notes:read', 'pastoral_notes:write',
                    'users:read', 'users:write',
                    'roles:read', 'roles:write',
                    'config:read', 'config:write',
                    'accounting:read', 'accounting:write',
                ],
                Subcoordinador: [
                    'dashboard:view',
                    'members:read', 'members:write',
                    'appointments:read', 'appointments:write',
                    'schedule:read', 'schedule:write',
                    'sacraments:read', 'sacraments:write',
                    'pastoral_notes:read', 'pastoral_notes:write',
                    'users:read',
                    'roles:read',
                    'config:read',
                    'accounting:read',
                ],
            },
        })
        console.log('    Configuración inicial creada')
    } else {
        console.log('   ℹ La configuración ya existe — omitiendo creación')
    }

    console.log('\nSeed config completado.\n')
    await sequelize.close()
    process.exit(0)
}

seedConfig().catch((err) => {
    console.error('Error:', err.message)
    console.error(err)
    process.exit(1)
})
