import { Op } from 'sequelize'
import { Configuration, JournalEntry } from '../../models/index.js'
import { getIO } from '../../config/socket.js'
import { AppError } from '../../utils/AppError.js'
import { parseLocalDate } from '../../utils/date.js'

export const closePeriod = async (date) => {
    const closeDate = parseLocalDate(date)

    if (closeDate > new Date()) {
        throw new AppError('No se puede cerrar el período con una fecha futura', 400)
    }

    const invalidEntries = await JournalEntry.findAll({
        where: {
            date: { [Op.lte]: closeDate },
            status: 'Valido',
            amount: { [Op.lte]: 0 },
        },
    })

    if (invalidEntries.length > 0) {
        throw new AppError(
            `Existen ${invalidEntries.length} asiento(s) con monto inválido. Corríjalos antes de cerrar.`,
            400
        )
    }

    let config = await Configuration.findOne()
    if (!config) {
        throw new AppError('No existe configuración del sistema', 500)
    }

    const previousDate = config.accountingClosedDate

    await config.update({ accountingClosedDate: closeDate })

    const io = getIO()
    io.emit('accounting:period-closed', {
        closedDate: closeDate,
        previousClosedDate: previousDate,
    })

    return {
        closedDate: closeDate,
        previousClosedDate: previousDate,
    }
}

export const reopenPeriod = async () => {
    let config = await Configuration.findOne()
    if (!config) {
        throw new AppError('No existe configuración del sistema', 500)
    }

    if (!config.accountingClosedDate) {
        throw new AppError('El período contable ya se encuentra abierto', 400)
    }

    const previousDate = config.accountingClosedDate

    await config.update({ accountingClosedDate: null })

    const io = getIO()
    io.emit('accounting:period-reopened', {
        previousClosedDate: previousDate,
    })

    return {
        previousClosedDate: previousDate,
        closedDate: null,
    }
}
