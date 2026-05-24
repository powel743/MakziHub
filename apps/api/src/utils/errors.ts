export class AppError extends Error {
  statusCode: number
  code: string

  constructor(message: string, statusCode: number, code: string) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.code = code
    Object.setPrototypeOf(this, AppError.prototype)
  }
}

export function notFound(message = 'Resource not found'): AppError {
  return new AppError(message, 404, 'NOT_FOUND')
}

export function unauthorized(message = 'Unauthorized'): AppError {
  return new AppError(message, 401, 'UNAUTHORIZED')
}

export function forbidden(message = 'Forbidden'): AppError {
  return new AppError(message, 403, 'FORBIDDEN')
}

export function conflict(message = 'Conflict'): AppError {
  return new AppError(message, 409, 'CONFLICT')
}

export function unprocessable(message = 'Unprocessable entity'): AppError {
  return new AppError(message, 422, 'UNPROCESSABLE')
}

export function badRequest(message = 'Bad request'): AppError {
  return new AppError(message, 400, 'BAD_REQUEST')
}

export function serviceUnavailable(message = 'Service unavailable'): AppError {
  return new AppError(message, 503, 'SERVICE_UNAVAILABLE')
}
