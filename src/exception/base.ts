export class BaseHttpException extends Error {
  message: string;
  errorCode: any;
  statusCode: number;
  errors: ErrorCode;

  constructor(
    message: string,
    errorCode: ErrorCode,
    statusCode: number,
    error: any
  ) {
    super(message);
    this.message = message;
    this.errorCode = errorCode;
    this.statusCode = statusCode;
    this.errors = error;
  }
}

export enum ErrorCode {
  NOTFOUND = 404,
  BADREQUEST = 400,
  UNAUTHORIZED = 401,
  INTERNALSERVERERROR = 500,
  FORBIDDEN = 403,
  CONFLICT = 409,
  OK = 200,
  CREATED = 201,
}
