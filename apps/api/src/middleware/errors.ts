import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/http.js';

export const notFound: RequestHandler = (request, _response, next) => {
  next(new AppError(404, `Route ${request.method} ${request.path} was not found`));
};

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof ZodError) {
    response.status(400).json({
      message: 'Validation failed',
      errors: error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })),
    });
    return;
  }
  if (error instanceof AppError) {
    response.status(error.statusCode).json({ message: error.message });
    return;
  }
  if (error?.name === 'CastError') {
    response.status(400).json({ message: 'Invalid resource identifier' });
    return;
  }
  if (error?.code === 11000) {
    response.status(409).json({ message: 'A resource with that value already exists' });
    return;
  }
  console.error(error);
  response.status(500).json({ message: 'An unexpected server error occurred' });
};
