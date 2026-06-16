import { DataTypes } from 'sequelize'
import sequelize from '../../config/db.js'
import { FAMILY_RELATIONSHIP } from '../../constants/index.js'

const FamilyMember = sequelize.define('FamilyMember', {
    _id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    memberId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    relationship: {
        type: DataTypes.ENUM(...FAMILY_RELATIONSHIP),
        allowNull: false,
    },
    contactNumber: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    isMember: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
}, {
    tableName: 'family_members',
})

export default FamilyMember
