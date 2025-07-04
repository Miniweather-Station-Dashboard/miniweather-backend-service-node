const warningRepository = require("../../repositories/warning.repository");
const CustomError = require("../../helpers/customError");

/**
 * @param {object} req - Express request object.
 * @returns {Promise<object>} - Object containing paginated warnings and total count.
 */
const getAllWarnings = async (req) => {
    const { page = 1, limit = 10 } = req.query;
    const { records, total } = await warningRepository.findAllPaginated({
        page,
        limit,
    });
    return { warnings: records, total };
};

/**
 * @param {object} req - Express request object.
 * @returns {Promise<object>} - Object containing paginated warnings and total count.
 */
const getAllWarningsForAdmin = async (req) => {
    const { page = 1, limit = 10 } = req.query;
    const { records, total } = await warningRepository.findAllPaginatedForAdmin({
        page,
        limit,
    });
    return { warnings: records, total };
};

/**
 * @param {object} req - Express request object.
 * @returns {Promise<object>} - Object containing the warning data.
 * @throws {CustomError} - If the warning is not found.
 */
const getWarningById = async (req) => {
    const { id } = req.params;
    const record = await warningRepository.findById(id);

    if (!record) {
        throw new CustomError({
            message: "Warning not found",
            statusCode: 404,
        });
    }

    return {
        warning: {
            id: record.id,
            message: record.message,
            type: record.type,
            is_active: record.is_active,
            createdAt: record.created_at,
            updatedAt: record.updated_at,
        },
    };
};

/**
 * @param {object} req - Express request object.
 * @returns {Promise<object>} - Object containing the created warning.
 */
const createWarning = async (req) => {
    const { message, type, is_active } = req.body;

    const newWarning = await warningRepository.create({
        message,
        type,
        is_active,
    });

    return {
        message: "Warning created successfully",
        warning: newWarning,
    };
};

/**
 * @param {object} req - Express request object.
 * @returns {Promise<object>} - Object containing the updated warning.
 * @throws {CustomError} - If the warning is not found.
 */
const updateWarning = async (req) => {
    const { id } = req.params;
    const { message, type, is_active } = req.body;

    const existingWarning = await warningRepository.findById(id);
    if (!existingWarning) {
        throw new CustomError({
            message: "Warning not found",
            statusCode: 404,
        });
    }

    const updatedWarning = await warningRepository.update(id, {
        message: message || existingWarning.message,
        type: type || existingWarning.type,
        is_active: is_active !== undefined ? is_active : existingWarning.is_active,
    });

    return {
        message: "Warning updated successfully",
        warning: updatedWarning,
    };
};

/**
 * @param {object} req - Express request object.
 * @returns {Promise<object>} - Object with a success message.
 * @throws {CustomError} - If the warning is not found.
 */
const deleteWarning = async (req) => {
    const { id } = req.params;
    const existingWarning = await warningRepository.findById(id);

    if (!existingWarning) {
        throw new CustomError({
            message: "Warning not found",
            statusCode: 404,
        });
    }

    await warningRepository.delete(id);
    return { message: "Warning deleted successfully" };
};

module.exports = {
    getAllWarnings,
    getWarningById,
    createWarning,
    updateWarning,
    deleteWarning,
    getAllWarningsForAdmin,
};
