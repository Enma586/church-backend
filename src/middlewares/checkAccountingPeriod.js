import Configuration from '../models/config/Configuration.js'
import { AppError } from '../utils/AppError.js'

export const checkAccountingPeriod = async (req, res, next) => {
    try {
        const transactionDate = req.body.date ? new Date(req.body.date) : new Date()

        const config = await Configuration.findOne()

        if (!config || !config.accountingClosedDate) {
            return next()
        }

        const closedDate = new Date(config.accountingClosedDate)

        if (transactionDate <= closedDate) {
            throw new AppError(
                'Infracción fiscal: El período contable para la fecha proporcionada se encuentra cerrado. No se permiten modificaciones históricas.',
                403
            )
        }

        next()
    } catch (error) {
        next(error)
    }
}
