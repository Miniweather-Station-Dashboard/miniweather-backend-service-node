const express = require("express");
const router = express.Router();
const authRoutes = require("./auth.routes");
const onboardingDeviceRoutes = require("./onboarding_device.routes");

router.use("/auth", authRoutes);
router.use("/onboarding-device", onboardingDeviceRoutes);

module.exports = router;
