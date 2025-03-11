import { NextFunction, Request, Response } from "express";
import { BaseHttpException } from "../exception/base";
import { Prisma } from "@prisma/client";

export const errorMiddleware = (
  error: BaseHttpException,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const status = error.statusCode || 500;

  if (status !== 500) {
    res.status(status).json({
        message: 'An error occured during the action',
        errorCode: error.errorCode,
        errors: error.errors,
      });
  } else {
    res.status(status).json({
        message: error.message,
        errorCode: error.errorCode,
        errors: error.errors,
      });
  }

 
};
