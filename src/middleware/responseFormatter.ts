// src/middleware/response.middleware.ts

import { Request, Response, NextFunction } from "express";
import { BaseHttpException } from "../exception/base"; // Import your BaseHttpException

const responseFormatter = (req: Request, res: Response, next: NextFunction) => {
  // Store the original `res.json` method
  const originalJson = res.json;

  // Override `res.json`
  res.json = function (body: any) {
    // Check if the response is already formatted (has success, data, error)
    if (body?.success !== undefined || body?.data !== undefined || body?.error !== undefined) {
      // If already formatted, call the original `res.json`
      return originalJson.call(this, body);
    }

    let success = true; // Default to true
    let data = body;      // Assign body to data
    let error = null;

    // Check if it's an error response based on your error structure
    if (body?.message && body?.errorCode) {
      success = false;
      data = null; // No data in case of an error
      error = {
        message: body.message,
        errorCode: body.errorCode,
        errors: body.errors, // Add errors to the error object if needed
      };
    }

    // Wrap the response in a standardized structure
    const formattedResponse = {
      success: success,
      data: data,
      error: error, // Include the error object
    };

    return originalJson.call(this, formattedResponse);
  };

  next();
};

export default responseFormatter;