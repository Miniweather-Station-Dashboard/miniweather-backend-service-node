const express = require("express");
const router = express.Router();
const recentActivityController = require("../../controllers/v1/recent_activity.controller");
const authenticate = require("../../middlewares/auth.middleware");
const roleMiddleware = require("../../middlewares/role.middleware");
const { successResponse, failedResponse } = require("../../helpers/response");

/**
 * @swagger
 * tags:
 *   name: RecentActivity
 *   description: Get recent system activity logs
 */

/**
 * @swagger
 * /v1/recent-activity:
 *   get:
 *     summary: Get recent activity logs (paginated)
 *     tags: [RecentActivity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Offset for pagination
 *     responses:
 *       200:
 *         description: List of recent activity logs
 */
router.get(
  "/",
  authenticate,
  roleMiddleware(["admin", "superAdmin"]),
  async (req, res) => {
    try {
      const result = await recentActivityController.getPaginatedActivities(req);
      res.status(200).json(successResponse({ message: "Activity logs retrieved", data: result }));
    } catch (err) {
      await failedResponse({ res, req, errors: err });
    }
  }
);

module.exports = router;
