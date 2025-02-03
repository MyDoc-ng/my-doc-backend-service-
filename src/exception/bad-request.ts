import { BaseHttpException, ErrorCode } from "./base";

export class BadRequestException extends BaseHttpException {
  constructor(message: string, errorCode: ErrorCode, statusCode: number = 400) {
    super(message, errorCode, statusCode, null);
  }
}
