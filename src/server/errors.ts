import { HttpError } from "../lib/error.ts";

export { HttpError };

export class AuthenticationError extends HttpError {
  constructor(message = "Unauthorized") {
    super(401, message);
    this.name = "AuthenticationError";
  }
}

export class DocumentValidationError extends HttpError {
  constructor(message: string) {
    super(400, message);
    this.name = "DocumentValidationError";
  }
}

export class EvaluationNotFoundError extends HttpError {
  constructor(message = "Evaluation not found.") {
    super(404, message);
    this.name = "EvaluationNotFoundError";
  }
}

export class EvaluationValidationError extends HttpError {
  constructor(message = "Select at least one document.") {
    super(400, message);
    this.name = "EvaluationValidationError";
  }
}
