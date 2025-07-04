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
        body("name")
          .optional()
          .isString().withMessage("Name must be a string")
          .trim(),

        body("role")
          .optional()
          .isIn(["admin", "superAdmin"]).withMessage("Invalid role"),
      ];
    }

    default:
      return [];
  }
};