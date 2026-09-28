export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: ApiErrorDetail;
  timestamp: string;
}

export class ApiResponseBuilder {
  public static success<T>(data?: T, message?: string): ApiResponse<T> {
    const response: ApiResponse<T> = {
      success: true,
      timestamp: new Date().toISOString(),
    };
    if (data !== undefined) {
      response.data = data;
    }
    if (message !== undefined) {
      response.message = message;
    }
    return response;
  }

  public static error(
    code: string,
    message: string,
    details?: unknown
  ): ApiResponse<never> {
    return {
      success: false,
      error: {
        code,
        message,
        ...(details !== undefined ? { details } : {}),
      },
      timestamp: new Date().toISOString(),
    };
  }
}
