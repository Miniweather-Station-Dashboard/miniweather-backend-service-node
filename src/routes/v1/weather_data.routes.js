const express = require("express");
const router = express.Router();
const weatherDataController = require("../../controllers/v1/weather_data.controller");
const { validate } = require("../../validator/weather_data.js");
const { validationResult } = require("express-validator");
const { successResponse, failedResponse } = require("../../helpers/response");
const CustomError = require("../../helpers/customError");
const authenticate = require("../../middlewares/auth.middleware");
const roleMiddleware = require("../../middlewares/role.middleware.js");

/**
 * @swagger
 * tags:
 *   name: WeatherData
 *   description: Weather data collection and retrieval
 */

/**
 * @swagger
 * /v1/weather-data:
 *   get:
 *     summary: Get weather data averages or raw data
 *     tags: [WeatherData]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startTime
 *         schema:
 *           type: string
 *           format: date-time
 *         required: true
 *         description: Start time in ISO format (e.g., 2023-01-01T00:00:00Z)
 *       - in: query
 *         name: endTime
 *         schema:
 *           type: string
 *           format: date-time
 *         required: true
 *         description: End time in ISO format (e.g., 2023-01-01T01:00:00Z)
 *       - in: query
 *         name: interval
 *         schema:
 *           type: string
 *           enum: [minute, raw]
 *         default: minute
 *         description: Data aggregation interval (minute averages or raw data)
 *       - in: query
 *         name: timezone
 *         schema:
 *           type: string
 *         default: UTC
 *         description: Timezone for grouping data (e.g., America/New_York)
 *     responses:
 *       200:
 *         description: Weather data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 startTime:
 *                   type: string
 *                   format: date-time
 *                 endTime:
 *                   type: string
 *                   format: date-time
 *                 interval:
 *                   type: string
 *                 timezone:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       minute:
 *                         type: string
 *                         format: date-time
 *                       avg_pressure:
 *                         type: number
 *                       avg_wind_speed:
 *                         type: number
 *                       avg_temperature:
 *                         type: number
 *                       avg_rainfall:
 *                         type: number
 */
router.get(
  "/",
  validate("getWeatherData"),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        throw new CustomError({
          message: "Validation failed",
          statusCode: 400,
          errors: errors.array(),
        });

      const result = await weatherDataController.getWeatherDataAverages(req);
      res
        .status(200)
        .json(successResponse({ message: "Weather data retrieved", data: result }));
    } catch (err) {
      await failedResponse({ res, req, errors: err });
    }
  }
);

/**
 * @swagger
 * /v1/weather-data:
 *   post:
 *     summary: Record new weather data
 *     tags: [WeatherData]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pressure
 *               - wind_speed
 *               - temperature
 *               - rainfall
 *             properties:
 *               pressure:
 *                 type: number
 *                 description: Atmospheric pressure in hPa
 *               wind_speed:
 *                 type: number
 *                 description: Wind speed in m/s
 *               temperature:
 *                 type: number
 *                 description: Temperature in Celsius
 *               rainfall:
 *                 type: number
 *                 description: Rainfall in mm
 *     responses:
 *       201:
 *         description: Weather data recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 record:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     _created_by:
 *                       type: string
 *                     _updated_at:
 *                       type: string
 *                       format: date-time
 *                     pressure:
 *                       type: number
 *                     wind_speed:
 *                       type: number
 *                     temperature:
 *                       type: number
 *                     rainfall:
 *                       type: number
 */
router.post(
  "/",
  authenticate,
  roleMiddleware(["admin", "superAdmin"]),
  validate("createWeatherData"),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        throw new CustomError({
          message: "Validation failed",
          statusCode: 400,
          errors: errors.array(),
        });

      const result = await weatherDataController.createWeatherData(req);
      res
        .status(201)
        .json(successResponse({ message: "Weather data recorded", data: result }));
    } catch (err) {
      await failedResponse({ res, req, errors: err });
    }
  }
);

module.exports = router;