import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import { env } from "../config/env.js";
import User from "../models/User.js";

/**
 * Verifies the Bearer JWT and attaches req.user (without the password hash).
 */
export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";

  if (!header.startsWith("Bearer ")) {
    res.status(401);
    throw new Error("Not authorized. Please log in.");
  }

  const token = header.split(" ")[1];

  let decoded;
  try {
    decoded = jwt.verify(token, env.jwtSecret);
  } catch (err) {
    res.status(401);
    throw new Error("Session expired or invalid. Please log in again.");
  }

  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) {
    res.status(401);
    throw new Error("Account not found or deactivated.");
  }

  req.user = user;
  next();
});
