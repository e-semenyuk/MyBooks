// Every API error leaves the server as { error, code } (plus optional details).

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown
  ) {
    super(message)
  }

  static badRequest(message: string, code = 'BAD_REQUEST', details?: unknown) {
    return new ApiError(400, code, message, details)
  }
  static unauthorized(message = 'Unauthorized - Please login') {
    return new ApiError(401, 'UNAUTHORIZED', message)
  }
  static forbidden(message = 'Forbidden - Admin access required') {
    return new ApiError(403, 'FORBIDDEN', message)
  }
  static notFound(message = 'Not found', code = 'NOT_FOUND') {
    return new ApiError(404, code, message)
  }
  static conflict(message: string, code = 'CONFLICT') {
    return new ApiError(409, code, message)
  }
  static tooManyRequests(message: string, retryAfterSeconds?: number) {
    return new ApiError(429, 'RATE_LIMITED', message, { retryAfterSeconds })
  }
}
