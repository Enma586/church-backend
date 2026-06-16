import { DataTypes } from 'sequelize'
import sequelize from '../../config/db.js'

const AppointmentParticipant = sequelize.define('AppointmentParticipant', {
    _id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    appointmentId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    memberId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
}, {
    tableName: 'appointment_participants',
})

export default AppointmentParticipant
