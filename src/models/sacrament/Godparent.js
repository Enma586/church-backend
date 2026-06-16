import { DataTypes } from 'sequelize'
import sequelize from '../../config/db.js'

const Godparent = sequelize.define('Godparent', {
    _id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    sacramentId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    role: {
        type: DataTypes.STRING,
        defaultValue: 'Padrino/Madrina',
    },
}, {
    tableName: 'godparents',
})

export default Godparent
