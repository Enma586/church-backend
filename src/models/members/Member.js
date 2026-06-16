import { DataTypes } from 'sequelize'
import sequelize from '../../config/db.js'
import { GENDER, MEMBER_STATUS, FAMILY_RELATIONSHIP } from '../../constants/index.js'

const Member = sequelize.define('Member', {
    _id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    fullName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    dateOfBirth: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    gender: {
        type: DataTypes.ENUM(...GENDER),
        allowNull: false,
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    departmentId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    municipalityId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    addressDetails: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM(...MEMBER_STATUS),
        defaultValue: 'Activo',
    },
}, {
    tableName: 'members',
})

export default Member
