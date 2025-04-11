import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UnauthorizedException } from "../exception/unauthorized";
import { ErrorCode } from "../exception/base";
import logger from "../logger";
import { prisma } from "../prisma/prisma";
import { IRole } from "../models/auth.model";
import { transformUserRoles } from "../utils/role.utils";

// Define a common JWT payload interface
export interface JwtPayload {
  id: string;
  email: string;
  roles: IRole[];
  name?: string;
  phoneNumber?: string;
  photo?: string;
  emailVerified?: boolean;
}

// Extend Express Request to include user payload
export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

// Middleware to authenticate any user (User, Doctor, Admin)
export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
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
        roles: req.user.roles,
      });

      next();
    });
  } catch (error: any) {
    logger.error("Authentication error", { error: error.message });
    next(new UnauthorizedException("Unauthenticated", ErrorCode.UNAUTHORIZED));
  }
};

// Middleware to restrict access based on roles
export const authorize = (allowedRoles: Array<"PATIENT" | "DOCTOR" | "ADMIN">) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // 1. Authentication check
      if (!req.user?.id) {
        throw new UnauthorizedException(
          "Authentication required", 
          ErrorCode.FORBIDDEN
        );
      }

      // 2. Fetch user with roles
      const userWithRoles = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
          roles: {
            include: { role: true }
          }
        }
      });

      if (!userWithRoles) {
        throw new UnauthorizedException(
          "User not found",
          ErrorCode.NOTFOUND
        );
      }

      const roles = transformUserRoles(userWithRoles?.roles);


      // 4. Check authorization
      const hasPermission = roles.some(role => 
        allowedRoles.includes(role.name as "PATIENT" | "DOCTOR" | "ADMIN")
      );

      if (!hasPermission) {
        throw new UnauthorizedException(
          `Requires roles: ${allowedRoles.join(", ")}`,
          ErrorCode.FORBIDDEN
        );
      }

      // 5. Attach roles to request for future use
      req.user.roles = roles;

      logger.debug("Authorization successful", {
        userId: req.user.id,
        roles: roles,
        requiredRoles: allowedRoles
      });

      next();
    } catch (error) {
      next(error);
    }
  };
};
