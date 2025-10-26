// libs
import { Request, Response, NextFunction } from "express";

import { MESSAGES, STATUS_CODE } from "@/constants";
import { IErrorWithStatus } from "@/types";

/**
 * Global error handling middleware for Express application
 * @param error - Error object with status code and message
 * @param _req - Express request object (unused)
 * @param res - Express response object
 * @param _next - Express next function (unused)
 */
export const globalErrorMiddleware = (error: IErrorWithStatus, _req: Request, res: Response, _next: NextFunction) => {
  const statusCode = error.statusCode || STATUS_CODE.INTERNAL_SERVER_ERROR;
  const message = error.message || "Internal Server Error";

  res.status(statusCode).json({
    error: message
  });
};

/**
 * Handle 404 Not Found routes
 * @param req - Express request object
 * @param res - Express response object
 */
export const handleNotFoundRoute = (req: Request, res: Response) => {
  const { NOT_FOUND } = STATUS_CODE;
  
  res.status(NOT_FOUND).json({
    error: MESSAGES.NOT_FOUND
  });
};