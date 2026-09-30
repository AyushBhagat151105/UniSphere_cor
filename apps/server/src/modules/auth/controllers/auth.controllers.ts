import type { Request, Response, RequestHandler } from "express";
import { loginService, activateAccountService, logoutService, refreshService, meService } from "../services/auth.services";
import { asyncHandler } from "../../../utils/async-handler";
import { ApiResponse, ApiError } from "../../../utils/api-response";

export const loginController: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const userAgent = req.headers["user-agent"] || "unknown";
  const ipAddress = req.ip || "unknown";

  try {
    const data = await loginService(req.body, userAgent, ipAddress);
    res.json(ApiResponse.ok(data, "Login successful"));
  } catch (error: any) {
    throw new ApiError(401, error.message || "Invalid credentials");
  }
});

export const activateAccountController: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  try {
    const data = await activateAccountService(req.body);
    res.json(ApiResponse.ok(data, "Account activated successfully. Please log in."));
  } catch (error: any) {
    throw new ApiError(400, error.message || "Activation Failed");
  }
});

export const logoutController: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  await logoutService(refreshToken);
  res.json(ApiResponse.ok(null, "Logged out successfully"));
});

export const refreshController: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  const userAgent = req.headers["user-agent"] || "unknown";
  const ipAddress = req.ip || "unknown";

  try {
    const data = await refreshService(refreshToken, userAgent, ipAddress);
    res.json(ApiResponse.ok(data, "Token refreshed successfully"));
  } catch (error: any) {
    throw new ApiError(401, error.message || "Invalid refresh token");
  }
});

export const meController: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, "Not authenticated");
  
  const user = await meService(req.user.id);
  res.json(ApiResponse.ok(user, "User fetched successfully"));
});
