const express = require("express");
const router = express.Router();
const articleController = require("../../controllers/v1/article.controller");
const { validate } = require("../../validator/article");
const { successResponse, failedResponse } = require("../../helpers/response");
const CustomError = require("../../helpers/customError");
const authenticate = require("../../middlewares/auth.middleware");
const roleMiddleware = require("../../middlewares/role.middleware");
const { validationResult } = require("express-validator");
const uploadFileMiddleware = require("../../middlewares/multer.middleware");

router.get(
    "/",
    authenticate,
    async (req, res) => {
        try {
            const result = await articleController.getAllArticles(req);
            res.status(200).json(successResponse({ message: "Articles retrieved", data: result }));
        } catch (err) {
            console.error("Error fetching articles:", err);
            await failedResponse({ res, req, errors: err });
        }
    }
);

router.get(
    "/:id",
    authenticate,
    validate("getArticleById"),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) throw new CustomError({ message: "Validation failed", statusCode: 400, errors: errors.array() });

            const result = await articleController.getArticleById(req);
            res.status(200).json(successResponse({ message: "Article retrieved", data: result }));
        } catch (err) {
            await failedResponse({ res, req, errors: err });
        }
    }
);

router.post(
    "/",
    authenticate,
    roleMiddleware(["admin", "superAdmin","user"]),
    uploadFileMiddleware.single("headerImage"),
    validate("createArticle"),

    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) throw new CustomError({ message: "Validation failed", statusCode: 400, errors: errors.array() });

            const result = await articleController.createArticle(req);
            res.status(201).json(successResponse({ message: "Article created successfully", data: result }));
        } catch (err) {
            await failedResponse({ res, req, errors: err });
        }
    }
);

router.put(
    "/:id",
    authenticate,
    roleMiddleware(["admin", "superAdmin"]),
    validate("updateArticle"),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) throw new CustomError({ message: "Validation failed", statusCode: 400, errors: errors.array() });

            const result = await articleController.updateArticle(req);
            res.status(200).json(successResponse({ message: "Article updated", data: result }));
        } catch (err) {
            await failedResponse({ res, req, errors: err });
        }
    }
);

router.delete(
    "/:id",
    authenticate,
    roleMiddleware(["superAdmin"]),
    validate("deleteArticle"),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) throw new CustomError({ message: "Validation failed", statusCode: 400, errors: errors.array() });

            const result = await articleController.deleteArticle(req);
            res.status(200).json(successResponse({ message: "Article deleted", data: result }));
        } catch (err) {
            await failedResponse({ res, req, errors: err });
        }
    }
);

module.exports = router;
