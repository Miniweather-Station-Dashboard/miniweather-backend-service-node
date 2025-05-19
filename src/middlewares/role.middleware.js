const CustomError = require("../helpers/customError");

/**
 * Role-based access control middleware
 * @param {string[]} allowedRoles - Array of roles (e.g., ["admin", "superadmin"])
 */
const roleMiddleware = (allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res
      .status(401)
      .json({ message: "Unauthorized: No user data" });
  }

  if (!allowedRoles.includes(req.user.role)) {
    return res
      .status(403)
      .json({ message: "Forbidden: Insufficient permissions" });
  }

  next();
};

module.exports = roleMiddleware;
