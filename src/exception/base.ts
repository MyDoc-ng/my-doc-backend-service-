export class BaseHttpException extends Error {
  message: string;
  errorCode: any; 
  statusCode: number;
  errors: any;

  constructor(
    message: string,
    errorCode: any, 
    statusCode: number,
    errors: any 
  ) {
    super(message);
    this.message = message;
    this.errorCode = errorCode;
    this.statusCode = statusCode;
    this.errors = errors;
    Object.setPrototypeOf(this, new.target.prototype); 
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
  CREATED = 200,
}
