const { body, param } = require("express-validator");

exports.validate = (method) => {
  switch (method) {
    case "getUserById":
    case "deleteUser": {
      return [
        param("id")
          .exists().withMessage("User ID is required")
          .isUUID().withMessage("ID must be a valid UUID"),
      ];
    }

    case "updateUser": {
      return [
        param("id")
          .exists().withMessage("User ID is required")
          .isUUID().withMessage("ID must be a valid UUID"),

        body("name")
          .optional()
          .isString().withMessage("Name must be a string")
          .trim(),

        body("role")
          .optional()
          .isIn(["user", "admin", "superadmin"]).withMessage("Invalid role"),
      ];
    }

    default:
      return [];
  }
};