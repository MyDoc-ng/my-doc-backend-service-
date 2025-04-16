import { responseService } from "../services/response.service";
import { BaseHttpException, ErrorCode } from "./base";

export class NotFoundException extends BaseHttpException {
  constructor(message: string, details?: unknown) {
    super(message, responseService.statusCodes.notFound, ErrorCode.NOT_FOUND, details);
  }
}
