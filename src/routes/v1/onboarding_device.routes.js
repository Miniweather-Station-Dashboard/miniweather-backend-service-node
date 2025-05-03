const express = require("express");
const router = express.Router();
const onboardingDeviceController = require("../../controllers/v1/onboarding_device.controller");
const { validate } = require("../../validator/onboarding_device");
const { validationResult } = require("express-validator");
const { successResponse, failedResponse } = require("../../helpers/response");
const CustomError = require("../../helpers/customError");
const authenticate = require("../../middlewares/auth.middleware");

/**
 * @swagger
 * tags:
 *   name: OnboardingDevice
 *   description: Onboarding device CRUD operations
 */

/**
 * @swagger
 * /v1/onboarding-device:
 *   post:
 *     summary: Create a new onboarding device
 *     tags: [OnboardingDevice]
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
 *               - type
 *               - location
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *               location:
 *                 type: string
 *     responses:
 *       201:
 *         description: Device created successfully
 */
router.post(
  "/",
  authenticate,
  validate("createOnboardingDevice"),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        throw new CustomError({
          message: "Validation failed",
          statusCode: 400,
          errors: errors.array(),
        });

      const result = await onboardingDeviceController.createOnboardingDevice(
        req
      );
      res
        .status(201)
        .json(successResponse({ message: "Device created", data: result }));
    } catch (err) {
      console.error(err);
      await failedResponse({ res, req, errors: err });
    }
  }
);

/**
 * @swagger
 * /v1/onboarding-device:
 *   get:
 *     summary: Get all onboarding devices
 *     tags: [OnboardingDevice]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of devices
 */
router.get("/", async (req, res) => {
  try {
    const result = await onboardingDeviceController.getAllOnboardingDevices(
      req
    );
    res
      .status(200)
      .json(successResponse({ message: "Devices retrieved", data: result }));
  } catch (err) {
    await failedResponse({ res, req, errors: err });
  }
});

/**
 * @swagger
 * /v1/onboarding-device/{id}:
 *   get:
 *     summary: Get an onboarding device by ID
 *     tags: [OnboardingDevice]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Single device data
 */
router.get(
  "/:id",
  authenticate,
  validate("getByIdOnboardingDevice"),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        throw new CustomError({
          message: "Validation failed",
          statusCode: 400,
          errors: errors.array(),
        });

      const result = await onboardingDeviceController.getOnboardingDeviceById(
        req
      );
      res
        .status(200)
        .json(successResponse({ message: "Device retrieved", data: result }));
    } catch (err) {
      await failedResponse({ res, req, errors: err });
    }
  }
);

/**
 * @swagger
 * /v1/onboarding-device/{id}:
 *   put:
 *     summary: Update an onboarding device
 *     tags: [OnboardingDevice]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *               location:
 *                 type: string
 *     responses:
 *       200:
 *         description: Device updated
 */
router.put(
  "/:id",
  authenticate,
  validate("updateOnboardingDevice"),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        throw new CustomError({
          message: "Validation failed",
          statusCode: 400,
          errors: errors.array(),
        });

      const result = await onboardingDeviceController.updateOnboardingDevice(
        req
      );
      res
        .status(200)
        .json(successResponse({ message: "Device updated", data: result }));
    } catch (err) {
      await failedResponse({ res, req, errors: err });
    }
  }
);

/**
 * @swagger
 * /v1/onboarding-device/{id}:
 *   delete:
 *     summary: Delete an onboarding device
 *     tags: [OnboardingDevice]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Device deleted
 */
router.delete(
  "/:id",
  authenticate,
  validate("deleteOnboardingDevice"),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        throw new CustomError({
          message: "Validation failed",
          statusCode: 400,
          errors: errors.array(),
        });

      const result = await onboardingDeviceController.deleteOnboardingDevice(
        req
      );
      res
        .status(200)
        .json(successResponse({ message: "Device deleted", data: result }));
    } catch (err) {
      await failedResponse({ res, req, errors: err });
    }
  }
);

module.exports = router;
