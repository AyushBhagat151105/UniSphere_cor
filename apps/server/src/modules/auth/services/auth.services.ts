import prisma from "@UniSphere_cor/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// For demo purposes, we usually rely on ENV logic from `@UniSphere_cor/env`
// Let's hardcode fallbacks here to prevent breakage if not defined locally yet
const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "default_refresh_secret";
import crypto from "crypto";

export async function loginService(input: any, userAgent: string, ipAddress: string) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user ) {
    throw new Error("Invalid credentials or inactive account");
  }

  const isValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!isValid) {
    throw new Error("Invalid credentials");
  }

  // Generate Tokens
  const accessToken = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "15m" });
  const refreshToken = jwt.sign({ id: user.id, jti: crypto.randomUUID() }, REFRESH_SECRET, { expiresIn: "7d" });

  // Hash the refresh token to store in the DB (for multi-device revocation safety)
  const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // Store the active session mapping
  await prisma.userSession.create({
    data: {
      userId: user.id,
      refreshTokenHash: refreshTokenHash,
      deviceMetadata: { deviceId: "unknown", deviceName: "unknown", platform: "WEB", userAgent, ipAddress },
      expiresAt,
    },
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    },
  };
}

export async function activateAccountService(input: any) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user || !user.mustChangePassword) {
    throw new Error("Account not eligible for activation or doesn't exist");
  }

  const isValid = await bcrypt.compare(input.temporaryPassword, user.passwordHash);
  if (!isValid) {
    throw new Error("Invalid temporary password");
  }

  const newHash = await bcrypt.hash(input.newPassword, 10);

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: newHash,
      mustChangePassword: false,
    },
  });

  return { id: updatedUser.id, email: updatedUser.email, status: "ACTIVATED" };
}

export async function logoutService(refreshToken: string) {
  // Try verifying just for extracting the ID
  let payload: any;
  try {
    payload = jwt.verify(refreshToken, REFRESH_SECRET);
  } catch (e) {
    return true; // Already invalid
  }

  // We should find the exact session and delete it
  // Since we hash the token, we have to look up by user and explicitly compare hashes, 
  // or clear all sessions. For simplicity, clear all expired sessions and this specific device session.
  // In production, we'd want a lookup table or session ID.
  const sessions = await prisma.userSession.findMany({ where: { userId: payload.id } });
  
  for (const session of sessions) {
    const isMatch = crypto.createHash('sha256').update(refreshToken).digest('hex') === session.refreshTokenHash;
    if (isMatch) {
      await prisma.userSession.delete({ where: { id: session.id } });
    }
  }

  return true;
}

export async function refreshService(refreshToken: string, userAgent: string, ipAddress: string) {
  let payload: any;
  try {
    payload = jwt.verify(refreshToken, REFRESH_SECRET);
  } catch (e) {
    throw new Error("Invalid or expired refresh token");
  }

  // Find user sessions to match hashes
  const sessions = await prisma.userSession.findMany({ where: { userId: payload.id } });
  
  let validSessionId: string | null = null;
  for (const session of sessions) {
    const isMatch = crypto.createHash('sha256').update(refreshToken).digest('hex') === session.refreshTokenHash;
    if (isMatch) {
      if (session.expiresAt < new Date()) {
        await prisma.userSession.delete({ where: { id: session.id } });
        throw new Error("Refresh token expired in database");
      }
      validSessionId = session.id;
      break;
    }
  }

  if (!validSessionId) {
    throw new Error("Session revoked or not found");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.id } });
  if (!user) {
    throw new Error("User inactive or deleted");
  }

  // Generate new tokens
  const newAccessToken = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "15m" });
  const newRefreshToken = jwt.sign({ id: user.id, jti: crypto.randomUUID() }, REFRESH_SECRET, { expiresIn: "7d" });
  const newRefreshTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // Rotate token safely (delete old, create new) to prevent reuse
  await prisma.$transaction([
    prisma.userSession.delete({ where: { id: validSessionId } }),
    prisma.userSession.create({
      data: {
        userId: user.id,
        refreshTokenHash: newRefreshTokenHash,
        deviceMetadata: { deviceId: "rotated", deviceName: "unknown", platform: "WEB", userAgent, ipAddress },
        expiresAt,
      }
    })
  ]);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}

export async function meService(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true, mustChangePassword: true }
  });

  if (!user) throw new Error("User not found");
  return user;
}
