const userRepository = require("../../repositories/user.repository");
const emailService = require("../../config/nodemailer");
const bcrypt = require("bcrypt");
const {
  generateVerificationCode,
} = require("../../helpers/generateVerificationCode");
const jwt = require("jsonwebtoken");
const CustomError = require("../../helpers/customError");
const generateSecurePassword = require("../../helpers/generateSecurePassword");

const register = async (req, res) => {
  const { name, email, role = "user", is_active = true } = req.body;
  const normalizedEmail = email.toLowerCase();

  if (!req.user || req.user.role !== "superAdmin") {
    throw new CustomError({
      message: "Only super admin can register new users",
      statusCode: 403,
    });
  }
  const userExists = await userRepository.findByEmail(normalizedEmail);
  if (userExists)
    throw new CustomError({ message: "User already exists", statusCode: 400 });

  const generatedPassword = generateSecurePassword();
  const passwordHash = await bcrypt.hash(generatedPassword, 10);

  const user = await userRepository.create({
    name,
    email: normalizedEmail,
    passwordHash,
    is_active,
    role,
  });

  await emailService.sendRegisterMail({
    to: normalizedEmail,
    name,
    email: normalizedEmail,
    password: generatedPassword,
  });

  return {
    message: "User created. Credentials sent via email.",
    user: { id: user.id, email: user.email }, // Don't return password in response
  };
};

const login = async (req, res) => {
  const { email, password } = req.body;

  const normalizedEmail = email.toLowerCase();
  const user = await userRepository.findByEmail(normalizedEmail);

  if (!user) {
    throw new CustomError({ message: "User not found", statusCode: 404 });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    throw new CustomError({
      message: "Invalid email or password",
      statusCode: 401,
    });
  }

  if (!user.is_active) {
    throw new CustomError({ message: "Email not verified", statusCode: 403 });
  }

  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role || "user",
  };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRATION,
  });

  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRATION,
  });

  const expiresInMs =
    parseInt(process.env.JWT_REFRESH_EXPIRATION_MS, 10) ||
    7 * 24 * 60 * 60 * 1000; // fallback to 7 days
  const expiresAt = new Date(Date.now() + expiresInMs);

  await userRepository.saveRefreshToken({
    userId: user.id,
    refreshToken,
    expiresAt,
  });

  return {
    accessToken,
    refreshToken,
  };
};

const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  let payload;
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new CustomError({
      message: "Invalid or expired refresh token",
      statusCode: 403,
    });
  }
  const userId = payload.id;

  const storedToken = await userRepository.findByRefreshToken(refreshToken);
  if (
    !storedToken ||
    storedToken.is_revoked ||
    storedToken.expires_at < new Date()
  ) {
    throw new CustomError({
      message: "Invalid or expired refresh token",
      statusCode: 403,
    });
  }

  await userRepository.revokeRefreshToken(storedToken.id);
  const user = await userRepository.findById(userId);

  if (!user) {
    throw new CustomError({ message: "User not found", statusCode: 404 });
  }

  if (!user.is_active) {
    throw new CustomError({ message: "Email not verified", statusCode: 403 });
  }

  payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role || "user",
  };
  const newAccessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRATION,
  });

  const newRefreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRATION,
  });

  const expiresInMs =
    parseInt(process.env.JWT_REFRESH_EXPIRATION_MS, 10) ||
    7 * 24 * 60 * 60 * 1000; // fallback to 7 days
  const expiresAt = new Date(Date.now() + expiresInMs);
  await userRepository.saveRefreshToken({
    userId,
    refreshToken: newRefreshToken,
    expiresAt,
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

const logout = async (req, res) => {
  const { refreshToken } = req.body;
  const token = await userRepository.findByRefreshToken(refreshToken);

  if (!token) {
    throw new CustomError({
      message: "Already logged out or token not found",
      statusCode: 404,
    });
  }
  if (token) {
    await userRepository.revokeRefreshToken(token.id);
  }

  return { message: "Logged out successfully" };
};

const getCurrentUser = async (req, res) => {
  const user = req.user;
  const existingUser = await userRepository.findByEmail(user.email);

  if (!existingUser) {
    throw new CustomError({ message: "User not found", statusCode: 404 });
  }

  return {
    user: {
      id: existingUser.id,
      name: existingUser.name,
      email: existingUser.email,
      role: existingUser.role || "user",
      isActive: existingUser.is_active,
    },
  };
};

const forgotPassword = async (req) => {
  const { email } = req.body;
  const normalizedEmail = email.toLowerCase();
  const user = await userRepository.findByEmail(normalizedEmail);

  if (!user) {
    throw new CustomError({ message: "User not found", statusCode: 404 });
  }

  const verificationCode = generateVerificationCode();

  await userRepository.updateVerificationCode(
    normalizedEmail,
    verificationCode
  );

  await emailService.sendResetPasswordMail({
    to: normalizedEmail,
    name: user.name,
    code: verificationCode,
  });

  return { message: "Verification code sent to email" };
};

const verifyCode = async (req) => {
  const { email, code } = req.body;
  const normalizedEmail = email.toLowerCase();

  const user = await userRepository.findByEmail(normalizedEmail);
  if (!user) {
    throw new CustomError({ message: "User not found", statusCode: 404 });
  }

  if (user.is_active) {
    return { message: "User is already verified." };
  }

  if (user.verification_code !== code) {
    throw new CustomError({
      message: "Invalid verification code",
      statusCode: 400,
    });
  }

  await userRepository.activateAccount(normalizedEmail);

  return { message: "Email verified successfully. Account activated." };
};

const resetPassword = async (req, res) => {
  const { email, code, newPassword } = req.body;
  const normalizedEmail = email.toLowerCase();
  const user = await userRepository.findByEmail(normalizedEmail);

  if (!user) {
    throw new CustomError({ message: "User not found", statusCode: 404 });
  }

  if (user.verification_code !== code) {
    throw new CustomError({
      message: "Invalid verification code",
      statusCode: 400,
    });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await userRepository.updatePassword(normalizedEmail, passwordHash);

  // Optional: revoke all refresh tokens
  await userRepository.revokeAllRefreshTokens(user.id);

  return { message: "Password has been reset successfully" };
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getCurrentUser,
  forgotPassword,
  verifyCode,
  resetPassword,
};
