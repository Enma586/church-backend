import { DataTypes } from 'sequelize'
import sequelize from '../../config/db.js'

const Counter = sequelize.define('Counter', {
    _id: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    seq: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
}, {
    tableName: 'counters',
    timestamps: false,
})

export default Counter
