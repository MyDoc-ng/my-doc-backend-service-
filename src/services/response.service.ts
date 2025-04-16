import { BadRequestException } from "../exception/bad-request";
import { BaseHttpException } from "../exception/base";
import { NotFoundException } from "../exception/not-found";
import { UnauthorizedException } from "../exception/unauthorized";
import { ApiResponse } from "../types/responses";

interface SuccessResponse<T> {
    success: true;
    message: string;
    data: T;
    status: number;
}

interface ErrorResponse {
    success: false;
    message: string;
    error: string;
    data?: string;
    status: number;
}

interface ErrorParams {
    message: string;
    error?: any;
    data?: any;
    status?: number;
}
interface NotFoundParams {
    message: string;
    details?: unknown;
}
interface SuccessParams {
    message: string;
    data: any;
    status?: number;
}
interface ForbiddenErrorParams {
    message: string;
    data?: any;
}

export const responseService = {
    statusCodes: {
        ok: 200,
        created: 201,
        accepted: 202,
        noContent: 204,
        badRequest: 400,
        unauthorized: 401,
        conflict: 409,
        forbidden: 403,
        notFound: 404,
        internalServerError: 500,
        serviceUnavailable: 503,
    },

    success<T>(param: SuccessParams): SuccessResponse<T> {
        return {
            success: true,
            message: param.message,
            data: param.data,
            status: param.status ?? this.statusCodes.ok,
        };
    },

    fromHttpException(exception: BaseHttpException): ApiResponse {
        return {
            success: false,
            message: exception.message,
            status: exception.status,
            error: {
                code: exception.code,
                details: exception.details,
            },
        };
    },

    error(params: ErrorParams): ErrorResponse {
        return {
            success: false,
            message: params.message,
            error: params.error,
            data: params.data,
            status: params.status || this.statusCodes.badRequest,
        };
    },

    forbiddenError(param: ForbiddenErrorParams): ErrorResponse {
        return {
            success: false,
            message: param.message,
            error: "Forbidden",
            data: param.data,
            status: this.statusCodes.forbidden,
        };
    },

    internalServerError(message: string): ErrorResponse {
        return {
            success: false,
            message,
            error: "Internal Server Error",
            status: this.statusCodes.internalServerError,
        };
    },

    serviceUnavailableError(message: string): ErrorResponse {
        return {
            success: false,
            message,
            error: "Service Unavailable",
            status: this.statusCodes.serviceUnavailable,
        };
    },

    notFoundError(param: NotFoundParams): ApiResponse {
        return this.fromHttpException(new NotFoundException(param.message, param.details));
    },

    unauthorizedError(param: { message?: string }): ApiResponse {
        return this.fromHttpException(new UnauthorizedException(param.message));
    },

    badRequest(params: { message: string; details?: unknown }): ApiResponse {
        return this.fromHttpException(
            new BadRequestException(params.message, params.details)
        );
    },
    //  internalError(params: ErrorResponseParams): ApiResponse {
    //     return this.fromHttpException(
    //       new InternalServerErrorException(params.message, params.details)
    //     );
    //   }

    //    serviceUnavailable(params: ErrorResponseParams): ApiResponse {
    //     return this.fromHttpException(
    //       new ServiceUnavailableException(params.message, params.details)
    //     );
    //   },
    //  forbidden(params: ErrorResponseParams): ApiResponse {
    //     return this.fromHttpException(
    //       new ForbiddenException(params.message, params.details)
    //     );
    //   }

};

