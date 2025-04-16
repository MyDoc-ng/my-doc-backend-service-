import { responseService } from "../services/response.service";
import { BaseHttpException, ErrorCode } from "./base";

export class BadRequestException extends BaseHttpException {
  constructor(message: string = 'Bad Request', details?: unknown, errorCode: ErrorCode = ErrorCode.BAD_REQUEST) {
    super(message, responseService.statusCodes.badRequest, errorCode, details);
  }
}
