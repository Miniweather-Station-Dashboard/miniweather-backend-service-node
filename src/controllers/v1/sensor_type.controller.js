const sensorTypeRepository = require("../../repositories/sensor_type.repository");
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
  await sensorTypeRepository.delete(id);
  return { message: "Sensor type deleted successfully" };
};

module.exports = {
  createSensorType,
  getAllSensorTypes,
  getSensorTypeById,
  updateSensorType,
  deleteSensorType,
};