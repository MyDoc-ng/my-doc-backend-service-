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
    status: number;
}

export const responseService = {
    statusCodes: {
        ok: 200,
        created: 201,
        accepted: 202,
        noContent: 204,
        badRequest: 400,
        unauthorized: 401,
        forbidden: 403,
        notFound: 404,
        internalServerError: 500,
        serviceUnavailable: 503,
    } as const,

    success<T>(message: string, data: T): SuccessResponse<T> {
        return {
            success: true,
            message,
            data,
            status: this.statusCodes.ok,
        };
    },

    error(message: string, error?: any): ErrorResponse {
        return {
            success: false,
            message,
            error,
            status: this.statusCodes.badRequest,
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

    forbiddenError(message: string): ErrorResponse {
        return {
            success: false,
            message,
            error: "Forbidden",
            status: this.statusCodes.forbidden,
        };
    },

    notFoundError(message: string): ErrorResponse {
        return {
            success: false,
            message,
            error: "Not Found",
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

