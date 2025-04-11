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
interface NotFoundErrorParams {
    message: string;
    error?: any;
    data?: any;
    status?: number;
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

    error(params: ErrorParams): ErrorResponse {
        return {
            success: false,
            message: params.message,
            error: params.error,
            data: params.data,
            status: params.status || this.statusCodes.badRequest,
        };
    },

    unauthorizedError(message: string): ErrorResponse {
        return {
            success: false,
            message,
            error: "Unauthorized",
            status: this.statusCodes.unauthorized,
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

    notFoundError(param: NotFoundErrorParams): ErrorResponse {
        return {
            success: false,
            message: param.message,
            error: "Not Found Exception",
            status: this.statusCodes.notFound,
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
};

