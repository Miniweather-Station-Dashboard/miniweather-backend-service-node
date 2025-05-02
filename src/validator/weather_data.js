const { body, query } = require("express-validator");

exports.validate = (method) => {
    switch (method) {
        case "getWeatherData": {
            return [
                query("startTime")
                    .notEmpty()
                    .withMessage("Start time is required")
                    .isISO8601()
                    .withMessage("Invalid date format. Use ISO format (e.g., 2023-01-01T00:00:00Z)"),
                query("endTime")
                    .notEmpty()
                    .withMessage("End time is required")
                    .isISO8601()
                    .withMessage("Invalid date format. Use ISO format (e.g., 2023-01-01T00:00:00Z)"),
                query("interval")
                    .optional()
                    .isIn(["minute", "raw"])
                    .withMessage("Interval must be either 'minute' or 'raw'"),
                query("timezone")
                    .optional()
                    .isString()
                    .withMessage("Timezone must be a string")
            ];
        }
        case "createWeatherData": {
            return [
                body("pressure")
                    .notEmpty()
                    .withMessage("Pressure is required")
                    .isFloat()
                    .withMessage("Pressure must be a number"),
                body("wind_speed")
                    .notEmpty()
                    .withMessage("Wind speed is required")
                    .isFloat()
                    .withMessage("Wind speed must be a number"),
                body("temperature")
                    .notEmpty()
                    .withMessage("Temperature is required")
                    .isFloat()
                    .withMessage("Temperature must be a number"),
                body("rainfall")
                    .notEmpty()
                    .withMessage("Rainfall is required")
                    .isFloat()
                    .withMessage("Rainfall must be a number")
            ];
        }
        default: {
            return [];
        }
    }
};