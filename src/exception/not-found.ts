import { BaseHttpException, ErrorCode } from "./base";

export class NotFoundException extends BaseHttpException {
  constructor(message: string, errorCode: ErrorCode) {
    super(message, errorCode, 404, null);
  }
}
