const { body, param } = require("express-validator");

exports.validate = (method) => {
  switch (method) {
    case "createOnboardingDevice": {
      return [
        body("name")
          .exists()
          .withMessage("Device name is required")
          .bail()
          .isString()
          .withMessage("Device name must be a string")
          .trim(),

        body("location")
          .exists()
          .withMessage("Location is required")
          .bail()
          .custom((value) => {
            try {
              const coords = JSON.parse(value);
              if (
                !Array.isArray(coords) ||
                coords.length !== 2 ||
                typeof coords[0] !== "number" ||
                typeof coords[1] !== "number"
              ) {
                throw new Error();
              }
              return true;
            } catch {
              throw new Error(
                "Location must be a valid JSON array of two numbers [longitude, latitude]"
              );
            }
          }),

        body("status")
          .exists()
          .withMessage("Status is required")
          .bail()
          .isIn(["active", "inactive"])
          .withMessage("Status must be either 'active' or 'inactive'"),

        body("sensorTypeIds")
          .optional()
          .isArray()
          .withMessage("Sensor Type IDs must be an array")
          .custom((value) => {
            if (value?.some((id) => !id?.trim())) {
              throw new Error("Each Sensor Type ID must be a valid UUID");
            }
            return true;
          }),
      ];
    }

    case "deleteOnboardingDevice":
    case "getByIdOnboardingDevice": {
      return [
        param("id")
          .exists()
          .withMessage("OBD ID parameter is required")
          .bail()
          .isUUID()
          .withMessage("OBD ID must be a valid UUID")
          .trim(),
      ];
    }

    case "updateOnboardingDevice": {
      return [
        param("id")
          .exists()
          .withMessage("OBD ID parameter is required")
          .bail()
          .isUUID()
          .withMessage("OBD ID must be a valid UUID")
          .trim(),

        body("name")
          .optional()
          .isString()
          .withMessage("Device name must be a string")
          .trim(),

        body("location")
          .optional()
          .isString()
          .withMessage("Location must be a string")
          .trim(),

        body("status")
          .optional()
          .isIn(["active", "inactive"])
          .withMessage("Status must be either 'active' or 'inactive'"),

        body("sensorTypeIds")
          .optional()
          .isArray()
          .withMessage("Sensor Type IDs must be an array")
          .custom((value) => {
            if (value?.some((id) => !id?.trim())) {
              throw new Error("Each Sensor Type ID must be a valid UUID");
            }
            return true;
          }),

        body("data_interval_seconds")
          .optional()
          .isInt({ min: 0 })
          .withMessage("Data interval must be a positive integer")
      ];
    }

    default:
      return [];
  }
};
