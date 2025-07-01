const express = require("express");
const router = express.Router();
const userController = require("../../controllers/v1//user.controller");
const { validate } = require("../../validator/user");
const { successResponse, failedResponse } = require("../../helpers/response");
const CustomError = require("../../helpers/customError");
const authenticate = require("../../middlewares/auth.middleware");
const roleMiddleware = require("../../middlewares/role.middleware");
const { validationResult } = require("express-validator");

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management
 */

/**
 * @swagger
 * /v1/users:
 *   get:
 *     summary: Get all users (Admin/Superadmin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 */
router.get(
  "/",
  authenticate,
  roleMiddleware(["admin", "superAdmin"]), // Restrict to admins
  async (req, res) => {
    try {
      const result = await userController.getAllUsers(req);
      res.status(200).json(successResponse({ message: "Users retrieved", data: result }));
    } catch (err) {
      console.error("Error fetching users:", err);
      await failedResponse({ res, req, errors: err });
    }
  }
);

/**
 * @swagger
 * /v1/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User data
 */
router.get(
  "/:id",
  authenticate,
  roleMiddleware(["admin", "superAdmin"]), 
  validate("getUserById"),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new CustomError({ message: "Validation failed", statusCode: 400, errors: errors.array() });

      const result = await userController.getUserById(req);
      res.status(200).json(successResponse({ message: "User retrieved", data: result }));
    } catch (err) {
      await failedResponse({ res, req, errors: err });
    }
  }
);

/**
 * @swagger
 * /v1/users/{id}:
 *   put:
 *     summary: Update user (Admin/Superadmin or self)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [user, admin, superadmin]
 *     responses:
 *       200:
 *         description: User updated
 */
router.put(
  "/:id",
  authenticate,
  roleMiddleware(["superAdmin"]),
  validate("updateUser"),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new CustomError({ message: "Validation failed", statusCode: 400, errors: errors.array() });

      // Allow only admins or the user themselves to update
      if (req.user.role !== "superAdmin" && req.user.role !== "admin" && req.user.id !== req.params.id) {
        throw new CustomError({ message: "Forbidden", statusCode: 403 });
      }

      const result = await userController.updateUser(req);
      res.status(200).json(successResponse({ message: "User updated", data: result }));
    } catch (err) {
      await failedResponse({ res, req, errors: err });
    }
  }
);

/**
 * @swagger
 * /v1/users/{id}:
 *   delete:
 *     summary: Delete user (Superadmin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User deleted
 */
router.delete(
  "/:id",
  authenticate,
  roleMiddleware(["superAdmin"]), 
  validate("deleteUser"),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new CustomError({ message: "Validation failed", statusCode: 400, errors: errors.array() });

      const result = await userController.deleteUser(req);
      res.status(200).json(successResponse({ message: "User deleted", data: result }));
    } catch (err) {
      await failedResponse({ res, req, errors: err });
    }
  }
);

module.exports = router;