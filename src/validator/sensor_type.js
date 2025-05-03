const { body, param } = require("express-validator");

exports.validate = (method) => {
  switch (method) {
    case "createSensorType": {
      return [
        body("name")
          .exists().withMessage("Name is required")
          .bail()
          .isString().withMessage("Name must be a string")
          .trim(),

        body("unit")
          .optional()
          .isString().withMessage("Unit must be a string")
          .trim(),

        body("description")
          .optional()
          .isString().withMessage("Description must be a string")
          .trim(),
      ];
    }

    case "updateSensorType": {
      return [
        param("id")
          .exists().withMessage("Sensor Type ID is required")
          .bail()
          .isUUID().withMessage("ID must be a valid UUID"),

        body("name")
          .optional()
          .isString().withMessage("Name must be a string")
          .trim(),

        body("unit")
          .optional()
          .isString().withMessage("Unit must be a string")
          .trim(),

        body("description")
          .optional()
          .isString().withMessage("Description must be a string")
          .trim(),
      ];
    }

    case "getOrDeleteSensorType": {
      return [
        param("id")
          .exists().withMessage("Sensor Type ID is required")
          .bail()
          .isUUID().withMessage("ID must be a valid UUID"),
      ];
    }

    default:
      return [];
  }
};
