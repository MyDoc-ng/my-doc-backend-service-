import { responseService } from "../services/response.service";
import { BaseHttpException, ErrorCode } from "./base";

export class UnauthorizedException extends BaseHttpException {
  constructor(message: string = "Unauthorized", details?: unknown) {
    super(message, responseService.statusCodes.unauthorized, ErrorCode.UNAUTHORIZED, details);
  }
}

