import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/api-response";

const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret";

// Extend Express Request to hold the user object globally
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
      };
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new ApiError(401, "Missing or invalid authorization token"));
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token as string, JWT_SECRET as string) as any as { id: string; role: string };
    
    // Attach to request
    req.user = {
      id: payload.id,
      role: payload.role,
    };
    
    next();
  } catch (error) {
    return next(new ApiError(401, "Token expired or invalid"));
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, "User not authenticated"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, `Role ${req.user.role} is not authorized`));
    }

    next();
  };
}
