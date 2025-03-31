import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { StatusCodes } from 'http-status-codes';
import { responseService } from '../services/response.service';

export function validateData(schema: z.ZodObject<any, any>) {
  return (req: Request, res: Response, next: NextFunction): any => {

    try {
      console.log(req.body);
      schema.parse(req.body);

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((issue: any) => ({
          message: `${issue.path.join('.')} is ${issue.message}`,
        }));
        // Send the response instead of just returning an object
        return res.status(StatusCodes.BAD_REQUEST).json(
          responseService.error("Invalid data", errorMessages)
        );
      } else {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
          responseService.error("Internal Server Error")
        );
      }
    }
  };
}