import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import Company from "../models/Company.js";
import { env, isEmailConfigured } from "../config/env.js";
import { sendEmail } from "../services/emailService.js";

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role, companyId: user.companyId }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

// @desc   Register a new recruiter + their company (first user becomes admin)
// @route  POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, companyName } = req.body;

  if (!name || !email || !password || !companyName) {
    res.status(400);
    throw new Error("Name, email, password, and company name are all required.");
  }
  if (password.length < 8) {
    res.status(400);
    throw new Error("Password must be at least 8 characters.");
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    res.status(409);
    throw new Error("An account with this email already exists.");
  }

  const company = await Company.create({ name: companyName });
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    companyId: company._id,
    role: "admin",
  });

  res.status(201).json({
    success: true,
    token: signToken(user),
    user: user.toSafeObject(),
  });
});

// @desc   Log in
// @route  POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required.");
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password.");
  }
  if (!user.isActive) {
    res.status(403);
    throw new Error("This account has been deactivated.");
  }

  res.json({ success: true, token: signToken(user), user: user.toSafeObject() });
});

// @desc   Get current logged in user
// @route  GET /api/auth/me
export const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user.toSafeObject() });
});

// @desc   Request a password reset link
// @route  POST /api/auth/forgot-password
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: (email || "").toLowerCase() });

  // Always respond the same way whether or not the account exists, so we
  // don't leak which emails are registered.
  const genericResponse = {
    success: true,
    message: "If an account exists for that email, a reset link has been sent.",
  };

  if (!user) return res.json(genericResponse);

  const rawToken = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = crypto.createHash("sha256").update(rawToken).digest("hex");
  user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  await user.save();

  const resetUrl = `${env.clientUrl}/reset-password/${rawToken}`;
  const emailResult = await sendEmail({
    to: user.email,
    subject: "Reset your AI Recruitment Platform password",
    body: `Hello ${user.name},\n\nUse the link below to reset your password. This link expires in 1 hour.\n\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
  });

  res.json({
    ...genericResponse,
    // Only exposed because email delivery may not be configured in this
    // portfolio environment - lets the flow still be demoed end-to-end.
    ...(isEmailConfigured() ? {} : { devPreviewResetUrl: resetUrl, emailStatus: emailResult.status }),
  });
});

// @desc   Reset password using the emailed token
// @route  POST /api/auth/reset-password/:token
export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password || password.length < 8) {
    res.status(400);
    throw new Error("Password must be at least 8 characters.");
  }

  const hashed = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    resetPasswordToken: hashed,
    resetPasswordExpires: { $gt: Date.now() },
  }).select("+resetPasswordToken +resetPasswordExpires");

  if (!user) {
    res.status(400);
    throw new Error("This reset link is invalid or has expired.");
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.json({ success: true, message: "Password updated. You can now log in." });
});
