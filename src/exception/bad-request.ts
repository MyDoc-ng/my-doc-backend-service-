import { responseService } from "../services/response.service";
import { BaseHttpException, ErrorCode } from "./base";

export class BadRequestException extends BaseHttpException {
  constructor(message: string = 'Bad Request', errorCode: ErrorCode = ErrorCode.BAD_REQUEST, details?: unknown,) {
    super(message, responseService.statusCodes.badRequest, errorCode, details);
  }
}
