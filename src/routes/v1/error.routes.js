const express = require("express");
const router = express.Router();
const errorController = require("../../controllers/v1/error.controller");
const { successResponse, failedResponse } = require("../../helpers/response");
const authenticate = require("../../middlewares/auth.middleware");
const roleMiddleware = require("../../middlewares/role.middleware");
const { validationResult } = require("express-validator");

/**
 * @swagger
 * tags:
 *   name: Errors
 *   description: Server Error management
 */

/**
 * @swagger
 * /v1/errors:
 *   get:
 *     summary: Get all server errors with pagination (Admin/Superadmin only)
 *     tags: [Errors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of server errors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Errors retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           message:
 *                             type: string
 *                           stack:
 *                             type: string
 *                           request_url:
 *                             type: string
 *                           request_method:
 *                             type: string
 *                           request_body:
 *                             type: object
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
    "/",
    authenticate,
    roleMiddleware(["admin", "superAdmin", "user"]),
    async (req, res) => {
        try {
            const result = await errorController.getAllErrors(req);
            res.status(200).json(successResponse({ message: "Errors retrieved successfully", data: result }));
        } catch (err) {
            console.error("Error fetching errors:", err);
            await failedResponse({ res, req, errors: err });
        }
    }
);

module.exports = router;
