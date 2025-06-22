const { pool } = require("../config/postgre");

class ArticleRepository {
  /**
   * @param {object} options - Options for pagination and filtering.
   * @param {number} options.page - Current page number.
   * @param {number} options.limit - Number of records per page.
   * @param {string} [options.search] - Search term for title/content.
   * @returns {Promise<{records: Array, total: number}>}
   */
  async findAllPaginated({ page = 1, limit = 10, search }) {
    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);
    const offset = (parsedPage - 1) * parsedLimit;

    let whereClauses = ["is_published = true"];
    let queryParams = [parsedLimit, offset];
    let paramIndex = 3;

    let countQueryParams = [];

    if (search) {
      whereClauses.push(
        `(title ILIKE $${paramIndex} OR content ILIKE $${paramIndex})`
      );
      queryParams.push(`%${search}%`);

      countQueryParams.push(`%${search}%`);
    }

    const whereString =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const articlesQuery = {
      text: `
            SELECT
                    id,
                    title,
                    content,
                    header_image_id,
                    author_id as "authorId",
                    is_published as "isPublished",
                    created_at as "createdAt",
                    updated_at as "updatedAt"
            FROM articles
            ${whereString}
            ORDER BY created_at DESC
            LIMIT $1 OFFSET $2
        `,
      values: queryParams,
    };

    const countQuery = {
      text: `
            SELECT COUNT(*) FROM articles
            WHERE is_published = true
            ${search ? "AND (title ILIKE $1 OR content ILIKE $1)" : ""}
        `,
      values: search ? countQueryParams : [],
    };

    const [articlesResult, countResult] = await Promise.all([
      pool.query(articlesQuery),
      pool.query(countQuery),
    ]);

    return {
      records: articlesResult.rows,
      total: parseInt(countResult.rows[0].count, 10),
    };
  }

  /**
   * @param {string} id - The UUID of the article.
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    const query = {
      text: `
                SELECT
                        id,
                        title,
                        content,
                        header_image_id,
                        author_id,
                        is_published,
                        created_at,
                        updated_at
                FROM articles
                WHERE id = $1
            `,
      values: [id],
    };
    const res = await pool.query(query);
    return res.rows[0];
  }

  /**
   * @param {object} data - The article data to create.
   * @param {string} data.title - The title of the article.
   * @param {string} data.content - The content of the article.
   * @param {string} [data.header_image_id] - The ID of the header image from the bucket service.
   * @param {string} [data.author_id] - The ID of the author.
   * @param {boolean} [data.is_published=false] - Whether the article is published.
   * @returns {Promise<object>}
   */
  async create({ title, content, header_image_id, author_id, is_published }) {
    const res = await pool.query(
      `INSERT INTO articles (title, content, header_image_id, author_id, is_published)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, title, content, header_image_id, author_id as "authorId", is_published as "isPublished", created_at as "createdAt", updated_at as "updatedAt"`,
      [title, content, header_image_id, author_id, is_published]
    );
    return res.rows[0];
  }

  /**
   * @param {string} id - The UUID of the article to update.
   * @param {object} data - The fields to update.
   * @param {string} [data.title] - The new title.
   * @param {string} [data.content] - The new content.
   * @param {string} [data.header_image_id] - The new header image ID.
   * @param {boolean} [data.is_published] - The new published status.
   * @returns {Promise<object|null>}
   */
  async update(id, { title, content, header_image_id, is_published }) {
    const query = {
      text: `
                UPDATE articles
                SET
                        title = COALESCE($2, title),
                        content = COALESCE($3, content),
                        header_image_id = COALESCE($4, header_image_id),
                        is_published = COALESCE($5, is_published),
                        updated_at = NOW()
                WHERE id = $1
                RETURNING id, title, content, header_image_id, author_id as "authorId", is_published as "isPublished", created_at as "createdAt", updated_at as "updatedAt"
            `,
      values: [id, title, content, header_image_id, is_published],
    };
    const res = await pool.query(query);
    return res.rows[0];
  }

  /**
   * @param {string} id - The UUID of the article to delete.
   * @returns {Promise<object|null>}
   */
  async delete(id) {
    const query = {
      text: `
                DELETE FROM articles
                WHERE id = $1
                RETURNING id
            `,
      values: [id],
    };
    const res = await pool.query(query);
    return res.rows[0];
  }

  /**
   * @returns {Promise<number>}
   */
  async countAll() {
    const query = {
      text: `SELECT COUNT(*) FROM articles`,
    };
    const res = await pool.query(query);
    return parseInt(res.rows[0].count);
  }
}

module.exports = new ArticleRepository();
