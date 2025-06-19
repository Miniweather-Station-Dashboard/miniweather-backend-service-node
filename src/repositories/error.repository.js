const { pool } = require("../config/postgre"); 

class ErrorRepository {
  /**
   * Finds all server errors with pagination.
   * @param {object} options - Pagination options.
   * @param {number} options.page - The current page number.
   * @param {number} options.limit - The number of records per page.
   * @returns {Promise<{records: Array, total: number}>} - An object containing paginated errors and the total count.
   */
  async findAllPaginated({ page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;

    const errorsQuery = {
      text: `
        SELECT
            id,
            message,
            stack,
            request_url,
            request_method,
            request_body,
            created_at AS "createdAt"
        FROM
            public.server_errors
        ORDER BY
            id DESC
        LIMIT $1 OFFSET $2;
      `,
      values: [limit, offset],
    };

    const countQuery = {
      text: "SELECT COUNT(*) FROM public.server_errors;",
    };

    try {
      const [errorsResult, countResult] = await Promise.all([
        pool.query(errorsQuery),
        pool.query(countQuery),
      ]);

      return {
        records: errorsResult.rows,
        total: parseInt(countResult.rows[0].count, 10),
      };
    } catch (error) {
      console.error("Error in findAllPaginated (ErrorRepository):", error);
      throw error; // Re-throw to be caught by the controller
    }
  }

  /**
   * Finds a server error by its ID.
   * @param {number} id - The ID of the server error.
   * @returns {Promise<object|null>} - The error object if found, otherwise null.
   */
  async findById(id) {
    const query = {
      text: `
        SELECT
            id,
            message,
            stack,
            request_url,
            request_method,
            request_body,
            created_at AS "createdAt"
        FROM
            public.server_errors
        WHERE
            id = $1;
      `,
      values: [id],
    };

    try {
      const res = await pool.query(query);
      return res.rows[0];
    } catch (error) {
      console.error(`Error in findById (ErrorRepository) for ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Creates a new server error record.
   * This would typically be called by a centralized error handling mechanism or logging.
   * @param {object} errorData - The error data to insert.
   * @param {string} errorData.message - The error message.
   * @param {string} [errorData.stack] - The error stack trace.
   * @param {string} [errorData.request_url] - The URL of the request that caused the error.
   * @param {string} [errorData.request_method] - The HTTP method of the request.
   * @param {object} [errorData.request_body] - The JSON body of the request.
   * @returns {Promise<object>} - The newly created error record.
   */
  async create({ message, stack, request_url, request_method, request_body }) {
    const query = {
      text: `
        INSERT INTO public.server_errors
            (message, stack, request_url, request_method, request_body)
        VALUES
            ($1, $2, $3, $4, $5)
        RETURNING
            id, message, stack, request_url, request_method, request_body, created_at AS "createdAt";
      `,
      values: [message, stack, request_url, request_method, JSON.stringify(request_body)],
    };

    try {
      const res = await pool.query(query);
      return res.rows[0];
    } catch (error) {
      console.error("Error in create (ErrorRepository):", error);
      throw error;
    }
  }

  /**
   * Deletes a server error record by its ID.
   * @param {number} id - The ID of the server error to delete.
   * @returns {Promise<boolean>} - True if the error was deleted, false otherwise.
   */
  async delete(id) {
    const query = {
      text: `
        DELETE FROM public.server_errors
        WHERE id = $1
        RETURNING id;
      `,
      values: [id],
    };

    try {
      const res = await pool.query(query);
      return res.rowCount > 0;
    } catch (error) {
      console.error(`Error in delete (ErrorRepository) for ID ${id}:`, error);
      throw error;
    }
  }
}

module.exports = new ErrorRepository();
