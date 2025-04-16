export interface ApiResponse<T = unknown> {
    success: boolean;
    message: string;
    status: number;
    data?: T;
    error?: {
        code: string | number;
        details?: unknown;
    };
}

export interface ResponseParams<T = unknown> {
    message: string;
    data?: T;
    status?: number;
    error?: {
        code: string | number;
        details?: unknown;
    };
}