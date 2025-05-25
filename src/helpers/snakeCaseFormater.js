export const toSnakeCase = (str) =>
  str
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, "") // remove special chars
    .replace(/\s+/g, "_");