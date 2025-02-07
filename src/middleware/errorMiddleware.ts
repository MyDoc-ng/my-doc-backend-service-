import { NextFunction, Request, Response } from "express";
import { BaseHttpException } from "../exception/base";

export const errorMiddleware = (error: BaseHttpException, req: Request, res:Response, next:NextFunction) => {
   const status = error.statusCode || 500;
    res.status(status).json({
        message: error.message,
        errorCode: error.errorCode,
        errors: error.errors
    });
}