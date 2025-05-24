const weatherDataRepository = require("../../repositories/weather_data.repository");
const CustomError = require("../../helpers/customError");

const getWeatherDataAverages = async (req) => {
  let { startTime, endTime, timezone, interval = 'minute' } = req.query;
  
  // Validate and parse time inputs
  if (!startTime || !endTime) {
    throw new CustomError({
      message: "Both startTime and endTime are required",
      statusCode: 400,
    });
  }

  // Convert to Date objects
  startTime = new Date(startTime);
  endTime = new Date(endTime);

  // Validate date range
  if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
    throw new CustomError({
      message: "Invalid date format. Use ISO format (e.g., 2023-01-01T00:00:00Z)",
      statusCode: 400,
    });
  }

  if (startTime >= endTime) {
    throw new CustomError({
      message: "startTime must be before endTime",
      statusCode: 400,
    });
  }

  // Limit range to maximum 7 days to prevent heavy queries
  const maxRange = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  if ((endTime - startTime) > maxRange) {
    throw new CustomError({
      message: "Time range cannot exceed 7 days",
      statusCode: 400,
    });
  }

  // Get data based on requested interval
  let data;
  switch (interval) {
    case 'minute':
      data = await weatherDataRepository.getMinuteAverages({
        startTime,
        endTime,
        timezone: timezone || 'UTC'
      });
      break;
    case 'raw':
      data = await weatherDataRepository.getDataInTimeRange({
        startTime,
        endTime
      });
      break;
    default:
      throw new CustomError({
        message: "Invalid interval. Use 'minute' or 'raw'",
        statusCode: 400,
      });
  }

  return {
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    interval,
    timezone: timezone || 'UTC',
    data
  };
};

const createWeatherData = async (req) => {
  const { pressure, wind_speed, temperature, rainfall } = req.body;
  const userId = req.user?.id;

  if (!pressure || !wind_speed || !temperature || !rainfall) {
    throw new CustomError({
      message: "All weather parameters (pressure, wind_speed, temperature, rainfall) are required",
      statusCode: 400,
    });
  }

  const record = await weatherDataRepository.create({
    pressure,
    wind_speed,
    temperature,
    rainfall,
    createdBy: userId
  });

  return { message: "Weather data recorded successfully", record };
};

module.exports = {
  getWeatherDataAverages,
  createWeatherData
};