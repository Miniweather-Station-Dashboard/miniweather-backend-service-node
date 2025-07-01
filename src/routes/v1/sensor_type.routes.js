const express = require("express");
const router = express.Router();
const sensorTypeController = require("../../controllers/v1/sensor_type.controller");
const { validate } = require("../../validator/sensor_type");
const { validationResult } = require("express-validator");
const { successResponse, failedResponse } = require("../../helpers/response");
const CustomError = require("../../helpers/customError");
const authenticate = require("../../middlewares/auth.middleware");
const roleMiddleware = require("../../middlewares/role.middleware");

/**
 * @swagger
 * tags:
 *   name: SensorTypes
 *   description: Manage sensor types
 */

/**
 * @swagger
 * /v1/sensor-types:
 *   get:
 *     summary: Get all sensor types
 *     tags: [SensorTypes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sensor types retrieved successfully
 */
router.get(
  "/",
  authenticate,
  roleMiddleware(["admin", "superAdmin"]),
  async (req, res) => {
    try {
      const result = await sensorTypeController.getAllSensorTypes();
      res
        .status(200)
        .json(
          successResponse({ message: "Sensor types retrieved", data: result })
        );
    } catch (err) {
      await failedResponse({ res, req, errors: err });
    }
  }
);

/**
 * @swagger
 * /v1/sensor-types/{id}:
 *   get:
 *     summary: Get a sensor type by ID
 *     tags: [SensorTypes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID of the sensor type
 *     responses:
 *       200:
 *         description: Sensor type retrieved successfully
 */
router.get(
  "/:id",
  authenticate,
  roleMiddleware(["admin", "superAdmin"]),
  validate("getSensorTypeById"),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        throw new CustomError({
          message: "Validation failed",
          statusCode: 400,
          errors: errors.array(),
        });

      const result = await sensorTypeController.getSensorTypeById(req);
      res
        .status(200)
        .json(
          successResponse({ message: "Sensor type retrieved", data: result })
        );
    } catch (err) {
      await failedResponse({ res, req, errors: err });
    }
  }
);

/**
 * @swagger
 * /v1/sensor-types:
 *   post:
 *     summary: Create a new sensor type
 *     tags: [SensorTypes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               unit:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Sensor type created successfully
 */
router.post(
  "/",
  authenticate,
  roleMiddleware(["superAdmin"]),
  validate("createSensorType"),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        throw new CustomError({
          message: "Validation failed",
          statusCode: 400,
          errors: errors.array(),
        });

      const result = await sensorTypeController.createSensorType(req);
      res
        .status(201)
        .json(
          successResponse({ message: "Sensor type created", data: result })
        );
    } catch (err) {
      await failedResponse({ res, req, errors: err });
    }
  }
);

/**
 * @swagger
 * /v1/sensor-types/{id}:
 *   put:
 *     summary: Update a sensor type
 *     tags: [SensorTypes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               unit:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sensor type updated successfully
 */
router.put(
  "/:id",
  authenticate,
  roleMiddleware(["superAdmin"]),
  validate("updateSensorType"),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        throw new CustomError({
          message: "Validation failed",
          statusCode: 400,
          errors: errors.array(),
        });

      const result = await sensorTypeController.updateSensorType(req);
      res
        .status(200)
        .json(
          successResponse({ message: "Sensor type updated", data: result })
        );
    } catch (err) {
      await failedResponse({ res, req, errors: err });
    }
  }
);

/**
 * @swagger
 * /v1/sensor-types/{id}:
 *   delete:
 *     summary: Delete a sensor type
 *     tags: [SensorTypes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID of the sensor type
 *     responses:
 *       200:
 *         description: Sensor type deleted successfully
 */
router.delete(
  "/:id",
  authenticate,
  roleMiddleware(["superAdmin"]),
  validate("deleteSensorType"),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        throw new CustomError({
          message: "Validation failed",
          statusCode: 400,
          errors: errors.array(),
        });

      const result = await sensorTypeController.deleteSensorType(req);
      res
        .status(200)
        .json(
          successResponse({ message: "Sensor type deleted", data: result })
        );
    } catch (err) {
      await failedResponse({ res, req, errors: err });
    }
  }
);

module.exports = router;