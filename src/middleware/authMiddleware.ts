import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UnauthorizedException } from "../exception/unauthorized";
import { ErrorCode } from "../exception/base";
import logger from "../logger";

// Common fields that all payloads might share
interface BaseJwtPayload {
  id: string;
  email: string;
  iat?: number;  // Issued at timestamp (automatically added by JWT)
  exp?: number;  // Expiration timestamp (automatically added by JWT)
}

export interface JwtUserPayload extends BaseJwtPayload {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  profileImage?: string;
  isVerified?: boolean;
  lastLogin?: string;
  preferences?: {
    notifications?: boolean;
    language?: string;
    timezone?: string;
  };
}

export interface JwtDoctorPayload extends BaseJwtPayload {
  firstName?: string;
  lastName?: string;
  specialization?: string;
  licenseNumber?: string;
  experience?: number;
  qualification?: string;
  hospitalAffiliation?: string;
  availability?: {
    days?: string[];
    hours?: string[];
    timezone?: string;
  };
  rating?: number;
  isVerified?: boolean;
  isOnline?: boolean;
  profileImage?: string;
  googleCalendarId?: string;
  consultationFee?: number;
  languages?: string[];
}

export interface JwtAdminPayload extends BaseJwtPayload {
  firstName?: string;
  lastName?: string;
  role?: string;
  permissions?: string[];
  department?: string;
  lastLogin?: string;
  isSuperAdmin?: boolean;
  accessLevel?: number;
  createdAt?: string;
  modifiedAt?: string;
}

// Define request types that extend Express.Request
export interface AuthenticatedUserRequest extends Request {
  user?: JwtUserPayload;  // Make optional to match Express.Request
}

export interface AuthenticatedDoctorRequest extends Request {
  doctor?: JwtDoctorPayload;  // Make optional to match Express.Request
}

export interface AuthenticatedAdminRequest extends Request {
  admin?: JwtAdminPayload;  // Make optional to match Express.Request
}

// Type the middleware functions
export const authenticateUser = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const token = req.headers.authorization;

  logger.debug('Verifying user token', { tokenExists: !!token });

  if (!token) {
    logger.warn('No token provided for user authentication');
    return next(new UnauthorizedException("unauthorized", ErrorCode.UNAUTHORIZED));
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET as string, (err, decoded) => {
      if (err) {
        logger.error('User token verification failed', { error: err.message });
        return next(new UnauthorizedException("unauthorized", ErrorCode.UNAUTHORIZED));
      }

      (req as AuthenticatedUserRequest).user = decoded as JwtUserPayload;
      logger.debug('User authenticated successfully', { userId: (decoded as JwtUserPayload).id });
      next();
    });
  } catch (error: any) {
    logger.error('User authentication error', { error: error.message });
    next(new UnauthorizedException("unauthorized", ErrorCode.UNAUTHORIZED));
  }
};

export const authenticateDoctor = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const token = req.headers.authorization;

  logger.debug('Verifying doctor token', { tokenExists: !!token });

  if (!token) {
    logger.warn('No token provided for doctor authentication');
    return next(new UnauthorizedException("unauthorized", ErrorCode.UNAUTHORIZED));
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET as string, (err, decoded) => {
      if (err) {
        logger.error('Doctor token verification failed', { error: err.message });
        return next(new UnauthorizedException("unauthorized", ErrorCode.UNAUTHORIZED));
      }

      (req as AuthenticatedDoctorRequest).doctor = decoded as JwtDoctorPayload;
      logger.debug('Doctor authenticated successfully', { doctorId: (decoded as JwtDoctorPayload).id });
      next();
    });
  } catch (error: any) {
    logger.error('Doctor authentication error', { error: error.message });
    next(new UnauthorizedException("unauthorized", ErrorCode.UNAUTHORIZED));
  }
};

export const authenticateAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const token = req.headers.authorization;

  logger.debug('Verifying admin token', { tokenExists: !!token });

  if (!token) {
    logger.warn('No token provided for admin authentication');
    return next(new UnauthorizedException("unauthorized", ErrorCode.UNAUTHORIZED));
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET as string, (err, decoded) => {
      if (err) {
        logger.error('Admin token verification failed', { error: err.message });
        return next(new UnauthorizedException("unauthorized", ErrorCode.UNAUTHORIZED));
      }

      (req as AuthenticatedAdminRequest).admin = decoded as JwtAdminPayload;
      logger.debug('Admin authenticated successfully', { adminId: (decoded as JwtAdminPayload).id });
      next();
    });
  } catch (error: any) {
    logger.error('Admin authentication error', { error: error.message });
    next(new UnauthorizedException("unauthorized", ErrorCode.UNAUTHORIZED));
  }
};
