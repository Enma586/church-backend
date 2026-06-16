import { DataTypes } from 'sequelize'
import sequelize from '../../config/db.js'

const Department = sequelize.define('Department', {
    _id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    isoCode: {
        type: DataTypes.STRING,
        allowNull: true,
    },
}, {
    tableName: 'departments',
})

export default Department
