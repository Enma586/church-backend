import { Configuration } from '../../models/index.js';

/**
 * Retrieves the single system configuration document.
 * The configuration collection uses a singleton pattern — only one document should exist.
 * @returns {Promise<Document|null>} The configuration document, or null if none exists yet.
 */
export const getConfiguration = async () => {
    return await Configuration.findOne();
};

/**
 * Updates the existing configuration or creates a new one if none exists.
 * This ensures the singleton invariant: exactly one configuration document in the collection.
 * @param {Object} data - Configuration fields to set or update (googleCalendarId, churchName, etc.).
 * @returns {Promise<Document>} The updated or newly created configuration document.
 */
export const updateOrCreateConfiguration = async (data) => {
    const config = await Configuration.findOne();
    if (config) {
        return await Configuration.findByIdAndUpdate(config._id, data, { new: true, runValidators: true });
    }
    return await Configuration.create(data);
};
