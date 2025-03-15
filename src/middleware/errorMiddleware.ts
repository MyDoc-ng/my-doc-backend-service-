import { NextFunction, Request, Response } from "express";
import { BaseHttpException } from "../exception/base";
import { ErrorCode } from "../exception/base";
import { Prisma } from "@prisma/client";
import { responseService } from "../services/response.service";

export const errorMiddleware = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("Error caught by error handler:", error); // Always log the error

  let status = responseService.statusCodes.internalServerError; // Default to 500
  let message = "An unexpected error occurred";
  let errorCode = ErrorCode.INTERNALSERVERERROR;
  let errors: any[] | undefined = undefined;

  if (error instanceof BaseHttpException) {
    // Custom exception handling
    status = error.statusCode || responseService.statusCodes.internalServerError;
    message = error.message;
    errorCode = error.errorCode || ErrorCode.INTERNALSERVERERROR;
    errors = error.errors;

    return res.status(status).json(
      responseService.error(message, { errorCode, errors })
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Handle Prisma client errors
    if (error.code === "P2002") {
      status = responseService.statusCodes.badRequest;
      message = "Unique constraint violation";
      errorCode = ErrorCode.CONFLICT;
    } else if (error.code === "P2025") {
      status = responseService.statusCodes.notFound;
      message = "Record not found";
      errorCode = ErrorCode.NOTFOUND;
    } else {
      message = `Prisma error: ${error.message}`;
    }

    return res.status(status).json(
      responseService.error(message, { errorCode })
    );
  }

  if (error.constructor?.name === "PrismaClientValidationError") {
    // Handle Prisma validation errors
    console.log("Error type:", error.constructor?.name);
    console.log("Error message:", error.message);

    status = responseService.statusCodes.badRequest;
    message = "Validation Error";
    errorCode = ErrorCode.BADREQUEST;

    const missingFieldMatch = error.message.match(/Argument `(\w+)` is missing/);
    if (missingFieldMatch) {
      errors = [{ field: missingFieldMatch[1], message: `Field '${missingFieldMatch[1]}' is required` }];
    } else if (error.message.includes("Invalid value")) {
      const fieldMatch = error.message.match(/argument `(\w+)`/);
      errors = [{ field: fieldMatch ? fieldMatch[1] : "unknown", message: error.message.split("\n")[0] }];
    } else {
      errors = [{ field: "unknown", message: error.message.split("\n")[0] }];
    }

    return res.status(status).json(
      responseService.error(message, { errorCode, errors })
    );
  }

  // Standard JavaScript Errors
  if (error instanceof Error) {
    message = error.message;
  }

  // Log unknown errors
  console.log("Unhandled error type:", error.constructor?.name);
  console.error("Unknown error type:", error);

  // Fallback for unknown errors
  return res.status(status).json(
    responseService.internalServerError(message)
  );
};
