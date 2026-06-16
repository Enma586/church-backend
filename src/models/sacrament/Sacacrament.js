import { DataTypes } from 'sequelize'
import sequelize from '../../config/db.js'
import { SACRAMENT_TYPE } from '../../constants/index.js'

const Sacrament = sequelize.define('Sacrament', {
    _id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    memberId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
    },
    type: {
        type: DataTypes.ENUM(...SACRAMENT_TYPE),
        allowNull: false,
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    place: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    celebrant: {
        type: DataTypes.STRING,
        allowNull: true,
    },
}, {
    tableName: 'sacraments',
})

export default Sacrament
