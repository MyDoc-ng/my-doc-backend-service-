import { BaseHttpException } from "./base";

export class UnauthorizedException extends BaseHttpException {
  constructor(message: string, errorCode: number, error?: any) {
    super(message, errorCode, 401, error);
  }
}

