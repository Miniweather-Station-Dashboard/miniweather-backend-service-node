const weatherDataRepository = require("../../repositories/weather_data.repository");
const CustomError = require("../../helpers/customError");

const getWeatherDataAverages = async (req) => {
  let { startTime, endTime, timezone, interval = 'minute', deviceId } = req.query;

  // Validate required fields
  if (!deviceId) {
    throw new CustomError({
      message: "deviceId is required",
      statusCode: 400,
    });
  }

  if (!startTime || !endTime) {
    throw new CustomError({
      message: "Both startTime and endTime are required",
      statusCode: 400,
    });
  }

  startTime = new Date(startTime);
  endTime = new Date(endTime);

  if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
    throw new CustomError({
      message: "Invalid date format. Use ISO format",
      statusCode: 400,
    });
  }

  if (startTime >= endTime) {
    throw new CustomError({
      message: "startTime must be before endTime",
      statusCode: 400,
    });
  }

  const maxRange = 7 * 24 * 60 * 60 * 1000;
  if ((endTime - startTime) > maxRange) {
    throw new CustomError({
      message: "Time range cannot exceed 7 days",
      statusCode: 400,
    });
  }

  // Generate dynamic table name from device ID
  const tableName = `records_${deviceId.replace(/-/g, "")}`;

  // Fetch data from correct table
  let data;
  switch (interval) {
    case 'minute':
      data = await weatherDataRepository.getMinuteAverages({
        startTime,
        endTime,
        timezone: timezone || 'UTC',
        tableName
      });
      break;
    case 'raw':
      data = await weatherDataRepository.getDataInTimeRange({
        startTime,
        endTime,
        tableName
      });
      break;
    default:
      throw new CustomError({
        message: "Invalid interval. Use 'minute' or 'raw'",
        statusCode: 400,
      });
  }

  return {
    deviceId,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    interval,
    timezone: timezone || 'UTC',
    data
  };
};

module.exports = {
  getWeatherDataAverages
};