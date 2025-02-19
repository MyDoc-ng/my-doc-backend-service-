import { Request, Response, NextFunction } from "express";

const responseFormatter = (req: Request, res: Response, next: NextFunction) => {
  // Store the original `res.json` method
  const originalJson = res.json;

  // Override `res.json`
  res.json = function (body: any) {
    // Check if the response is already formatted
    if (body?.data || body?.error) {
      // If already formatted, call the original `res.json`
      return originalJson.call(this, body);
    }

    // Wrap the response in a standardized structure
    const formattedResponse = {
      success: true,
      data: body,
    };

    return originalJson.call(this, formattedResponse);
  };

  next();
};

export default responseFormatter;
