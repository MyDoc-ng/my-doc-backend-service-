import { NextFunction, Request, Response } from "express";
import { BaseHttpException } from "../exception/base";
import { ErrorCode } from "../exception/base";
import { Prisma } from "@prisma/client";
import { responseService } from "../services/response.service";
import logger from "../logger";

export const errorMiddleware = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log the full error for debugging
  logger.error("Error caught by error handler", {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method
    }
  });

  let status = responseService.statusCodes.internalServerError;
  let message = "An unexpected error occurred";
  let errorCode = ErrorCode.INTERNALSERVERERROR;
  let errors: any[] | undefined = undefined;

  // Handle custom application errors
  if (error instanceof BaseHttpException) {
    status = error.statusCode || responseService.statusCodes.internalServerError;
    message = error.message;
    errorCode = error.errorCode || ErrorCode.INTERNALSERVERERROR;
    errors = error.errors;
    
    logger.warn("Application error occurred", {
      statusCode: status,
      errorCode,
      message,
      errors
    });
  }

  // Handle Prisma Client Known Request Errors
  else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        status = responseService.statusCodes.badRequest;
        message = "Unique constraint violation";
        errorCode = ErrorCode.CONFLICT;
        break;
      case "P2025":
        status = responseService.statusCodes.notFound;
        message = "Record not found";
        errorCode = ErrorCode.NOTFOUND;
        break;
      default:
        message = `Prisma error: ${error.message}`;
    }
    
    logger.warn("Prisma known error occurred", {
      prismaCode: error.code,
      statusCode: status,
      errorCode,
      message
    });
  }

  // Handle Prisma Validation Errors
  else if (error.constructor?.name === "PrismaClientValidationError") {
    logger.debug("Validation error details", {
      errorType: error.constructor?.name,
      errorMessage: error.message
    });

    status = responseService.statusCodes.badRequest;
    message = "Validation Error";
    errorCode = ErrorCode.BADREQUEST;

    // Extract missing fields or invalid values from the message
    const missingFieldMatch = error.message.match(/Argument `(\w+)` is missing/);
    if (missingFieldMatch) {
      errors = [{ field: missingFieldMatch[1], message: `Field '${missingFieldMatch[1]}' is required` }];
    } else if (error.message.includes("Invalid value")) {
      const fieldMatch = error.message.match(/argument `(\w+)`/);
      errors = [{ field: fieldMatch ? fieldMatch[1] : "unknown", message: error.message.split("\n")[0] }];
    } else {
      errors = [{ field: "unknown", message: error.message.split("\n")[0] }];
    }

    logger.warn("Prisma validation error occurred", {
      statusCode: status,
      errorCode,
      message,
      errors
    });
  }

  // Handle standard JavaScript Errors
  else if (error instanceof Error) {
    message = error.message;
    logger.error("Unhandled error occurred", {
      errorType: error.constructor.name,
      message: error.message
    });
  }

  // Send formatted error response
  res.status(status).json(
    responseService.error(message, { errorCode, errors })
  );
};
