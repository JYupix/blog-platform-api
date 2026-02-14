import { Request, Response, NextFunction } from "express";
import {
  loginSchema,
  registerSchema,
  verifyEmailSchema,
} from "./auth.schema.js";
import { setAuthCookie } from "../../utils/cookies.js";
import bcrypt from "bcrypt";
import { prisma } from "../../config/db.js";
import {
  generateAuthToken,
  generateVerificationToken,
} from "../../utils/jwt.js";
import {
  sendEmailVerification,
  sendWelcomeEmail,
} from "../../services/email.service.js";

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { name, username, email, password } = registerSchema.parse(req.body);

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      username,
      email,
      password: hashedPassword,
    },
  });

  const verificationToken = generateVerificationToken(user.id);
  const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      verificationToken,
      verificationTokenExpiry,
    },
  });

  await sendEmailVerification(email, verificationToken, username);

  const {
    password: _,
    verificationToken: __,
    verificationTokenExpiry: ___,
    ...userData
  } = updatedUser;

  res.status(201).json({
    success: true,
    message:
      "User registered successfully. Please check your email to verify your account.",
    user: userData,
  });
};

export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { token } = verifyEmailSchema.parse(req.query);

  const user = await prisma.user.findFirst({
    where: {
      verificationToken: token,
      verificationTokenExpiry: {
        gt: new Date(),
      },
    },
  });

  if (!user) {
    res.status(400).json({
      success: false,
      message: "Invalid or expired verification token",
    });
    return;
  }

  if (user.emailVerified) {
    res
      .status(400)
      .json({ success: false, message: "Email is already verified" });
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerifiedAt: new Date(),
      verificationToken: null,
      verificationTokenExpiry: null,
    },
  });

  await sendWelcomeEmail(user.email, user.username);

  res
    .status(200)
    .json({ success: true, message: "Email verified successfully" });
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { email, password } = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      password: true,
      profileImage: true,
      bio: true,
      role: true,
      emailVerified: true,
      lastLogin: true,
      createdAt: true,
    },
  });

  if (!user) {
    res.status(401).json({ success: false, message: "Invalid credentials" });
    return;
  }

  if (!user.emailVerified) {
    res.status(403).json({
      success: false,
      message: "Please verify your email before logging in",
    });
    return;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    res.status(401).json({ success: false, message: "Invalid credentials" });
    return;
  }

  const token = generateAuthToken(user.id, user.email, user.role);

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  setAuthCookie(res, token);

  const { password: _, ...userData } = user;

  res.status(200).json({
    success: true,
    message: "Login successful",
    user: userData,
  });
};
