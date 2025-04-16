import { BaseHttpException, ErrorCode } from "./base";

export class NotFoundException extends BaseHttpException {
  constructor(message: string, details?: unknown) {
    super(message, 404, ErrorCode.NOT_FOUND, details);
  }
}
