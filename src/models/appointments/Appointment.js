import { DataTypes } from 'sequelize'
import sequelize from '../../config/db.js'
import { APPOINTMENT_STATUS, SYNC_STATUS } from '../../constants/index.js'

const Appointment = sequelize.define('Appointment', {
    _id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    type: {
        type: DataTypes.ENUM('cita_pastoral', 'evento_cronograma', 'bloqueo_agenda'),
        defaultValue: 'cita_pastoral',
    },
    memberId: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    allDayDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    startDateTime: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    extras: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    googleEventId: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    syncStatus: {
        type: DataTypes.ENUM(...SYNC_STATUS),
        defaultValue: 'synced',
    },
    status: {
        type: DataTypes.ENUM(...APPOINTMENT_STATUS),
        defaultValue: 'Programada',
    },
    createdBy: {
        type: DataTypes.UUID,
        allowNull: false,
    },
}, {
    tableName: 'appointments',
})

export default Appointment
