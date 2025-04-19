require("dotenv").config();

module.exports = {
  MQTT_BROKER_URL: process.env.MQTT_BROKER_URL ,
  MQTT_TOPIC: process.env.MQTT_TOPIC ,
  MQTT_HYPERBASE_TOPIC: process.env.MQTT_HYPERBASE_TOPIC 
};
