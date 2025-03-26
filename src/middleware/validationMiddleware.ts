import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

import { StatusCodes } from 'http-status-codes';
import { responseService } from '../services/response.service';

export function validateData(schema: z.ZodObject<any, any>) {
  return (req: Request, res: Response, next: NextFunction) => {

    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((issue: any) => ({
          message: `${issue.path.join('.')} is ${issue.message}`,
        }));
        responseService.error("Invalid data", {
          errorCode: StatusCodes.BAD_REQUEST,
          error: errorMessages,
        });
        // res.status(StatusCodes.BAD_REQUEST).json({ error: 'Invalid data', details: errorMessages });
      } else {
        responseService.error("Internal Server Error", {
          errorCode: StatusCodes.INTERNAL_SERVER_ERROR,
          error: "Internal Server Error",
        });
        // res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
      }
    }
  };
}