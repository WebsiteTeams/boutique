/** An error that is safe to show to the client. Anything else is reported as a generic 500. */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fields?: Record<string, string>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const badRequest = (message: string, fields?: Record<string, string>) =>
  new ApiError(400, message, fields);
export const unauthorized = (message = "Please sign in to continue.") => new ApiError(401, message);
export const forbidden = (message = "You do not have access to this resource.") =>
  new ApiError(403, message);
export const notFound = (message = "Not found.") => new ApiError(404, message);
export const conflict = (message: string) => new ApiError(409, message);
export const tooManyRequests = (message = "Too many attempts. Please try again in a few minutes.") =>
  new ApiError(429, message);
export const serviceUnavailable = (message: string) => new ApiError(503, message);
