const articleRepository = require("../../repositories/article.repository");
const CustomError = require("../../helpers/customError");
const { getAuthToken } = require("../../worker/hyperbaseAuthWorker");

const BASE_URL = process.env.HYPERBASE_HOST;
const PROJECT_ID = process.env.HYPERBASE_PROJECT_ID;
const BUCKET_ID = process.env.HYPERBASE_BUCKET_ID;

const getImageUrl = (imageId) => {
  if (!imageId) {
    return null;
  }
  const TOKEN = getAuthToken();

  return `${BASE_URL}/api/rest/project/${PROJECT_ID}/bucket/${BUCKET_ID}/file/${imageId}?token=${TOKEN}`;
};

/**
 * @param {object} imageConfig
 * @param {Buffer} imageConfig.imageDataBuffer
 * @param {string} imageConfig.originalFileName
 * @param {string} imageConfig.mimeType
 * @returns {Promise<string|null>}
 * @throws {CustomError}
 */
const uploadImageToService = async ({
  imageDataBuffer,
  originalFileName,
  mimeType,
}) => {
  const IMAGE_UPLOAD_SERVICE_URL = `${BASE_URL}/api/rest/project/${PROJECT_ID}/bucket/${BUCKET_ID}/file`;

  if (!BASE_URL || !PROJECT_ID || !BUCKET_ID) {
    throw new CustomError({
      message: "Image upload service configuration is missing.",
      statusCode: 500,
    });
  }

  try {
    const blob = new Blob([imageDataBuffer], { type: mimeType });
    const formData = new FormData();
    formData.append("file", blob, originalFileName);
    formData.append("file_name", originalFileName);
    formData.append("public", "true");

    const headers = {};
    const TOKEN = getAuthToken();
    if (TOKEN) {
      headers["Authorization"] = `Bearer ${TOKEN}`;
    }
    const response = await fetch(IMAGE_UPLOAD_SERVICE_URL, {
      method: "POST",
      body: formData,
      headers: headers,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new CustomError({
        message:
          errorData.message ||
          `Image upload failed with status: ${response.status}`,
        statusCode: response.status,
      });
    }

    const result = await response.json();
    if (!result.data || !result.data.id) {
      throw new CustomError({
        message: "Image upload service did not return an image ID.",
        statusCode: 500,
      });
    }
    return result.data.id;
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    throw new CustomError({
      message: `Error communicating with image upload service: ${error.message}`,
      statusCode: 500,
    });
  }
};

/**
 * @param {object} req
 * @returns {Promise<object>}
 */
const getAllArticles = async (req) => {
  const { page = 1, limit = 10, search } = req.query;
  const { records, total } = await articleRepository.findAllPaginated({
    page,
    limit,
    search,
  });
  const articlesWithImageUrls = records.map((article) => ({
    ...article,
    headerImageUrl: getImageUrl(article.header_image_id),
  }));
  return { articles: articlesWithImageUrls, total };
};

/**
 * @param {object} req
 * @returns {Promise<object>}
 */
const getAllArticlesForAdmin = async (req) => {
  const { page = 1, limit = 10, search } = req.query;
  const { records, total } = await articleRepository.findAllPaginatedForAdmin({
    page,
    limit,
    search,
  });
  const articlesWithImageUrls = records.map((article) => ({
    ...article,
    headerImageUrl: getImageUrl(article.header_image_id),
  }));
  return { articles: articlesWithImageUrls, total };
};

/**
 * @param {object} req
 * @returns {Promise<object>}
 * @throws {CustomError}
 */
const getArticleById = async (req) => {
  const { id } = req.params;
  const record = await articleRepository.findById(id);

  if (!record) {
    throw new CustomError({
      message: "Article not found",
      statusCode: 404,
    });
  }

  return {
    article: {
      id: record.id,
      title: record.title,
      content: record.content,
      headerImageId: record.header_image_id,
      headerImageUrl: getImageUrl(record.header_image_id),
      authorId: record.author_id,
      isPublished: record.is_published,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    },
  };
};

/**
 * @param {object} req
 * @returns {Promise<object>}
 * @throws {CustomError}
 */
const createArticle = async (req) => {
  const { title, content, is_published } = req.body;
  const headerImageFile = req.file;
  const author_id = req.user ? req.user.id : null;

  let header_image_id = null;
  if (headerImageFile) {
    header_image_id = await uploadImageToService({
      imageDataBuffer: headerImageFile.buffer,
      originalFileName: headerImageFile.originalname,
      mimeType: headerImageFile.mimetype,
    });
  }

  const newArticle = await articleRepository.create({
    title,
    content,
    header_image_id,
    author_id,
    is_published: is_published !== undefined ? is_published === "true" : false,
  });

  return {
    message: "Article created successfully",
    article: {
      ...newArticle,
      headerImageUrl: getImageUrl(newArticle.header_image_id),
    },
  };
};

/**
 * @param {object} req
 * @returns {Promise<object>}
 * @throws {CustomError}
 */
const updateArticle = async (req) => {
  const { id } = req.params;
  const { title, content, is_published } = req.body;
  const headerImageFile = req.file;

  const existingArticle = await articleRepository.findById(id);
  if (!existingArticle) {
    throw new CustomError({
      message: "Article not found",
      statusCode: 404,
    });
  }

  let new_header_image_id = existingArticle.header_image_id;

  if (headerImageFile) {
    new_header_image_id = await uploadImageToService({
      imageDataBuffer: headerImageFile.buffer,
      originalFileName: headerImageFile.originalname,
      mimeType: headerImageFile.mimetype,
    });
  } else if (req.body.headerImage === "null") {
    new_header_image_id = null;
  }

  const updatedArticle = await articleRepository.update(id, {
    title: title !== undefined ? title : existingArticle.title,
    content: content !== undefined ? content : existingArticle.content,
    header_image_id: new_header_image_id,
    is_published:
      is_published !== undefined
        ? is_published === "true"
        : existingArticle.is_published,
  });

  return {
    message: "Article updated successfully",
    article: {
      ...updatedArticle,
      headerImageUrl: getImageUrl(updatedArticle.header_image_id),
    },
  };
};

/**
 * @param {object} req
 * @returns {Promise<object>}
 * @throws {CustomError}
 */
const deleteArticle = async (req) => {
  const { id } = req.params;
  const existingArticle = await articleRepository.findById(id);

  if (!existingArticle) {
    throw new CustomError({
      message: "Article not found",
      statusCode: 404,
    });
  }

  await articleRepository.delete(id);
  return { message: "Article deleted successfully" };
};

/**
 * @param {object} [options]
 * @param {number} [options.limit=5]
 * @returns {Promise<Array<object>>}
 */
const getCarouselArticles = async ({ limit = 5 } = {}) => {
  const { records } = await articleRepository.findAllPaginated({
    page: 1, // Always get from the first page for "last" articles
    limit: limit, // Use the provided limit or default to 5
    is_published: true, // Only published articles
    orderBy: "created_at", // Order by creation date
    orderDirection: "DESC", // Get the latest articles first
  });

  const carouselData = records
    .filter((article) => article.header_image_id) // Only include articles that actually have a header image
    .map((article) => ({
      id: article.id,
      title: article.title,
      imageUrl: getImageUrl(article.header_image_id), // Use the getImageUrl helper with token
    }));

  return { carouselArticles: carouselData };
};

module.exports = {
  getAllArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  getCarouselArticles,
  getAllArticlesForAdmin,
};
