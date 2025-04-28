const onboardingDeviceRepository = require("../../repositories/onboarding_device.repository");
const CustomError = require("../../helpers/customError");
const deviceSensorRepository = require("../../repositories/device_sensor.repository");

const createOnboardingDevice = async (req) => {
  const { name, location, status, sensorTypeIds } = req.body;
  const userId = req.user.id;

  if (!["active", "inactive"].includes(status)) {
    throw new CustomError({
      message: "Invalid status. Must be 'active' or 'inactive'",
      statusCode: 400,
    });
  }

  const deviceExists = await onboardingDeviceRepository.findByName(name);
  if (deviceExists) {
    throw new CustomError({
      message: "Device with this name already exists",
      statusCode: 400,
    });
  }

  const device = await onboardingDeviceRepository.create({
    name,
    location,
    userId,
    status,
  });

  if (sensorTypeIds && Array.isArray(sensorTypeIds)) {
    for (const sensorTypeId of sensorTypeIds) {
      await deviceSensorRepository.create({
        deviceId: device.id,
        sensorTypeId,
      });
    }
  }

  return { message: "Onboarding device created successfully", device };
};

const getAllOnboardingDevices = async (req) => {
  const limit = parseInt(req.query.limit, 10) || 10;
  const offset = parseInt(req.query.offset, 10) || 0;

  const devices = await onboardingDeviceRepository.findAllWithLimit(limit, offset);
  return { devices };
};

const getOnboardingDeviceById = async (req) => {
  const { id } = req.params;
  const device = await onboardingDeviceRepository.findById(id);

  if (!device) {
    throw new CustomError({
      message: "Onboarding device not found",
      statusCode: 404,
    });
  }

  return { device };
};

const updateOnboardingDevice = async (req) => {
  const { id } = req.params;
  const { name, location, status } = req.body;

  const device = await onboardingDeviceRepository.findById(id);
  if (!device) {
    throw new CustomError({
      message: "Onboarding device not found",
      statusCode: 404,
    });
  }

  const updatedDevice = await onboardingDeviceRepository.update(id, {
    name: name || device.name,
    location: location || device.location,
    status: status || device.status,
  });

  return {
    message: "Onboarding device updated successfully",
    device: updatedDevice,
  };
};

const deleteOnboardingDevice = async (req) => {
  const { id } = req.params;

  const device = await onboardingDeviceRepository.findById(id);
  if (!device) {
    throw new CustomError({
      message: "Onboarding device not found",
      statusCode: 404,
    });
  }

  await onboardingDeviceRepository.delete(id);
  return { message: "Onboarding device deleted successfully" };
};

module.exports = {
  createOnboardingDevice,
  getAllOnboardingDevices,
  getOnboardingDeviceById,
  updateOnboardingDevice,
  deleteOnboardingDevice,
};
