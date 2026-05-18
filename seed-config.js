/**
 * @fileoverview Seeds the initial system Configuration document.
 * Run once: node seed-config.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/young-group';

// Inline schema to avoid circular imports
const configurationSchema = new mongoose.Schema({
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
  accountingClosedDate: {
    type: Date,
    default: null,
  },
  defaultCashAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    default: null,
  },
}, { timestamps: true, collection: 'configuration' });

const Configuration = mongoose.model('Configuration', configurationSchema);

async function seedConfig() {
  await mongoose.connect(MONGO_URI);
  console.log('Conectado a MongoDB\n');

  // Remove existing config (singleton)
  await Configuration.deleteMany({});
  console.log('Configuración previa eliminada');

  await Configuration.create({
    churchName: 'Parroquia Local',
    googleCalendarId: 'primary',
    googleServiceAccountEmail: '',
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

  console.log('Configuración inicial creada\n');
  await mongoose.disconnect();
  process.exit(0);
}

seedConfig().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});