import { DataTypes } from 'sequelize'
import sequelize from '../../config/db.js'

const Configuration = sequelize.define('Configuration', {
    _id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    rolePermissions: {
        type: DataTypes.JSONB,
        defaultValue: {},
    },
    googleCalendarId: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'primary',
    },
    googleServiceAccountEmail: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    enableLocalNotifications: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    notificationRefreshInterval: {
        type: DataTypes.INTEGER,
        defaultValue: 60,
    },
    churchName: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Parroquia Local',
    },
    lastBackupDate: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    backupFrequencyDays: {
        type: DataTypes.INTEGER,
        defaultValue: 7,
    },
    accountingClosedDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        defaultValue: null,
    },
    defaultCashAccountId: {
        type: DataTypes.UUID,
        allowNull: true,
        defaultValue: null,
    },
}, {
    tableName: 'configuration',
})

export default Configuration
