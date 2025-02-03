import { BaseHttpException } from "./base";

export class UnprocessableEntityException extends BaseHttpException {
  constructor(error: any, message: string, errorCode: number) {
    super(message, errorCode, 422, error);
  }
}
