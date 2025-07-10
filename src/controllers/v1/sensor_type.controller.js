const sensorTypeRepository = require("../../repositories/sensor_type.repository");
const recentActivityRepository = require("../../repositories/recent_activity.repository"); 

const CustomError = require("../../helpers/customError");

const createSensorType = async (req) => {
  const { name, unit, description } = req.body;

  const existing = await sensorTypeRepository.findByName(name);
  if (existing) {
    throw new CustomError({
      message: "Sensor type with this name already exists",
      statusCode: 400,
    });
  }

  const record = await sensorTypeRepository.create({ name, unit, description });
  await recentActivityRepository.create(`Sensor type created: ${name}`);

  return { message: "Sensor type created successfully", record };
};

const getAllSensorTypes = async () => {
  const records = await sensorTypeRepository.findAllWithLimit();
  return { records };
};

const getSensorTypeById = async (req) => {
  const { id } = req.params;
  const record = await sensorTypeRepository.findById(id);
  if (!record) {
    throw new CustomError({
      message: "Sensor type not found",
      statusCode: 404,
    });
  }
  return { record };
};

const updateSensorType = async (req) => {
  const { id } = req.params;
  const { name, unit, description } = req.body;

  const existing = await sensorTypeRepository.findById(id);
  if (!existing) {
    throw new CustomError({
      message: "Sensor type not found",
      statusCode: 404,
    });
  }

  const updated = await sensorTypeRepository.update(id, {
    name: name || existing.name,
    unit: unit || existing.unit,
    description: description || existing.description,
  });

  await recentActivityRepository.create(`Sensor type updated: ${updated.name}`);

  return { message: "Sensor type updated successfully", record: updated };
};

const deleteSensorType = async (req) => {
  const { id } = req.params;
  const existing = await sensorTypeRepository.findById(id);
  if (!existing) {
    throw new CustomError({
      message: "Sensor type not found",
      statusCode: 404,
    });
  }

  const isUsed = await sensorTypeRepository.isSensorTypeUsed(id);
  if (isUsed) {
    throw new CustomError({
      message: "Cannot delete sensor type that is currently in use by a device",
      statusCode: 400,
    });
  }

  await sensorTypeRepository.delete(id);
  await recentActivityRepository.create(`Sensor type deleted: ${existing.name}`);

  return { message: "Sensor type deleted successfully" };
};


module.exports = {
  createSensorType,
  getAllSensorTypes,
  getSensorTypeById,
  updateSensorType,
  deleteSensorType,
};