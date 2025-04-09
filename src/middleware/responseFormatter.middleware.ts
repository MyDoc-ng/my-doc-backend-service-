import { Request, Response, NextFunction } from "express";
import { responseService } from "../services/response.service";

const responseFormatter = (req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json;

  res.json = function (body: any) {
    // If the response is already properly formatted (using responseService)
    if (body?.success !== undefined) {
      return originalJson.call(this, body);
    }

    // If it's an error-like object
    if (body?.error || body?.errorCode) {
      return originalJson.call(
        this,
        responseService.error({
          message: body?.message || "An error occurred",
          error: body?.error || body,
        })
      );
    }

    // For successful responses
    const message = body.message || "Request successful";
    const data = body.message ? (body.data ? body.data : { ...body, message: undefined }) : body;
    
    // Remove message from data if it exists
    if (data.message) delete data.message;

    return originalJson.call(this, responseService.success(message, data));
  };

  next();
};

export default responseFormatter;