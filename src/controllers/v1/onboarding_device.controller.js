const onboardingDeviceRepository = require("../../repositories/onboarding_device.repository");
const CustomError = require("../../helpers/customError");
const deviceSensorRepository = require("../../repositories/device_sensor.repository");
const sensorTypeRepository = require("../../repositories/sensor_type.repository");
const { withTransaction } = require("../../utils/dbTransaction");
const {
  subscribeToDevice,
  unsubscribeFromDevice,
} = require("../../mqtt/subscriber");
const { buildSchemaFields } = require("../../helpers/buildSchemaFields");
const collectionsRepository = require("../../repositories/collections/collections.factory");

const createOnboardingDevice = async (req) => {
  const { name, location, status, sensorTypeIds } = req.body;
  const userId = req.user.id;

  if (!["active", "inactive"].includes(status)) {
    throw new CustomError({
      message: "Invalid status. Must be 'active' or 'inactive'",
      statusCode: 400,
    });
  }

  return withTransaction(async (client) => {
    const existing = await onboardingDeviceRepository.findByName(name);
    if (existing) {
      throw new CustomError({ message: "Device exists", statusCode: 400 });
    }

    const device = await onboardingDeviceRepository.create(
      { name, location, status, userId },
      client
    );

    if (Array.isArray(sensorTypeIds)) {
      for (const sid of sensorTypeIds) {
        await deviceSensorRepository.create(
          { deviceId: device.id, sensorTypeId: sid },
          client
        );
      }
    }

    const schemaFields = await buildSchemaFields(sensorTypeIds || []);

    await collectionsRepository.create(
      {
        id: device.id,
        name,
        projectId: process.env.HYPERBASE_PROJECT_ID,
        schemaFields: JSON.stringify(schemaFields),
      },
      client
    );

    await collectionsRepository.createCollectionTable(device.id, schemaFields);
    await collectionsRepository.makeCollectionRules(device.id)

    // Subscribe if device is active
    if (status === "active") {
      await subscribeToDevice(device.id);
    }

    return { message: "Device created", device };
  });
};

const getAllOnboardingDevices = async (req) => {
  const limit = parseInt(req.query.limit, 10) || 10;
  const offset = parseInt(req.query.offset, 10) || 0;
  const devices = await onboardingDeviceRepository.findAllWithLimit(
    limit,
    offset
  );
  for (const device of devices) {
    const sensors = await deviceSensorRepository.findByDeviceId(device.id);
    device.sensors = [];

    for (const sensor of sensors) {
      const sensorType = await sensorTypeRepository.findById(
        sensor.sensorTypeId
      );
      device.sensors.push({ ...sensor, sensorType });
    }
  }

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

  const sensors = await deviceSensorRepository.findByDeviceIdWithSensorType(id);

  return { device: { ...device, sensors } };
};

const updateOnboardingDevice = async (req) => {
  const { id } = req.params;
  const { name, location, status, sensorTypeIds } = req.body;

  const device = await onboardingDeviceRepository.findById(id);
  if (!device) {
    throw new CustomError({
      message: "Onboarding device not found",
      statusCode: 404,
    });
  }

  const updatedDevice = await onboardingDeviceRepository.update(id, {
    name,
    location,
    status,
  });

  if (sensorTypeIds && Array.isArray(sensorTypeIds)) {
    await deviceSensorRepository.deleteByDeviceId(id);
    for (const sensorTypeId of sensorTypeIds) {
      await deviceSensorRepository.create({
        deviceId: id,
        sensorTypeId,
      });
    }
  }

  // Handle subscription changes if status was modified
  if (status !== device.status) {
    if (status === "active") {
      await subscribeToDevice(id);
    } else {
      await unsubscribeFromDevice(id);
    }
  }

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

  // Unsubscribe if device was active
  if (device.status === "active") {
    await unsubscribeFromDevice(id);
  }

  return { message: "Onboarding device deleted successfully" };
};

module.exports = {
  createOnboardingDevice,
  getAllOnboardingDevices,
  getOnboardingDeviceById,
  updateOnboardingDevice,
  deleteOnboardingDevice,
};
