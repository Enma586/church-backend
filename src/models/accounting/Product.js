import { DataTypes } from 'sequelize'
import sequelize from '../../config/db.js'

const Product = sequelize.define('Product', {
    _id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    defaultPrice: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        get() { const v = this.getDataValue('defaultPrice'); return v === null ? null : parseFloat(v); },
    },
    incomeAccountId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
}, {
    tableName: 'products',
})

export default Product
