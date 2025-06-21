// path: src/validator/warning.js

const { body, param } = require("express-validator");

exports.validate = (method) => {
  switch (method) {
    case "getWarningById":
    case "deleteWarning": {
      return [
        param("id")
          .exists().withMessage("Warning ID is required")
          .isUUID().withMessage("ID must be a valid UUID"),
      ];
    }

    case "createWarning": {
      return [
        body("message")
          .exists().withMessage("Warning message is required")
          .isString().withMessage("Message must be a string")
          .trim()
          .notEmpty().withMessage("Message cannot be empty"),

        body("type")
          .optional()
          .isString().withMessage("Type must be a string")
          .isIn(["general", "weather", "tsunami", "earthquake", "volcano", "flood"])
          .withMessage("Invalid warning type"),

        body("is_active")
          .optional()
          .isBoolean().withMessage("is_active must be a boolean"),
      ];
    }

    case "updateWarning": {
      return [
        param("id")
          .exists().withMessage("Warning ID is required")
          .isUUID().withMessage("ID must be a valid UUID"),

        body("message")
          .optional()
          .isString().withMessage("Message must be a string")
          .trim()
          .notEmpty().withMessage("Message cannot be empty"),

        body("type")
          .optional()
          .isString().withMessage("Type must be a string")
          .isIn(["general", "weather", "tsunami", "earthquake", "volcano", "flood"])
          .withMessage("Invalid warning type"),

        body("is_active")
          .optional()
          .isBoolean().withMessage("is_active must be a boolean"),
      ];
    }

    default:
      return [];
  }
};
