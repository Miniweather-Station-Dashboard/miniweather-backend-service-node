const express = require("express");
const router = express.Router();
const authRoutes = require("./auth.routes");
const onboardingDeviceRoutes = require("./onboarding_device.routes");
const weatherDataRoutes = require("./weather_data.routes");
const sensorTypesRoutes = require("./sensor_type.routes")
const userRoutes = require("./user.routes");
const errorRoutes = require("./error.routes");
const warningRoutes = require("./warning.routes");

router.use("/auth", authRoutes);
router.use("/onboarding-device", onboardingDeviceRoutes);
router.use("/weather-data", weatherDataRoutes);
router.use("/sensor-types", sensorTypesRoutes)
router.use("/users", userRoutes);
router.use("/errors", errorRoutes);
router.use("/warnings", warningRoutes);

module.exports = router;
