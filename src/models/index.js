import sequelize from '../config/db.js'

import { Department, Municipality } from './address/index.js'
import { Appointment, AppointmentParticipant } from './appointments/index.js'
import { Configuration } from './config/index.js'
import { Member, User, FamilyMember } from './members/index.js'
import { Sacrament, PastoralNote, Godparent } from './sacrament/index.js'
import { Account, Product, JournalEntry, Counter, CashClosing, CashDenomination } from './accounting/index.js'

// ── Address ─────────────────────────────────────────────────────────
Department.hasMany(Municipality, { foreignKey: 'departmentId', as: 'municipalities' })
Municipality.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' })

// ── Members ─────────────────────────────────────────────────────────
Department.hasMany(Member, { foreignKey: 'departmentId', as: 'members' })
Member.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' })

Municipality.hasMany(Member, { foreignKey: 'municipalityId', as: 'members' })
Member.belongsTo(Municipality, { foreignKey: 'municipalityId', as: 'municipality' })

Member.hasMany(FamilyMember, { foreignKey: 'memberId', as: 'family' })
FamilyMember.belongsTo(Member, { foreignKey: 'memberId', as: 'member' })

Member.hasOne(User, { foreignKey: 'memberId', as: 'user' })
User.belongsTo(Member, { foreignKey: 'memberId', as: 'member' })

// ── Appointments ────────────────────────────────────────────────────
Member.hasMany(Appointment, { foreignKey: 'memberId', as: 'appointments' })
Appointment.belongsTo(Member, { foreignKey: 'memberId', as: 'member' })

Appointment.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' })
User.hasMany(Appointment, { foreignKey: 'createdBy', as: 'appointments' })

Appointment.hasMany(AppointmentParticipant, { foreignKey: 'appointmentId', as: 'participants' })
AppointmentParticipant.belongsTo(Appointment, { foreignKey: 'appointmentId', as: 'appointment' })
AppointmentParticipant.belongsTo(Member, { foreignKey: 'memberId', as: 'member' })

// ── Sacraments ──────────────────────────────────────────────────────
Member.hasOne(Sacrament, { foreignKey: 'memberId', as: 'sacrament' })
Sacrament.belongsTo(Member, { foreignKey: 'memberId', as: 'member' })

Sacrament.hasMany(Godparent, { foreignKey: 'sacramentId', as: 'godparents' })
Godparent.belongsTo(Sacrament, { foreignKey: 'sacramentId', as: 'sacrament' })

// ── Pastoral Notes ──────────────────────────────────────────────────
Member.hasMany(PastoralNote, { foreignKey: 'memberId', as: 'pastoralNotes' })
PastoralNote.belongsTo(Member, { foreignKey: 'memberId', as: 'member' })

PastoralNote.belongsTo(User, { foreignKey: 'authorId', as: 'author' })
User.hasMany(PastoralNote, { foreignKey: 'authorId', as: 'pastoralNotes' })

// ── Accounting: Account (self-referencing) ──────────────────────────
Account.belongsTo(Account, { foreignKey: 'parentAccount', as: 'parentAccountData' })
Account.hasMany(Account, { foreignKey: 'parentAccount', as: 'children' })

// ── Accounting: Product ─────────────────────────────────────────────
Product.belongsTo(Account, { foreignKey: 'incomeAccountId', as: 'incomeAccount' })
Account.hasMany(Product, { foreignKey: 'incomeAccountId', as: 'products' })

// ── Accounting: JournalEntry ────────────────────────────────────────
JournalEntry.belongsTo(Account, { foreignKey: 'account', as: 'accountData' })
Account.hasMany(JournalEntry, { foreignKey: 'account', as: 'journalEntries' })

JournalEntry.belongsTo(Product, { foreignKey: 'product', as: 'productData' })
Product.hasMany(JournalEntry, { foreignKey: 'product', as: 'journalEntries' })

JournalEntry.belongsTo(User, { foreignKey: 'createdBy', as: 'createdByData' })
User.hasMany(JournalEntry, { foreignKey: 'createdBy', as: 'journalEntries' })

// ── Accounting: CashClosing ─────────────────────────────────────────
CashClosing.belongsTo(User, { foreignKey: 'createdBy', as: 'createdByData' })
User.hasMany(CashClosing, { foreignKey: 'createdBy', as: 'cashClosings' })

CashClosing.hasMany(CashDenomination, { foreignKey: 'cashClosingId', as: 'denominations' })
CashDenomination.belongsTo(CashClosing, { foreignKey: 'cashClosingId', as: 'cashClosing' })

// ── Accounting: Counter ─────────────────────────────────────────────
// No associations needed

export {
    sequelize,
    Department,
    Municipality,
    Appointment,
    AppointmentParticipant,
    Configuration,
    Member,
    User,
    FamilyMember,
    Sacrament,
    PastoralNote,
    Godparent,
    Account,
    Product,
    JournalEntry,
    Counter,
    CashClosing,
    CashDenomination,
}
