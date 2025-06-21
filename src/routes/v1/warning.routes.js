const express = require("express");
const router = express.Router();
const warningController = require("../../controllers/v1/warning.controller");
const { validate } = require("../../validator/warning");
const { successResponse, failedResponse } = require("../../helpers/response");
const CustomError = require("../../helpers/customError");
const authenticate = require("../../middlewares/auth.middleware");
const roleMiddleware = require("../../middlewares/role.middleware");
const { validationResult } = require("express-validator");

router.get("/", authenticate, async (req, res) => {
    try {
        const result = await warningController.getAllWarnings(req);
        res
            .status(200)
            .json(successResponse({ message: "Warnings retrieved", data: result }));
    } catch (err) {
        console.error("Error fetching warnings:", err);
        await failedResponse({ res, req, errors: err });
    }
});

router.get(
    "/:id",
    authenticate,
    validate("getWarningById"),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty())
                throw new CustomError({
                    message: "Validation failed",
                    statusCode: 400,
                    errors: errors.array(),
                });

            const result = await warningController.getWarningById(req);
            res
                .status(200)
                .json(successResponse({ message: "Warning retrieved", data: result }));
        } catch (err) {
            await failedResponse({ res, req, errors: err });
        }
    }
);

router.post(
    "/",
    authenticate,
    roleMiddleware(["admin", "superAdmin"]),
    validate("createWarning"),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty())
                throw new CustomError({
                    message: "Validation failed",
                    statusCode: 400,
                    errors: errors.array(),
                });

            const result = await warningController.createWarning(req);
            res
                .status(201)
                .json(
                    successResponse({
                        message: "Warning created successfully",
                        data: result,
                    })
                );
        } catch (err) {
            await failedResponse({ res, req, errors: err });
        }
    }
);

router.put(
    "/:id",
    authenticate,
    roleMiddleware(["admin", "superAdmin"]),
    validate("updateWarning"),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty())
                throw new CustomError({
                    message: "Validation failed",
                    statusCode: 400,
                    errors: errors.array(),
                });

            const result = await warningController.updateWarning(req);
            res
                .status(200)
                .json(successResponse({ message: "Warning updated", data: result }));
        } catch (err) {
            await failedResponse({ res, req, errors: err });
        }
    }
);

router.delete(
    "/:id",
    authenticate,
    roleMiddleware(["superAdmin"]),
    validate("deleteWarning"),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty())
                throw new CustomError({
                    message: "Validation failed",
                    statusCode: 400,
                    errors: errors.array(),
                });

            const result = await warningController.deleteWarning(req);
            res
                .status(200)
                .json(successResponse({ message: "Warning deleted", data: result }));
        } catch (err) {
            await failedResponse({ res, req, errors: err });
        }
    }
);

module.exports = router;
