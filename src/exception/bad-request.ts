import { BaseHttpException, ErrorCode } from "./base";

export class BadRequestException extends BaseHttpException {
  constructor(message: string = 'Bad Request', errorCode: ErrorCode = ErrorCode.BAD_REQUEST, details?: unknown,) {
    super(message, 400, errorCode, details);
  }
}
