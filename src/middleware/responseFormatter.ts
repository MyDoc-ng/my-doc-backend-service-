import { Request, Response, NextFunction } from "express";
import { responseService } from "../services/response.service";

const responseFormatter = (req: Request, res: Response, next: NextFunction) => {
  // Store the original `res.json` method
  const originalJson = res.json;

  // Override `res.json`
  res.json = function (body: any) {
    // If the response is already formatted, return it as is
    if (body?.success !== undefined || body?.data !== undefined || body?.error !== undefined) {
      return originalJson.call(this, body);
    }

    // If the body has an error structure, use `responseService.error`
    if (body?.message && body?.errorCode) {
      return originalJson.call(
        this,
        responseService.error(body.message, {
          errorCode: body.errorCode,
          error: body.errors,
        })
      );
    }

    // Otherwise, wrap it in a success response
    return originalJson.call(this, responseService.success("successful", body));
  };

  next();
};

export default responseFormatter;
