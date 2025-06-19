const errorRepository = require("../../repositories/error.repository");
const CustomError = require("../../helpers/customError");

const errorController = {
  /**
   * Retrieves all server errors with pagination.
   * Accessible by 'admin' and 'superAdmin' roles.
   * @param {object} req - The request object containing query parameters for pagination.
   * @returns {Promise<{errors: Array, pagination: object}>} - An object with paginated errors and pagination details.
   * @throws {CustomError} If there's an issue retrieving errors.
   */
  async getAllErrors(req) {
    const { page, limit } = req.query; 
    try {
      const { records, total } = await errorRepository.findAllPaginated({
        page,
        limit,
      });

      return {
        errors: records,
        pagination: {
          page: parseInt(page) || 1, 
          limit: parseInt(limit) || 10, 
          total,
          totalPages: Math.ceil(total / (parseInt(limit) || 10)),
        },
      };
    } catch (err) {
      console.error("Error in getAllErrors (ErrorController):", err);
      // Re-throw as CustomError for consistent error handling
      throw new CustomError({
        message: "Failed to retrieve server errors.",
        statusCode: 500,
        errors: err.message,
      });
    }
  },

  /**
   * Retrieves a single server error by its ID.
   * Accessible by 'admin' and 'superAdmin' roles.
   * @param {object} req - The request object containing the error ID in params.
   * @returns {Promise<{error: object}>} - An object containing the requested error.
   * @throws {CustomError} If the error is not found or an error occurs during retrieval.
   */
  async getErrorById(req) {
    const { id } = req.params;

    try {
      const errorRecord = await errorRepository.findById(id);

      if (!errorRecord) {
        throw new CustomError({
          message: `Server error with ID ${id} not found.`,
          statusCode: 404,
        });
      }

      return {
        error: errorRecord,
      };
    } catch (err) {
      console.error(`Error in getErrorById (ErrorController) for ID ${id}:`, err);
      // Pass through CustomErrors, wrap others
      if (err instanceof CustomError) {
        throw err;
      }
      throw new CustomError({
        message: `Failed to retrieve server error with ID ${id}.`,
        statusCode: 500,
        errors: err.message,
      });
    }
  },

  /**
   * Deletes a server error record by its ID.
   * Accessible by 'superAdmin' role.
   * @param {object} req - The request object containing the error ID in params.
   * @returns {Promise<{message: string}>} - A success message.
   * @throws {CustomError} If the error is not found or an error occurs during deletion.
   */
  async deleteError(req) {
    const { id } = req.params;

    try {
      const deleted = await errorRepository.delete(id);

      if (!deleted) {
        throw new CustomError({
          message: `Server error with ID ${id} not found for deletion.`,
          statusCode: 404,
        });
      }

      return {
        message: `Server error with ID ${id} deleted successfully.`,
      };
    } catch (err) {
      console.error(`Error in deleteError (ErrorController) for ID ${id}:`, err);
      if (err instanceof CustomError) {
        throw err;
      }
      throw new CustomError({
        message: `Failed to delete server error with ID ${id}.`,
        statusCode: 500,
        errors: err.message,
      });
    }
  },
};

module.exports = errorController;
