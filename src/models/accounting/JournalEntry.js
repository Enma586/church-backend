import { DataTypes } from 'sequelize'
import sequelize from '../../config/db.js'
import { STADO_TYPE, JOURNAL_TYPE } from '../../constants/index.js'

const JournalEntry = sequelize.define('JournalEntry', {
    _id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    voucherNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    type: {
        type: DataTypes.ENUM(...JOURNAL_TYPE),
        allowNull: false,
    },
    concept: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    account: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    product: {
        type: DataTypes.UUID,
        allowNull: true,
        defaultValue: null,
    },
    amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        get() { const v = this.getDataValue('amount'); return v === null ? null : parseFloat(v); },
    },
    status: {
        type: DataTypes.ENUM(...STADO_TYPE),
        defaultValue: 'Valido',
    },
    createdBy: {
        type: DataTypes.UUID,
        allowNull: false,
    },
}, {
    tableName: 'journal_entries',
})

export default JournalEntry
