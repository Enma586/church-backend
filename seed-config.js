/**
 * @fileoverview Seeds the initial system Configuration document + admin user.
 * Run once: node seed-config.js
 * 
 * Orden de dependencia: seed-honduras.js DEBE ejecutarse primero
 * (para tener departamentos y municipios).
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/young-group';

const { Schema } = mongoose;

// ═══ Schemas inline (autocontenidos, sin barrel imports) ═══

const configurationSchema = new Schema({
  googleCalendarId: { type: String, required: true, default: 'primary' },
  googleServiceAccountEmail: { type: String, trim: true },
  enableLocalNotifications: { type: Boolean, default: true },
  notificationRefreshInterval: { type: Number, default: 60 },
  churchName: { type: String, required: true, default: 'Parroquia Local' },
  lastBackupDate: { type: Date },
  backupFrequencyDays: { type: Number, default: 7 },
  rolePermissions: {
    type: Map,
    of: [String],
    default: {},
  },
  accountingClosedDate: { type: Date, default: null },
  defaultCashAccountId: {
    type: Schema.Types.ObjectId,
    ref: 'Account',
    default: null,
  },
}, { timestamps: true, collection: 'configuration' });

// Schemas para Member y User (necesarios para crear el usuario admin)
const memberSchema = new Schema({
  fullName:      { type: String, required: true, trim: true },
  dateOfBirth:   { type: Date, required: true },
  gender:        { type: String, required: true, enum: ['Masculino', 'Femenino'] },
  phone:         String,
  email:         String,
  departmentId:  { type: Schema.Types.ObjectId, ref: 'Department', required: true },
  municipalityId:{ type: Schema.Types.ObjectId, ref: 'Municipality', required: true },
  status:        { type: String, enum: ['Activo', 'Inactivo'], default: 'Activo' },
}, { timestamps: true });

const userSchema = new Schema({
  memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true, unique: true },
  username: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true, select: false },
  role:     { type: String, enum: ['Coordinador', 'Subcoordinador'], default: 'Subcoordinador' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// ═══ Modelos ═══
const Configuration = mongoose.model('Configuration', configurationSchema);

// Para Member y User usamos los nombres que coinciden con los modelos de la app
const Department  = mongoose.model('Department',
  new Schema({ name: String, isoCode: String }, { timestamps: true })
);
const Municipality = mongoose.model('Municipality',
  new Schema({
    name: String,
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
    code: String,
  }, { timestamps: true })
);
const Member  = mongoose.model('Member', memberSchema);
const User    = mongoose.model('User', userSchema);

// ═══ Seed ═══
async function seedConfig() {
  console.log('Conectando a MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log(`Conectado (${MONGO_URI})\n`);

  // ──────────────────────────────────────────────────
  // 1. CREAR USUARIO ADMIN (idempotente)
  // ──────────────────────────────────────────────────
  console.log('Verificando si ya existen usuarios...');

  const userCount = await User.countDocuments();

  if (userCount === 0) {
    // Buscar un departamento y municipio (deben existir por seed-honduras.js)
    const dept = await Department.findOne();
    if (!dept) {
      throw new Error('No hay departamentos. Ejecuta seed-honduras.js primero.');
    }

    const muni = await Municipality.findOne({ departmentId: dept._id });
    if (!muni) {
      throw new Error('No hay municipios. Ejecuta seed-honduras.js primero.');
    }

    // Crear miembro
    const member = await Member.create({
      fullName: 'Administrador del Sistema',
      dateOfBirth: new Date('2004-03-03'),
      gender: 'Femenino',
      phone: '8761-4785',
      email: 'admin@iglesia.local',
      departmentId: dept._id,
      municipalityId: muni._id,
      status: 'Activo',
    });
    console.log(`   Miembro creado: ${member.fullName} (${member._id})`);

    // Crear usuario
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const user = await User.create({
      memberId: member._id,
      username: 'admin',
      password: hashedPassword,
      role: 'Coordinador',
      isActive: true,
    });
    console.log(`   Usuario creado: admin / admin123`);
    console.log(`      Rol: ${user.role}`);
  } else {
    console.log(`    Ya existen usuarios — omitiendo creación del admin`);
  }

  // ──────────────────────────────────────────────────
  // 2. CREAR CONFIGURACIÓN (idempotente)
  // ──────────────────────────────────────────────────
  console.log('\n  Verificando configuración del sistema...');

  const existingConfig = await Configuration.findOne();

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
    });
    console.log('    Configuración inicial creada');
  } else {
    console.log('   ℹ La configuración ya existe — omitiendo creación');
  }

  console.log('\nSeed config completado.\n');

  await mongoose.disconnect();
  process.exit(0);
}

seedConfig().catch((err) => {
  console.error('Error:', err.message);
  console.error(err);
  process.exit(1);
});