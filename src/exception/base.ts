export class BaseHttpException extends Error {
  // message: string;
  // errorCode: any;
  // statusCode: number;
  // errors: any;

  constructor(
    public readonly message: string,
    public readonly status: number,
    public readonly code: ErrorCode,
    public readonly details?: unknown
  ) {
    super(message);
    this.message = message;
    // this.errorCode = errorCode;
    // this.statusCode = statusCode;
    // this.errors = errors;
    Object.setPrototypeOf(this, BaseHttpException.prototype);
  }
}

// export enum ErrorCode {
//   NOTFOUND = 404,
//   BADREQUEST = 400,
//   UNAUTHORIZED = 401,
//   INTERNALSERVERERROR = 500,
//   FORBIDDEN = 403,
//   CONFLICT = 409,
//   OK = 200,
//   CREATED = 200,
// }

export enum ErrorCode {
  NOT_FOUND = "NOT_FOUND",
  BAD_REQUEST = "BAD_REQUEST",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  CONFLICT = "CONFLICT",
  INTERNAL_ERROR = "INTERNAL_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
}
