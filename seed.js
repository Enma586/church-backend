import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from './src/config/env.js';

const { MONGO_URI } = env;

const GENDER = ['Masculino', 'Femenino'];
const MEMBER_STATUS = ['Activo', 'Inactivo'];
const USER_ROLE = ['Coordinador', 'Subcoordinador'];

const memberSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  gender: { type: String, enum: GENDER, required: true },
  phone: String,
  email: String,
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  municipalityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Municipality' },
  addressDetails: String,
  family: [{
    name: { type: String, required: true },
    relationship: { type: String },
    contactNumber: String,
    isMember: { type: Boolean, default: false },
  }],
  status: { type: String, enum: MEMBER_STATUS, default: 'Activo' },
}, { timestamps: true });

const userSchema = new mongoose.Schema({
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true, unique: true },
  username: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: USER_ROLE, default: 'Subcoordinador' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const Member = mongoose.model('Member', memberSchema);
const User = mongoose.model('User', userSchema);

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('>>> Conectado a MongoDB');

  // Limpiar existentes (opcional — comenta si no quieres borrar)
  const existing = await User.findOne({ username: 'admin' });
  if (existing) {
    await Member.findByIdAndDelete(existing.memberId);
    await User.findByIdAndDelete(existing._id);
    console.log('>>> Usuario "admin" anterior eliminado');
  }

  // 1. Crear miembro
  const member = await Member.create({
    fullName: 'Administrador Principal',
    dateOfBirth: new Date('1990-01-01'),
    gender: 'Masculino',
    email: 'admin@iglesiayoung.com',
    phone: '99999999',
    addressDetails: 'Dirección de prueba',
    status: 'Activo',
  });
  console.log('>>> Miembro creado:', member._id);

  // 2. Crear usuario
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('admin123', salt);

  const user = await User.create({
    memberId: member._id,
    username: 'admin',
    password: hashedPassword,
    role: 'Coordinador',
    isActive: true,
  });
  console.log('>>> Usuario creado:', user._id);

  await mongoose.disconnect();
  console.log('>>> Listo. Credenciales: admin / admin123');
}

seed().catch((err) => {
  console.error('>>> Error:', err);
  process.exit(1);
});