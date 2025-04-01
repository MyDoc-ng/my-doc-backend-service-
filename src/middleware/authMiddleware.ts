import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UnauthorizedException } from "../exception/unauthorized";
import { ErrorCode } from "../exception/base";
import logger from "../logger";
import { UserTypes } from "@prisma/client";

// Define a common JWT payload interface
export interface JwtPayload {
  id: string;
  email: string;
  role: UserTypes; 
  name?: string;
  phoneNumber?: string;
  profileImage?: string;
  isVerified?: boolean;
  lastLogin?: string;
  permissions?: string[]; // If admin
}

// Extend Express Request to include user payload
export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

// Middleware to authenticate any user (User, Doctor, Admin)
export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const token = req.headers.authorization;

  logger.debug("Verifying user token", { tokenExists: !!token });

  if (!token) {
    logger.warn("No token provided for authentication");
    return next(
      new UnauthorizedException("Unauthenticated", ErrorCode.UNAUTHORIZED)
    );
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET as string, (err, decoded) => {
      if (err) {
        logger.error("Token verification failed", { error: err.message });
        return next(
          new UnauthorizedException("Unauthenticated", ErrorCode.UNAUTHORIZED)
        );
      }

      req.user = decoded as JwtPayload;
      logger.debug("User authenticated successfully", {
        userId: req.user.id,
        role: req.user.role,
      });

      next();
    });
  } catch (error: any) {
    logger.error("Authentication error", { error: error.message });
    next(new UnauthorizedException("Unauthenticated", ErrorCode.UNAUTHORIZED));
  }
};

// Middleware to restrict access based on roles
export const authorize =
  (allowedRoles: Array<"PATIENT" | "DOCTOR" | "ADMIN">) =>
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(
        new UnauthorizedException(
          "Forbidden: You do not have access to this resource",
          ErrorCode.FORBIDDEN
        )
      );
    }

    logger.debug("Authorization successful", {
      userId: req.user.id,
      role: req.user.role,
    });

    next();
  };
