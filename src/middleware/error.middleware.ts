import { NextFunction, Request, Response } from "express";
import { BaseHttpException } from "../exception/base";
import { ErrorCode } from "../exception/base";
import { Prisma } from "@prisma/client";
import { responseService } from "../services/response.service";
import logger from "../logger";
import { ApiResponse } from "../types/responses";

export const errorMiddleware = (error: unknown, req: Request, res: Response, next: NextFunction): void => {
  let response: ApiResponse;

  // Handle known HTTP exceptions
  if (error instanceof BaseHttpException) {
    response = responseService.fromHttpException(error);
  }

  // Handle Prisma errors
  else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    response = {
      success: false,
      message: "Database error",
      status: 400,
      error: {
        code: ErrorCode.BAD_REQUEST,
        details: error.meta,
      },
    };
  }

  // Fallback for unexpected errors
  else {
    console.error("Unhandled error:", error);
    response = responseService.fromHttpException(
      new BaseHttpException(
        "Internal server error",
        500,
        ErrorCode.INTERNAL_ERROR
      )
    );
  }
  // Send formatted error response
  res.status(response.status).json(response);
};
