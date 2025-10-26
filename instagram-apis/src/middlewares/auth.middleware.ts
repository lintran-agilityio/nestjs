// libs
import { NextFunction, Response } from "express";

import { MESSAGES, MESSAGES_AUTHENTICATION, STATUS_CODE } from "@/constants";
import { generateToken } from "@/utils";
import { RequestAuthenticationType } from "@/types";
import HttpExceptionError from "@/exceptions";

/**
 * Middleware to validate JWT token and check user authentication
 * @param isValidAdmin - Optional flag to require admin privileges
 * @returns Express middleware function that validates token and sets user context
 */
const validateToken = (isValidAdmin?: boolean) => {
  return (req: RequestAuthenticationType, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new HttpExceptionError(STATUS_CODE.UNAUTHORIZED, MESSAGES_AUTHENTICATION.UN_AUTHORIZATION));
    }

    const token = authHeader.split(' ')[1];

    try {
      const decode = generateToken.decodeToken(token);
      const { exp, isAdmin, userId } = decode;

      // checking expiration time
      if (exp && exp < Date.now() / 1000) {
        return next(new HttpExceptionError(STATUS_CODE.UNAUTHORIZED, MESSAGES_AUTHENTICATION.ACCESS_TOKEN_EXPIRED));
      }

      if (isValidAdmin && !isAdmin) {
        return next(new HttpExceptionError(STATUS_CODE.FORBIDDEN, MESSAGES.ERRORS.NO_PERMISSION));
      }

      req.userId = userId;
      req.isAdmin = isAdmin;

      next();
    } catch (error) {
      next(new HttpExceptionError(STATUS_CODE.UNAUTHORIZED, MESSAGES_AUTHENTICATION.INVALID_TOKEN));
    }
  }
};

export { validateToken };
