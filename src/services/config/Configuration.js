import { Configuration } from '../../models/index.js'

export const getConfiguration = async () => {
    return await Configuration.findOne()
}

export const updateOrCreateConfiguration = async (data) => {
    let config = await Configuration.findOne()
    if (config) {
        await config.update(data)
        return await Configuration.findOne()
    }
    return await Configuration.create(data)
}
