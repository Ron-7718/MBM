export default class ApiError extends Error {
  public readonly statusCode: number;
  public readonly errors: string[];
  public readonly isOperational: boolean;

  constructor(statusCode: number, message: string, errors: string[] = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;

    Object.setPrototypeOf(this, ApiError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest = (message: string, errors: string[] = []): ApiError =>
    new ApiError(400, message, errors);

  static notFound = (message: string = "Resource not found"): ApiError =>
    new ApiError(404, message);

  static conflict = (message: string): ApiError => new ApiError(409, message);

  static internal = (message: string = "Internal server error"): ApiError =>
    new ApiError(500, message);

  static validationFailed = (errors: string[]): ApiError =>
    new ApiError(400, "Validation failed", errors);
}
