import { NextFunction, Request, Response } from "express";
import { BaseHttpException } from "../exception/base";

export const errorMiddleware = (error: BaseHttpException, req: Request, res:Response, next:NextFunction) => {
    res.status(error.statusCode).json({
        message: error.message,
        errorCode: error.errorCode,
        errors: error.errors
    });
}