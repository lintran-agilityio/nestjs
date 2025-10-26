// libs
import { NextFunction, Request, Response } from 'express';

import { STATUS_CODE, MESSAGES_AUTHENTICATION } from '@/constants';
import { authenticationService } from '@/services';
import HttpExceptionError from '@/exceptions';
import { generateToken, logger, toError } from '@/utils';

class AuthenticationController {
  /**
   * Register a new user
   * @param req - Express request object containing user registration data
   * @param res - Express response object
   * @param next - Express next function for error handling
   */
  register = async (req: Request, res: Response, next: NextFunction) => {
    const payload = req.body;

    try {
      const hasExistUser = await authenticationService.isExistedUser(
        payload.email
      );

      if (hasExistUser)
        return next(
          new HttpExceptionError(
            STATUS_CODE.CONFLICT,
            MESSAGES_AUTHENTICATION.EXIST_USER
          )
        );

      const dataRes = await authenticationService.create(payload);

      return res.status(STATUS_CODE.CREATED).json({ data: dataRes });
    } catch (error) {
      const { message } = toError(error);
      logger.error(message);

      next(new HttpExceptionError(STATUS_CODE.INTERNAL_SERVER_ERROR, message));
    }
  };

  /**
   * Authenticate user login and generate access token
   * @param req - Express request object containing login credentials
   * @param res - Express response object
   * @param next - Express next function for error handling
   */
  login = async (req: Request, res: Response, next: NextFunction) => {
    const params = req.body;

    try {
      const dataRes = await authenticationService.login(params);
      if (!dataRes)
        return next(
          new HttpExceptionError(
            STATUS_CODE.UNAUTHORIZED,
            MESSAGES_AUTHENTICATION.INVALID_EMAIL_PASSWORD
          )
        );

      // generate token
      const token = generateToken.accessToken(dataRes);

      return res.status(STATUS_CODE.OK).json({ data: { ...dataRes, token } });
    } catch (error) {
      const { message } = toError(error);
      logger.error(message);

      next(new HttpExceptionError(STATUS_CODE.INTERNAL_SERVER_ERROR, message));
    }
  };
}

export const authenticationController = new AuthenticationController();
