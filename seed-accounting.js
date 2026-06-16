import bcrypt from 'bcryptjs'
import sequelize, { connectDB } from './src/config/db.js'
import {
    Department, Municipality, Member, User,
    Account, Product, JournalEntry, Counter,
} from './src/models/index.js'

async function generateVoucher(date) {
    const ym = date.toISOString().slice(0, 7).replace('-', '')
    const counterId = `voucher-${ym}`

    const [counter] = await Counter.findOrCreate({
        where: { _id: counterId },
        defaults: { _id: counterId, seq: 0 },
    })
    await counter.increment('seq', { by: 1 })
    await counter.reload()

    return `VCH-${ym}-${String(counter.seq).padStart(4, '0')}`
}

async function seedAccounting() {
    console.log('⏳ Conectando a PostgreSQL...\n')
    await connectDB()
    console.log('✅ Conectado\n')

    // ── 1. Limpiar datos contables ────────────────────────────────────
    console.log('🗑️  Limpiando colecciones contables...')
    await Promise.all([
        Account.destroy({ where: {}, truncate: true, cascade: true }),
        Product.destroy({ where: {}, truncate: true, cascade: true }),
        JournalEntry.destroy({ where: {}, truncate: true, cascade: true }),
        Counter.destroy({ where: {}, truncate: true, cascade: true }),
    ])
    console.log('   OK\n')

    // ── 2. Buscar/crear usuario de prueba ─────────────────────────────
    console.log('👤 Preparando usuario de prueba...')
    const dept = await Department.findOne()
    if (!dept) throw new Error('No hay departamentos. Corra seed-honduras.js primero')

    const muni = await Municipality.findOne({ where: { departmentId: dept._id } })
    if (!muni) throw new Error('No hay municipios. Corra seed-honduras.js primero')

    let user = await User.findOne({ where: { username: 'contador' } })

    if (!user) {
        const member = await Member.create({
            fullName: 'Administrador Contable',
            dateOfBirth: new Date('1990-05-15'),
            gender: 'Masculino',
            phone: '9999-9999',
            email: 'admin@iglesia.org',
            departmentId: dept._id,
            municipalityId: muni._id,
            status: 'Activo',
        })
        console.log(`   Miembro creado: ${member._id}`)

        const hashedPassword = await bcrypt.hash('admin123', 10)
        user = await User.create({
            memberId: member._id,
            username: 'contador',
            password: hashedPassword,
            role: 'Coordinador',
            isActive: true,
        })
        console.log(`   Usuario creado: contador / admin123`)
    } else {
        console.log(`   Usuario existente: ${user.username}`)
    }

    const userId = user._id
    console.log(`   userId = ${userId}\n`)

    // ── 3. Cuentas contables jerárquicas ──────────────────────────────
    console.log('📊 Creando catálogo de cuentas...')

    const parents = await Account.bulkCreate([
        { code: '1.1',  name: 'Activo Corriente',        type: 'Activo',      acceptsTransactions: false },
        { code: '1.2',  name: 'Activo No Corriente',     type: 'Activo',      acceptsTransactions: false },
        { code: '2.1',  name: 'Pasivo Corriente',        type: 'Pasivo',      acceptsTransactions: false },
        { code: '2.2',  name: 'Pasivo No Corriente',     type: 'Pasivo',      acceptsTransactions: false },
        { code: '3.1',  name: 'Capital',                 type: 'Patrimonio',  acceptsTransactions: false },
        { code: '4.1',  name: 'Ingresos Operativos',     type: 'Ingreso',     acceptsTransactions: false },
        { code: '4.2',  name: 'Otros Ingresos',          type: 'Ingreso',     acceptsTransactions: false },
        { code: '5.1',  name: 'Gastos Operativos',       type: 'Gasto',       acceptsTransactions: false },
        { code: '5.2',  name: 'Gastos Administrativos',  type: 'Gasto',       acceptsTransactions: false },
    ])
    console.log(`   ${parents.length} cuentas de agrupación creadas`)

    const parentMap = {}
    for (const p of parents) parentMap[p.code] = p._id

    const children = await Account.bulkCreate([
        { code: '1.1.01', name: 'Caja General',            type: 'Activo',  parentAccount: parentMap['1.1'], acceptsTransactions: true },
        { code: '1.1.02', name: 'Bancos',                  type: 'Activo',  parentAccount: parentMap['1.1'], acceptsTransactions: true },
        { code: '1.1.03', name: 'Cuentas por Cobrar',      type: 'Activo',  parentAccount: parentMap['1.1'], acceptsTransactions: true },
        { code: '1.2.01', name: 'Mobiliario y Equipo',     type: 'Activo',  parentAccount: parentMap['1.2'], acceptsTransactions: true },
        { code: '1.2.02', name: 'Vehículos',               type: 'Activo',  parentAccount: parentMap['1.2'], acceptsTransactions: true },
        { code: '1.2.03', name: 'Edificios e Instalaciones', type: 'Activo',parentAccount: parentMap['1.2'], acceptsTransactions: true },
        { code: '2.1.01', name: 'Cuentas por Pagar',       type: 'Pasivo', parentAccount: parentMap['2.1'], acceptsTransactions: true },
        { code: '2.1.02', name: 'Préstamos a Corto Plazo', type: 'Pasivo', parentAccount: parentMap['2.1'], acceptsTransactions: true },
        { code: '2.2.01', name: 'Préstamos a Largo Plazo', type: 'Pasivo', parentAccount: parentMap['2.2'], acceptsTransactions: true },
        { code: '3.1.01', name: 'Capital Social',          type: 'Patrimonio', parentAccount: parentMap['3.1'], acceptsTransactions: true },
        { code: '3.1.02', name: 'Utilidades Retenidas',    type: 'Patrimonio', parentAccount: parentMap['3.1'], acceptsTransactions: true },
        { code: '4.1.01', name: 'Ingresos por Certificados', type: 'Ingreso', parentAccount: parentMap['4.1'], acceptsTransactions: true },
        { code: '4.1.02', name: 'Ingresos por Diezmos',    type: 'Ingreso', parentAccount: parentMap['4.1'], acceptsTransactions: true },
        { code: '4.1.03', name: 'Ingresos por Donaciones', type: 'Ingreso', parentAccount: parentMap['4.1'], acceptsTransactions: true },
        { code: '4.2.01', name: 'Ingresos Financieros',    type: 'Ingreso', parentAccount: parentMap['4.2'], acceptsTransactions: true },
        { code: '5.1.01', name: 'Servicios Básicos',       type: 'Gasto',  parentAccount: parentMap['5.1'], acceptsTransactions: true },
        { code: '5.1.02', name: 'Materiales y Suministros',type: 'Gasto',  parentAccount: parentMap['5.1'], acceptsTransactions: true },
        { code: '5.1.03', name: 'Mantenimiento',           type: 'Gasto',  parentAccount: parentMap['5.1'], acceptsTransactions: true },
        { code: '5.2.01', name: 'Salarios',                type: 'Gasto',  parentAccount: parentMap['5.2'], acceptsTransactions: true },
        { code: '5.2.02', name: 'Papelería y Útiles',      type: 'Gasto',  parentAccount: parentMap['5.2'], acceptsTransactions: true },
    ])
    console.log(`   ${children.length} cuentas hoja creadas\n`)

    const allAccounts = [...parents, ...children]
    const a = {}
    for (const acct of allAccounts) a[acct.code] = acct._id

    // ── 4. Productos ──────────────────────────────────────────────────
    console.log('🛒 Creando productos...')
    await Product.bulkCreate([
        { name: 'Certificado de Bautismo',     defaultPrice: 150.00, incomeAccountId: a['4.1.01'] },
        { name: 'Certificado de Confirmación', defaultPrice: 200.00, incomeAccountId: a['4.1.01'] },
        { name: 'Certificado de Matrimonio',   defaultPrice: 300.00, incomeAccountId: a['4.1.01'] },
        { name: 'Copia de Partida',            defaultPrice: 50.00,  incomeAccountId: a['4.1.01'] },
        { name: 'Constancia Eclesiástica',     defaultPrice: 75.00,  incomeAccountId: a['4.1.01'] },
    ])
    console.log('   5 productos creados\n')

    // ── 5. Asientos contables ─────────────────────────────────────────
    console.log('📝 Creando asientos contables...\n')

    const entries = [
        {
            date: new Date('2026-01-02'),
            concept: 'Apertura de ejercicio contable 2026 — aporte inicial a Caja General.',
            type: 'Ingreso',
            account: a['1.1.01'],
            amount: 15000.00,
        },
        {
            date: new Date('2026-01-15'),
            concept: 'Registro de diezmos recolectados en el culto dominical del 15 de enero.',
            type: 'Ingreso',
            account: a['4.1.02'],
            amount: 2500.00,
        },
        {
            date: new Date('2026-01-20'),
            concept: 'Donación especial de un feligrés anónimo para el fondo de construcción.',
            type: 'Ingreso',
            account: a['4.1.03'],
            amount: 5000.00,
        },
        {
            date: new Date('2026-02-01'),
            concept: 'Pago de factura de energía eléctrica del mes de enero 2026.',
            type: 'Egreso',
            account: a['5.1.01'],
            amount: 850.00,
        },
        {
            date: new Date('2026-02-10'),
            concept: 'Compra de suministros de limpieza y papelería para la oficina pastoral.',
            type: 'Egreso',
            account: a['5.1.02'],
            amount: 420.00,
        },
        {
            date: new Date('2026-03-05'),
            concept: 'Emisión de certificado de bautismo para miembro de la congregación.',
            type: 'Ingreso',
            account: a['4.1.01'],
            amount: 150.00,
        },
        {
            date: new Date('2026-03-15'),
            concept: 'Pago de salarios del personal administrativo correspondiente a marzo 2026.',
            type: 'Egreso',
            account: a['5.2.01'],
            amount: 3000.00,
        },
        {
            date: new Date('2026-04-10'),
            concept: 'Reparación del sistema eléctrico del templo principal.',
            type: 'Egreso',
            account: a['5.1.03'],
            amount: 1200.00,
        },
        {
            date: new Date('2026-04-20'),
            concept: 'Ingresos de febrero: diezmos y emisión de certificado de confirmación.',
            type: 'Ingreso',
            account: a['4.1.02'],
            amount: 2800.00,
        },
        {
            date: new Date('2026-05-01'),
            concept: 'Donación anónima significativa para apoyo a actividades juveniles.',
            type: 'Ingreso',
            account: a['4.1.03'],
            amount: 8000.00,
        },
    ]

    for (const entry of entries) {
        const voucherNumber = await generateVoucher(entry.date)
        console.log(`   ${voucherNumber}  ${entry.concept.substring(0, 60)}`)
        await JournalEntry.create({
            ...entry,
            voucherNumber,
            createdBy: userId,
        })
    }

    const totalAccounts = await Account.count()
    const totalProducts = await Product.count()
    const totalEntries  = await JournalEntry.count()

    console.log('\n═════════════════════════════════════════')
    console.log('🎉 SEEDER COMPLETADO')
    console.log('═════════════════════════════════════════')
    console.log(`   Cuentas contables:   ${totalAccounts} (9 agrupación, ${totalAccounts - 9} hoja)`)
    console.log(`   Productos:           ${totalProducts}`)
    console.log(`   Asientos contables:  ${totalEntries}`)
    console.log()
    console.log('   Usuario de prueba:   contador / admin123')
    console.log('═════════════════════════════════════════\n')

    await sequelize.close()
    process.exit(0)
}

seedAccounting().catch((error) => {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
})
