// libs
import { NextFunction, Request, Response } from 'express';

import { userServices } from '@/services';
import {
  MESSAGES,
  MESSAGES_AUTHENTICATION,
  PAGINATION,
  STATUS_CODE,
} from '@/constants';
import { logger, toError } from '@/utils';
import HttpExceptionError from '@/exceptions';
import { IUser } from '@/types';

class UsersController {
  /**
   * Get all users with pagination
   * @param req - Express request object with query parameters for pagination
   * @param res - Express response object
   * @param next - Express next function for error handling
   */
  getAll = async (req: Request, res: Response, next: NextFunction) => {
    const { offset = PAGINATION.OFFSET, limit = PAGINATION.LIMIT } = req.query;
    const limitNumber = Number(limit);
    const offsetNumber = Number(offset);

    try {
      const dataRes = await userServices.getAll(offsetNumber, limitNumber);
      return res.status(STATUS_CODE.OK).json({ data: dataRes });
    } catch (error) {
      const { message } = toError(error);
      logger.error(message);

      next(new HttpExceptionError(STATUS_CODE.INTERNAL_SERVER_ERROR, message));
    }
  };

  /**
   * Get user by ID
   * @param req - Express request object with userId parameter
   * @param res - Express response object
   * @param next - Express next function for error handling
   */
  getUserById = async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;

    try {
      const userIdNumber = Number(userId);
      const dataRes = await userServices.getUserById(userIdNumber);

      if (!dataRes)
        return next(
          new HttpExceptionError(
            STATUS_CODE.NOT_FOUND,
            MESSAGES_AUTHENTICATION.USER_NOT_FOUND
          )
        );

      return res.status(STATUS_CODE.OK).json({ data: dataRes });
    } catch (error) {
      const { message } = toError(error);
      logger.error(message);
      next(new HttpExceptionError(STATUS_CODE.INTERNAL_SERVER_ERROR, message));
    }
  };

  /**
   * Update multiple users with validation for duplicate emails
   * @param req - Express request object containing array of users to update
   * @param res - Express response object
   * @param next - Express next function for error handling
   */
  updateUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { users = [] } = req.body;

      // Valid duplicate email in payload
      const userEmails = users.map((u: IUser) => u.email).filter(Boolean);
      const emailNoDuplicate = new Set(userEmails);

      if (emailNoDuplicate.size !== userEmails.length) {
        return next(
          new HttpExceptionError(
            STATUS_CODE.BAD_REQUEST,
            "Duplicate email in user' payload"
          )
        );
      }

      // Valid email' unique in DB
      if (userEmails.length > 0) {
        const emailsDuplicate = await userServices.checkExistingEmails(
          users,
          userEmails
        );

        if (emailsDuplicate?.length > 0) {
          return res.status(STATUS_CODE.BAD_REQUEST).json({
            message: 'Some emails already exist',
            data: emailsDuplicate,
          });
        }
      }
      const dataRes = await userServices.updateUsers(users);

      if (dataRes && dataRes.length === 0) {
        return next(
          new HttpExceptionError(STATUS_CODE.NOT_FOUND, MESSAGES.NOT_FOUND)
        );
      }

      return res.status(STATUS_CODE.OK).json({
        message: MESSAGES.SUCCESS.UPDATE,
        data: dataRes,
      });
    } catch (error: unknown) {
      const { message } = toError(error);
      logger.error(message);

      next(new HttpExceptionError(STATUS_CODE.INTERNAL_SERVER_ERROR, message));
    }
  };

  /**
   * Update user by ID with email uniqueness validation
   * @param req - Express request object with userId parameter and update data
   * @param res - Express response object
   * @param next - Express next function for error handling
   */
  updateUserById = async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;
    const { username, email, isAdmin } = req.body;

    try {
      const userIdNumber = Number(userId);
      if (email) {
        const existingEmail = await userServices.checkExistingEmail(
          userIdNumber,
          email
        );
        if (existingEmail && Object.keys(existingEmail).length) {
          return next(
            new HttpExceptionError(
              STATUS_CODE.BAD_REQUEST,
              `Email ${email} existing`
            )
          );
        }
      }

      const dataRes = await userServices.updateUserById(
        userIdNumber,
        username,
        email,
        isAdmin
      );

      if (!dataRes)
        return next(
          new HttpExceptionError(
            STATUS_CODE.NOT_FOUND,
            MESSAGES_AUTHENTICATION.USER_NOT_FOUND
          )
        );

      // fetch updated user
      const updatedUser = await userServices.getUserById(userIdNumber);

      return res.status(STATUS_CODE.OK).json({
        message: MESSAGES.SUCCESS.UPDATE,
        data: updatedUser,
      });
    } catch (error) {
      const { message } = toError(error);
      logger.error(message);

      next(new HttpExceptionError(STATUS_CODE.INTERNAL_SERVER_ERROR, message));
    }
  };

  /**
   * Delete all users and related data
   * @param _req - Express request object (unused)
   * @param res - Express response object
   * @param next - Express next function for error handling
   */
  deleteUsers = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      await userServices.deleteUsers();

      return res
        .status(STATUS_CODE.OK)
        .json({ message: MESSAGES.SUCCESS.DELETE });
    } catch (error: unknown) {
      const { message } = toError(error);
      logger.error(message);

      next(new HttpExceptionError(STATUS_CODE.INTERNAL_SERVER_ERROR, message));
    }
  };

  /**
   * Delete user by ID
   * @param req - Express request object with userId parameter
   * @param res - Express response object
   * @param next - Express next function for error handling
   */
  deleteUserById = async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;

    try {
      const userIdNumber = Number(userId);
      const dataRes = await userServices.deleteUserById(userIdNumber);

      if (!dataRes)
        return next(
          new HttpExceptionError(
            STATUS_CODE.NOT_FOUND,
            MESSAGES_AUTHENTICATION.USER_NOT_FOUND
          )
        );

      return res
        .status(STATUS_CODE.OK)
        .json({ message: MESSAGES.SUCCESS.DELETE });
    } catch (error) {
      const { message } = toError(error);
      logger.error(message);

      next(new HttpExceptionError(STATUS_CODE.INTERNAL_SERVER_ERROR, message));
    }
  };
}

export const userController = new UsersController();
