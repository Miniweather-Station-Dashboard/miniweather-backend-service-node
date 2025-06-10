import sensorTypeRepository from "../repositories/sensor_type.repository.js";
import { toSnakeCase } from "./snakeCaseFormater.js";

export const buildSchemaFields = async (sensorTypeIds) => {
  const fieldTemplate = {
    kind: "float",
    hashed: false,
    hidden: false,
    unique: false,
    indexed: false,
    required: false,
    auth_column: false,
    internal_kind: "boolean",
  };

  const schemaFields = {};
  for (const id of sensorTypeIds) {
    const sensorType = await sensorTypeRepository.findById(id);
    if (sensorType && sensorType.name) {
      const fieldName = toSnakeCase(sensorType.name);
      schemaFields[fieldName] = { ...fieldTemplate };
    }
  }

  return schemaFields;
};
