import { BaseHttpException } from './base';
import { ErrorCode } from './base';

interface ValidationError {
    field: string;
    message: string;
}

export class ValidationException extends BaseHttpException {
    constructor(
        errors: ValidationError | ValidationError[],
        message: string = 'Validation Error'
    ) {
        super(message, 400, ErrorCode.BADREQUEST, errors);
        this.errors = Array.isArray(errors) ? errors : [errors];
    }

    // Helper static methods for common validation errors
    static missingField(fieldName: string): ValidationException {
        return new ValidationException({
            field: fieldName,
            message: `Field '${fieldName}' is required`
        });
    }

    static invalidValue(fieldName: string, reason?: string): ValidationException {
        return new ValidationException({
            field: fieldName,
            message: reason || `Invalid value provided for '${fieldName}'`
        });
    }

    static custom(field: string, message: string): ValidationException {
        return new ValidationException({
            field,
            message
        });
    }

    static multiple(errors: ValidationError[]): ValidationException {
        return new ValidationException(errors);
    }
} 