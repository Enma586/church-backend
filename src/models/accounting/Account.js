import { DataTypes } from 'sequelize'
import sequelize from '../../config/db.js'
import { CUENTA_TYPE } from '../../constants/index.js'

const Account = sequelize.define('Account', {
    _id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    type: {
        type: DataTypes.ENUM(...CUENTA_TYPE),
        allowNull: false,
    },
    parentAccount: {
        type: DataTypes.UUID,
        allowNull: true,
        defaultValue: null,
    },
    acceptsTransactions: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
}, {
    tableName: 'accounts',
})

export default Account
