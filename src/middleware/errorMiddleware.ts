import { NextFunction, Request, Response } from "express";
import { BaseHttpException } from "../exception/base";
import { ErrorCode } from "../exception/base";
import { Prisma } from "@prisma/client";

export const errorMiddleware = (
  error: any,  // Change the type to 'any' or a more specific union type
  req: Request,
  res: Response,
  next: NextFunction
) => {
  
  console.error("Error caught by error handler:", error);  // Always log the error

  let status = 500; // Default to 500 (Internal Server Error)
  let message = "An unexpected error occurred";
  let errorCode = ErrorCode.INTERNALSERVERERROR;
  let errors: any[] | undefined = undefined;

  if (error instanceof BaseHttpException) {
    // It's one of your custom exceptions
    status = error.statusCode || 500;
    message = error.message;
    errorCode = error.errorCode || ErrorCode.INTERNALSERVERERROR;
    errors = error.errors; // If errors are part of your BaseHttpException

  } else if (error instanceof Error) {
    // Standard JavaScript Error (e.g., TypeError, ReferenceError)
    message = error.message; // Use the error message
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Handle Prisma Client errors (very important!)
    if (error.code === 'P2002') {
      // Unique constraint violation
      status = 409; // Conflict
      message = 'Unique constraint violation';
      errorCode = ErrorCode.CONFLICT;
    } else if (error.code === 'P2025') {
      // Record not found
      status = 404; // Not Found
      message = 'Record not found';
      errorCode = ErrorCode.NOTFOUND;
    } else {
      message = `Prisma error: ${error.message}`;
    }

  } else if (error.constructor?.name === 'PrismaClientValidationError') {
    // Add debug logs
    console.log('Error type:', error.constructor?.name);
    console.log('Error message:', error.message);
    
    status = 400;
    message = 'Validation Error';
    errorCode = ErrorCode.BADREQUEST;

    // Handle missing required fields
    const missingFieldMatch = error.message.match(/Argument `(\w+)` is missing/);
    if (missingFieldMatch) {
      errors = [{
        field: missingFieldMatch[1],
        message: `Field '${missingFieldMatch[1]}' is required`
      }];
    } 
    // Handle invalid value errors
    else if (error.message.includes('Invalid value')) {
      const fieldMatch = error.message.match(/argument `(\w+)`/);
      errors = [{
        field: fieldMatch ? fieldMatch[1] : 'unknown',
        message: error.message.split('\n')[0] // Get the first line of the error message
      }];
    }
    // Fallback for other validation errors
    else {
      errors = [{
        field: 'unknown',
        message: error.message.split('\n')[0]
      }];
    }

  } else {
    // Add debug log for unknown errors
    console.log('Unhandled error type:', error.constructor?.name);
    console.error("Unknown error type:", error);
  }


  res.status(status).json({
    message: message,
    errorCode: errorCode,
    errors: errors,
  });
};