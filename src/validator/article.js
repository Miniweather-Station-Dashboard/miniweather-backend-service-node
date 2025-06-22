const { body, param } = require("express-validator");

exports.validate = (method) => {
    switch (method) {
        case "getArticleById":
        case "deleteArticle": {
            return [
                param("id")
                    .exists().withMessage("Article ID is required")
                    .isUUID().withMessage("ID must be a valid UUID"),
            ];
        }

        case "createArticle": {
            return [
                body("title")
                    .exists().withMessage("Title is required")
                    .isString().withMessage("Title must be a string")
                    .trim()
                    .notEmpty().withMessage("Title cannot be empty")
                    .isLength({ max: 255 }).withMessage("Title cannot exceed 255 characters"),

                body("content")
                    .exists().withMessage("Content is required")
                    .isString().withMessage("Content must be a string")
                    .trim()
                    .notEmpty().withMessage("Content cannot be empty"),

                body("headerImage")
                    .optional()
                    .isObject().withMessage("headerImage must be an object")
                    .custom((value) => {
                        if (value === null) return true;
                        if (!value.base64Data || !value.fileName || !value.contentType) {
                            throw new Error("headerImage must contain base64Data, fileName, and contentType");
                        }
                        if (!value.base64Data.startsWith('data:')) {
                                throw new Error("base64Data must be a data URL (e.g., data:image/png;base64,...)");
                        }
                        return true;
                    }),

                body("is_published")
                    .optional()
                    .isBoolean().withMessage("is_published must be a boolean"),
            ];
        }

        case "updateArticle": {
            return [
                param("id")
                    .exists().withMessage("Article ID is required")
                    .isUUID().withMessage("ID must be a valid UUID"),

                body("title")
                    .optional()
                    .isString().withMessage("Title must be a string")
                    .trim()
                    .notEmpty().withMessage("Title cannot be empty")
                    .isLength({ max: 255 }).withMessage("Title cannot exceed 255 characters"),

                body("content")
                    .optional()
                    .isString().withMessage("Content must be a string")
                    .trim()
                    .notEmpty().withMessage("Content cannot be empty"),

                body("headerImage")
                    .optional()
                    .custom((value) => {
                        if (value === null) return true;
                        if (typeof value !== 'object' || !value.base64Data || !value.fileName || !value.contentType) {
                            throw new Error("headerImage must be an object with base64Data, fileName, and contentType, or null to remove.");
                        }
                        if (!value.base64Data.startsWith('data:')) {
                                throw new Error("base64Data must be a data URL (e.g., data:image/png;base64,...)");
                        }
                        return true;
                    }),

                body("is_published")
                    .optional()
                    .isBoolean().withMessage("is_published must be a boolean"),
            ];
        }

        default:
            return [];
    }
};
