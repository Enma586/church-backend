import { DataTypes } from 'sequelize'
import sequelize from '../../config/db.js'

const CashDenomination = sequelize.define('CashDenomination', {
    _id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    cashClosingId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    denomination: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        get() { const v = this.getDataValue('denomination'); return v === null ? null : parseFloat(v); },
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    subtotal: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        get() { const v = this.getDataValue('subtotal'); return v === null ? null : parseFloat(v); },
    },
}, {
    tableName: 'cash_denominations',
})

export default CashDenomination
