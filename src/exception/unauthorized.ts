import { BaseHttpException, ErrorCode } from "./base";

export class UnauthorizedException extends BaseHttpException {
  constructor(message: string = "Unauthorized", details?: unknown) {
    super(message, 401, ErrorCode.UNAUTHORIZED, details);
  }
}

