const logger = {
    info: (message) => console.log(`[INFO] ${message}`),
    error: (message) => console.error(`[ERROR] ${message}`),
    warning: (message) => console.warn(`[WARNING] ${message}`),
  };
  
  module.exports = logger;
  