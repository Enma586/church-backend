/**
 * Seeder del módulo de contabilidad.
 * Crea un catálogo jerárquico, productos, y asientos de ejemplo.
 *
 * Uso:
 *   cd backend && node seed-accounting.js
 *
 * Requisitos:
 *   - MongoDB corriendo
 *   - Al menos un departamento y municipio en la BD (corre seed-honduras.js primero)
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/young-group';

// ═══════════════════════════════════════════════════════════════════════
// Schemas inline (autocontenidos, sin barrel imports)
// ═══════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════
// Schemas inline (autocontenidos, sin barrel imports)
// ═══════════════════════════════════════════════════════════════════════

import { Schema } from 'mongoose';

// ── Geografía (necesarios para crear miembro/usuario) ──────────────
const departmentSchema = new Schema({
  name: { type: String, required: true, unique: true },
  isoCode: String,
}, { timestamps: true });

const municipalitySchema = new Schema({
  name: { type: String, required: true },
  departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
  code: String,
}, { timestamps: true });

municipalitySchema.index({ name: 1, departmentId: 1 });

const Department  = mongoose.model('Department', departmentSchema);
const Municipality = mongoose.model('Municipality', municipalitySchema);

// ── Contabilidad ───────────────────────────────────────────────────
const accountSchema = new Schema({
  code:       { type: String, required: true, unique: true, trim: true },
  name:       { type: String, required: true, trim: true },
  type:       { type: String, required: true, enum: ['Activo','Pasivo','Patrimonio','Ingreso','Gasto'] },
  parentAccount: { type: Schema.Types.ObjectId, ref: 'Account', default: null },
  acceptsTransactions: { type: Boolean, required: true, default: true },
  isActive:   { type: Boolean, default: true },
}, { timestamps: true, versionKey: false });

const productSchema = new Schema({
  name:         { type: String, required: true, trim: true },
  defaultPrice: { type: Number, required: true, default: 0 },
  incomeAccountId: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
  isActive:     { type: Boolean, default: true },
}, { timestamps: true, versionKey: false });

const journalLineSchema = new Schema({
  account:     { type: Schema.Types.ObjectId, ref: 'Account', required: true },
  debit:       { type: Number, required: true, default: 0 },
  credit:      { type: Number, required: true, default: 0 },
  description: { type: String, trim: true },
}, { _id: false });

const journalEntrySchema = new Schema({
  voucherNumber: { type: String, required: true, unique: true },
  date:          { type: Date, required: true, default: Date.now },
  concept:       { type: String, required: true, trim: true },
  status:        { type: String, enum: ['Valido','Anulado'], default: 'Valido' },
  lines:         { type: [journalLineSchema], required: true },
  createdBy:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true, versionKey: false });

const counterSchema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
}, { versionKey: false });

const memberSchema = new Schema({
  fullName:      { type: String, required: true, trim: true },
  dateOfBirth:   { type: Date, required: true },
  gender:        { type: String, required: true, enum: ['Masculino','Femenino'] },
  phone:         String,
  email:         String,
  departmentId:  { type: Schema.Types.ObjectId, ref: 'Department', required: true },
  municipalityId:{ type: Schema.Types.ObjectId, ref: 'Municipality', required: true },
  status:        { type: String, enum: ['Activo','Inactivo'], default: 'Activo' },
}, { timestamps: true });

const userSchema = new Schema({
  memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true, unique: true },
  username: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true, select: false },
  role:     { type: String, enum: ['Coordinador','Subcoordinador'], default: 'Subcoordinador' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Registrar modelos
const Account       = mongoose.model('Account', accountSchema);
const Product       = mongoose.model('Product', productSchema);
const JournalEntry  = mongoose.model('JournalEntry', journalEntrySchema);
const Counter       = mongoose.model('Counter', counterSchema);
const Member        = mongoose.model('Member', memberSchema);
const User          = mongoose.model('User', userSchema);
// ═══════════════════════════════════════════════════════════════════════
// Helper: generar número de comprobante
// ═══════════════════════════════════════════════════════════════════════
async function generateVoucher(date) {
  const ym = date.toISOString().slice(0, 7).replace('-', ''); // "202605"
  const counterId = `voucher-${ym}`;
  const counter = await Counter.findByIdAndUpdate(
    counterId,
    { $inc: { seq: 1 } },
    { upsert: true, new: true },
  );
  return `VCH-${ym}-${String(counter.seq).padStart(4, '0')}`;
}

// ═══════════════════════════════════════════════════════════════════════
// SEED PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════
async function seedAccounting() {
  console.log('⏳ Conectando a MongoDB...\n');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Conectado\n');

  // ── 1. Limpiar datos contables ────────────────────────────────────
  console.log('🗑️  Limpiando colecciones contables...');
  await Promise.all([
    Account.deleteMany({}),
    Product.deleteMany({}),
    JournalEntry.deleteMany({}),
    Counter.deleteMany({}),
  ]);
  console.log('   OK\n');

  // ── 2. Buscar/crear usuario de prueba ─────────────────────────────
// ── 2. Buscar/crear usuario de prueba ─────────────────────────────
  console.log('👤 Preparando usuario de prueba...');
  const dept = await Department.findOne();
  if (!dept) throw new Error('No hay departamentos. Corra seed-honduras.js primero');

  const muni = await Municipality.findOne({ departmentId: dept._id });
  if (!muni) throw new Error('No hay municipios. Corra seed-honduras.js primero');;

  let user = await User.findOne({ username: 'contador' }).populate('memberId');

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
    });
    console.log(`   Miembro creado: ${member._id}`);

    const hashedPassword = await bcrypt.hash('admin123', 10);
    user = await User.create({
      memberId: member._id,
      username: 'contador',
      password: hashedPassword,
      role: 'Coordinador',
      isActive: true,
    });
    console.log(`   Usuario creado: contador / admin123`);
  } else {
    console.log(`   Usuario existente: ${user.username}`);
  }

  const userId = user._id;
  console.log(`   userId = ${userId}\n`);

  // ── 3. Cuentas contables jerárquicas ──────────────────────────────
  console.log('📊 Creando catálogo de cuentas...');

  // 3a. Cuentas padre (agrupación) – se crean primero
  const parents = await Account.insertMany([
    { code: '1.1',  name: 'Activo Corriente',        type: 'Activo',      acceptsTransactions: false },
    { code: '1.2',  name: 'Activo No Corriente',     type: 'Activo',      acceptsTransactions: false },
    { code: '2.1',  name: 'Pasivo Corriente',        type: 'Pasivo',      acceptsTransactions: false },
    { code: '2.2',  name: 'Pasivo No Corriente',     type: 'Pasivo',      acceptsTransactions: false },
    { code: '3.1',  name: 'Capital',                 type: 'Patrimonio',  acceptsTransactions: false },
    { code: '4.1',  name: 'Ingresos Operativos',     type: 'Ingreso',     acceptsTransactions: false },
    { code: '4.2',  name: 'Otros Ingresos',          type: 'Ingreso',     acceptsTransactions: false },
    { code: '5.1',  name: 'Gastos Operativos',       type: 'Gasto',       acceptsTransactions: false },
    { code: '5.2',  name: 'Gastos Administrativos',  type: 'Gasto',       acceptsTransactions: false },
  ]);
  console.log(`   ${parents.length} cuentas de agrupación creadas`);

  // Construir mapa rápido code → _id
  const parentMap = {};
  for (const p of parents) parentMap[p.code] = p._id;

  // 3b. Cuentas hoja (aceptan transacciones)
  const children = await Account.insertMany([
    // Activo Corriente
    { code: '1.1.01', name: 'Caja General',            type: 'Activo',  parentAccount: parentMap['1.1'], acceptsTransactions: true },
    { code: '1.1.02', name: 'Bancos',                  type: 'Activo',  parentAccount: parentMap['1.1'], acceptsTransactions: true },
    { code: '1.1.03', name: 'Cuentas por Cobrar',      type: 'Activo',  parentAccount: parentMap['1.1'], acceptsTransactions: true },
    // Activo No Corriente
    { code: '1.2.01', name: 'Mobiliario y Equipo',     type: 'Activo',  parentAccount: parentMap['1.2'], acceptsTransactions: true },
    { code: '1.2.02', name: 'Vehículos',               type: 'Activo',  parentAccount: parentMap['1.2'], acceptsTransactions: true },
    { code: '1.2.03', name: 'Edificios e Instalaciones', type: 'Activo',parentAccount: parentMap['1.2'], acceptsTransactions: true },
    // Pasivo Corriente
    { code: '2.1.01', name: 'Cuentas por Pagar',       type: 'Pasivo', parentAccount: parentMap['2.1'], acceptsTransactions: true },
    { code: '2.1.02', name: 'Préstamos a Corto Plazo', type: 'Pasivo', parentAccount: parentMap['2.1'], acceptsTransactions: true },
    // Pasivo No Corriente
    { code: '2.2.01', name: 'Préstamos a Largo Plazo', type: 'Pasivo', parentAccount: parentMap['2.2'], acceptsTransactions: true },
    // Patrimonio
    { code: '3.1.01', name: 'Capital Social',          type: 'Patrimonio', parentAccount: parentMap['3.1'], acceptsTransactions: true },
    { code: '3.1.02', name: 'Utilidades Retenidas',    type: 'Patrimonio', parentAccount: parentMap['3.1'], acceptsTransactions: true },
    // Ingresos Operativos
    { code: '4.1.01', name: 'Ingresos por Certificados', type: 'Ingreso', parentAccount: parentMap['4.1'], acceptsTransactions: true },
    { code: '4.1.02', name: 'Ingresos por Diezmos',    type: 'Ingreso', parentAccount: parentMap['4.1'], acceptsTransactions: true },
    { code: '4.1.03', name: 'Ingresos por Donaciones', type: 'Ingreso', parentAccount: parentMap['4.1'], acceptsTransactions: true },
    // Otros Ingresos
    { code: '4.2.01', name: 'Ingresos Financieros',    type: 'Ingreso', parentAccount: parentMap['4.2'], acceptsTransactions: true },
    // Gastos Operativos
    { code: '5.1.01', name: 'Servicios Básicos',       type: 'Gasto',  parentAccount: parentMap['5.1'], acceptsTransactions: true },
    { code: '5.1.02', name: 'Materiales y Suministros',type: 'Gasto',  parentAccount: parentMap['5.1'], acceptsTransactions: true },
    { code: '5.1.03', name: 'Mantenimiento',           type: 'Gasto',  parentAccount: parentMap['5.1'], acceptsTransactions: true },
    // Gastos Administrativos
    { code: '5.2.01', name: 'Salarios',                type: 'Gasto',  parentAccount: parentMap['5.2'], acceptsTransactions: true },
    { code: '5.2.02', name: 'Papelería y Útiles',      type: 'Gasto',  parentAccount: parentMap['5.2'], acceptsTransactions: true },
  ]);
  console.log(`   ${children.length} cuentas hoja creadas\n`);

  // Resolver IDs para asientos
  const allAccounts = [...parents, ...children];
  const a = {};
  for (const acct of allAccounts) a[acct.code] = acct._id;

  // ── 4. Productos ──────────────────────────────────────────────────
  console.log('🛒 Creando productos...');
  await Product.insertMany([
    { name: 'Certificado de Bautismo',     defaultPrice: 150.00, incomeAccountId: a['4.1.01'] },
    { name: 'Certificado de Confirmación', defaultPrice: 200.00, incomeAccountId: a['4.1.01'] },
    { name: 'Certificado de Matrimonio',   defaultPrice: 300.00, incomeAccountId: a['4.1.01'] },
    { name: 'Copia de Partida',            defaultPrice: 50.00,  incomeAccountId: a['4.1.01'] },
    { name: 'Constancia Eclesiástica',     defaultPrice: 75.00,  incomeAccountId: a['4.1.01'] },
  ]);
  console.log('   5 productos creados\n');

  // ── 5. Asientos contables ─────────────────────────────────────────
  console.log('📝 Creando asientos contables (partida doble)...\n');

  // Asiento 1 – Apertura
  const e1Date = new Date('2026-01-02');
  console.log('   VCH-202601-0001  Apertura de ejercicio');
  await JournalEntry.create({
    voucherNumber: await generateVoucher(e1Date),
    date: e1Date,
    concept: 'Apertura de ejercicio contable 2026 — aporte inicial a Caja General.',
    status: 'Valido',
    createdBy: userId,
    lines: [
      { account: a['1.1.01'], debit: 15000.00, credit: 0, description: 'Aporte inicial en efectivo' },
      { account: a['3.1.01'], debit: 0,        credit: 15000.00, description: 'Capital inicial' },
    ],
  });

  // Asiento 2 – Diezmos
  const e2Date = new Date('2026-01-15');
  console.log('   VCH-202601-0002  Ingreso por diezmos');
  await JournalEntry.create({
    voucherNumber: await generateVoucher(e2Date),
    date: e2Date,
    concept: 'Registro de diezmos recolectados en el culto dominical del 15 de enero.',
    status: 'Valido',
    createdBy: userId,
    lines: [
      { account: a['1.1.01'], debit: 2500.00, credit: 0, description: 'Efectivo recibido' },
      { account: a['4.1.02'], debit: 0,       credit: 2500.00, description: 'Diezmos enero' },
    ],
  });

  // Asiento 3 – Donaciones
  const e3Date = new Date('2026-01-20');
  console.log('   VCH-202601-0003  Donación recibida');
  await JournalEntry.create({
    voucherNumber: await generateVoucher(e3Date),
    date: e3Date,
    concept: 'Donación especial de un feligrés anónimo para el fondo de construcción.',
    status: 'Valido',
    createdBy: userId,
    lines: [
      { account: a['1.1.01'], debit: 5000.00, credit: 0, description: 'Donación en efectivo' },
      { account: a['4.1.03'], debit: 0,       credit: 5000.00, description: 'Donación para construcción' },
    ],
  });

  // Asiento 4 – Servicios básicos
  const e4Date = new Date('2026-02-01');
  console.log('   VCH-202602-0001  Pago de servicios básicos');
  await JournalEntry.create({
    voucherNumber: await generateVoucher(e4Date),
    date: e4Date,
    concept: 'Pago de factura de energía eléctrica del mes de enero 2026.',
    status: 'Valido',
    createdBy: userId,
    lines: [
      { account: a['5.1.01'], debit: 850.00, credit: 0, description: 'Energía eléctrica enero' },
      { account: a['1.1.01'], debit: 0,      credit: 850.00, description: 'Pago en efectivo' },
    ],
  });

  // Asiento 5 – Materiales
  const e5Date = new Date('2026-02-10');
  console.log('   VCH-202602-0002  Compra de materiales');
  await JournalEntry.create({
    voucherNumber: await generateVoucher(e5Date),
    date: e5Date,
    concept: 'Compra de suministros de limpieza y papelería para la oficina pastoral.',
    status: 'Valido',
    createdBy: userId,
    lines: [
      { account: a['5.1.02'], debit: 420.00, credit: 0, description: 'Artículos de limpieza' },
      { account: a['5.2.02'], debit: 180.00, credit: 0, description: 'Papelería' },
      { account: a['1.1.01'], debit: 0,      credit: 600.00, description: 'Pago en efectivo' },
    ],
  });

  // Asiento 6 – Certificado
  const e6Date = new Date('2026-03-05');
  console.log('   VCH-202603-0001  Venta de certificado');
  await JournalEntry.create({
    voucherNumber: await generateVoucher(e6Date),
    date: e6Date,
    concept: 'Emisión de certificado de bautismo para miembro de la congregación.',
    status: 'Valido',
    createdBy: userId,
    lines: [
      { account: a['1.1.01'], debit: 150.00, credit: 0, description: 'Pago en efectivo' },
      { account: a['4.1.01'], debit: 0,      credit: 150.00, description: 'Certificado de Bautismo' },
    ],
  });

  // Asiento 7 – Salarios
  const e7Date = new Date('2026-03-15');
  console.log('   VCH-202603-0002  Pago de salarios');
  await JournalEntry.create({
    voucherNumber: await generateVoucher(e7Date),
    date: e7Date,
    concept: 'Pago de salarios del personal administrativo correspondiente a marzo 2026.',
    status: 'Valido',
    createdBy: userId,
    lines: [
      { account: a['5.2.01'], debit: 3000.00, credit: 0, description: 'Salarios marzo' },
      { account: a['1.1.01'], debit: 0,       credit: 3000.00, description: 'Pago en efectivo' },
    ],
  });

  // Asiento 8 – Mantenimiento
  const e8Date = new Date('2026-04-10');
  console.log('   VCH-202604-0001  Mantenimiento de instalaciones');
  await JournalEntry.create({
    voucherNumber: await generateVoucher(e8Date),
    date: e8Date,
    concept: 'Reparación del sistema eléctrico del templo principal.',
    status: 'Valido',
    createdBy: userId,
    lines: [
      { account: a['5.1.03'], debit: 1200.00, credit: 0, description: 'Reparación eléctrica' },
      { account: a['1.1.01'], debit: 0,       credit: 1200.00, description: 'Pago en efectivo' },
    ],
  });

  // Asiento 9 – Diezmos febrero
  const e9Date = new Date('2026-04-20');
  console.log('   VCH-202604-0002  Diezmos + certificados');
  await JournalEntry.create({
    voucherNumber: await generateVoucher(e9Date),
    date: e9Date,
    concept: 'Ingresos de febrero: diezmos y emisión de certificado de confirmación.',
    status: 'Valido',
    createdBy: userId,
    lines: [
      { account: a['1.1.01'], debit: 3000.00, credit: 0, description: 'Efectivo recibido' },
      { account: a['4.1.02'], debit: 0,       credit: 2800.00, description: 'Diezmos febrero' },
      { account: a['4.1.01'], debit: 0,       credit: 200.00, description: 'Certificado de Confirmación' },
    ],
  });

  // Asiento 10 – Donación grande
  const e10Date = new Date('2026-05-01');
  console.log('   VCH-202605-0001  Donación mayor');
  await JournalEntry.create({
    voucherNumber: await generateVoucher(e10Date),
    date: e10Date,
    concept: 'Donación anónima significativa para apoyo a actividades juveniles.',
    status: 'Valido',
    createdBy: userId,
    lines: [
      { account: a['1.1.01'], debit: 8000.00, credit: 0, description: 'Donación en efectivo' },
      { account: a['4.1.03'], debit: 0,       credit: 8000.00, description: 'Donación para jóvenes' },
    ],
  });

  // ── 6. Resumen ────────────────────────────────────────────────────

  const totalAccounts = await Account.countDocuments();
  const totalProducts = await Product.countDocuments();
  const totalEntries  = await JournalEntry.countDocuments();

  console.log('\n═════════════════════════════════════════');
  console.log('🎉 SEEDER COMPLETADO');
  console.log('═════════════════════════════════════════');
  console.log(`   Cuentas contables:   ${totalAccounts} (9 agrupación, ${totalAccounts - 9} hoja)`);
  console.log(`   Productos:           ${totalProducts}`);
  console.log(`   Asientos contables:  ${totalEntries}`);
  console.log();
  console.log('   Usuario de prueba:   contador / admin123');
  console.log('   Ahora puede probar:');
  console.log('     - Catálogo de cuentas con jerarquía');
  console.log('     - Productos vinculados a cuentas de ingreso');
  console.log('     - Asientos balanceados con partida doble');
  console.log('     - Reportes: Balanza, Balance General, Edo. Resultados, Libro Mayor');
  console.log('═════════════════════════════════════════\n');

  await mongoose.disconnect();
  process.exit(0);
}

// ── Ejecutar ──────────────────────────────────────────────────────────
seedAccounting().catch((error) => {
  console.error('\n❌ Error:', error.message);
  console.error('   Asegúrese de:');
  console.error('   1. MongoDB corriendo (mongod)');
  console.error('   2. seed-honduras.js ejecutado primero');
  console.error('   3. Archivo .env con MONGO_URI correcto\n');
  console.error(error);
  process.exit(1);
});