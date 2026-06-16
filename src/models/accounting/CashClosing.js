import { DataTypes } from 'sequelize'
import sequelize from '../../config/db.js'

const CashClosing = sequelize.define('CashClosing', {
    _id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    reference: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    concept: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'Cierre de caja',
    },
    totalCalculated: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        get() { const v = this.getDataValue('totalCalculated'); return v === null ? null : parseFloat(v); },
    },
    expectedBalance: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0,
        get() { const v = this.getDataValue('expectedBalance'); return v === null ? null : parseFloat(v); },
    },
    difference: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0,
        get() { const v = this.getDataValue('difference'); return v === null ? null : parseFloat(v); },
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    createdBy: {
        type: DataTypes.UUID,
        allowNull: false,
    },
}, {
    tableName: 'cash_closings',
})

export default CashClosing
