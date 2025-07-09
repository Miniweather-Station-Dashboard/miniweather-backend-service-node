const recentActivityRepository = require("../../repositories/recent_activity.repository");
const CustomError = require("../../helpers/customError");

const getPaginatedActivities = async (req) => {
  const limit = parseInt(req.query.limit, 10) || 10;
  const offset = parseInt(req.query.offset, 10) || 0;

  const [activities, total] = await Promise.all([
    recentActivityRepository.findAllWithLimit(limit, offset),
    recentActivityRepository.countAll(),
  ]);

  return {
    total,
    limit,
    offset,
    activities,
  };
};

module.exports = {
  getPaginatedActivities,
};
