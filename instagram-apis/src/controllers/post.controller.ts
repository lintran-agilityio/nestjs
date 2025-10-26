// libs
import { NextFunction, Request, Response } from 'express';

import {
  MESSAGES,
  MESSAGES_AUTHENTICATION,
  PAGINATION,
  STATUS_CODE,
} from '@/constants';
import { postService, userServices } from '@/services';
import { logger, toError } from '@/utils';
import HttpExceptionError from '@/exceptions';
import { RequestAuthenticationType } from '@/types';

class PostsController {
  private errorPostMessage = MESSAGES.ERRORS.POST;

  /**
   * Get all posts with pagination
   * @param req - Express request object with query parameters for pagination
   * @param res - Express response object
   * @param next - Express next function for error handling
   */
  getAll = async (req: Request, res: Response, next: NextFunction) => {
    const { offset = PAGINATION.OFFSET, limit = PAGINATION.LIMIT } = req.query;
    const limitNumber = Number(limit);
    const offsetNumber = Number(offset);

    try {
      const dataRes = await postService.getAll(offsetNumber, limitNumber);
      return res.status(STATUS_CODE.OK).json({ data: dataRes });
    } catch (error) {
      const { message } = toError(error);
      logger.error(message);

      next(new HttpExceptionError(STATUS_CODE.INTERNAL_SERVER_ERROR, message));
    }
  };

  /**
   * Get post by ID
   * @param req - Express request object with post id parameter
   * @param res - Express response object
   * @param next - Express next function for error handling
   */
  getPostById = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    try {
      const postId = Number(id);
      const dataRes = await postService.get(postId);

      if (!dataRes)
        return next(
          new HttpExceptionError(
            STATUS_CODE.NOT_FOUND,
            MESSAGES.ERRORS.POST.NOT_FOUND
          )
        );

      return res.status(STATUS_CODE.OK).json({ data: dataRes });
    } catch (error) {
      const { message } = toError(error);
      logger.error(message);
      next(new HttpExceptionError(STATUS_CODE.INTERNAL_SERVER_ERROR, message));

      return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ error });
    }
  };

  /**
   * Create a new post by user with slug validation
   * @param req - Express request object containing post data
   * @param res - Express response object
   * @param next - Express next function for error handling
   */
  createPostByUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const { body } = req;

    try {
      const { authorId, slug } = body;

      // Valid unique slug
      const slugExiting = await postService.existSlug(slug);

      if (slugExiting && Object.keys(slugExiting).length) {
        next(
          new HttpExceptionError(
            STATUS_CODE.BAD_REQUEST,
            this.errorPostMessage.INVALID_SLUG
          )
        );
      }

      const user = await userServices.getUserById(authorId);

      if (!user)
        return next(
          new HttpExceptionError(
            STATUS_CODE.NOT_FOUND,
            this.errorPostMessage.USER_NOT_FOUND
          )
        );

      const dataRes = await postService.create({
        ...body,
        authorId: user.userId,
      });

      return res.status(STATUS_CODE.CREATED).json({ data: dataRes });
    } catch (error) {
      const { message } = toError(error);
      logger.error(message);

      next(new HttpExceptionError(STATUS_CODE.INTERNAL_SERVER_ERROR, message));
    }
  };

  /**
   * Update user's post by ID with ownership validation
   * @param req - Express request object with userId and post id parameters
   * @param res - Express response object
   * @param next - Express next function for error handling
   */
  putUsersPostById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const { userId, id } = req.params;
    const payload = req.body;

    try {
      const userIdNumber = Number(userId);
      const idNumber = Number(id);

      // find users by userId
      const user = await userServices.getUserById(userIdNumber);
      if (!user)
        return next(
          new HttpExceptionError(
            STATUS_CODE.NOT_FOUND,
            MESSAGES_AUTHENTICATION.USER_NOT_FOUND
          )
        );

      // find the post with userId
      const post = await postService.getPostByAuthorId(userIdNumber, idNumber);
      if (!post)
        return next(
          new HttpExceptionError(
            STATUS_CODE.NOT_FOUND,
            this.errorPostMessage.NOT_FOUND_OWNED_USER
          )
        );

      const { message } = await postService.update(post, {
        ...payload,
        id: idNumber,
        authorId: userIdNumber,
      });

      if (message)
        return next(new HttpExceptionError(STATUS_CODE.CONFLICT, message));

      return res
        .status(STATUS_CODE.NO_CONTENT)
        .json({ message: MESSAGES.SUCCESS.UPDATE });
    } catch (error) {
      const { message } = toError(error);
      logger.error(message);

      next(new HttpExceptionError(STATUS_CODE.INTERNAL_SERVER_ERROR, message));
    }
  };

  /**
   * Delete all posts
   * @param _req - Express request object (unused)
   * @param res - Express response object
   * @param next - Express next function for error handling
   */
  deletePosts = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const dataRes = await postService.deletePosts();
      if (!dataRes) {
        return next(
          new HttpExceptionError(
            STATUS_CODE.NOT_FOUND,
            this.errorPostMessage.NOT_FOUND
          )
        );
      }
      return res
        .status(STATUS_CODE.OK)
        .json({ message: MESSAGES.SUCCESS.DELETE });
    } catch (error) {
      const { message } = toError(error);
      logger.error(message);

      next(new HttpExceptionError(STATUS_CODE.INTERNAL_SERVER_ERROR, message));
    }
  };

  /**
   * Delete user's post by ID with permission validation
   * @param req - Express request object with userId and post id parameters
   * @param res - Express response object
   * @param next - Express next function for error handling
   */
  deleteUsersPostById = async (
    req: RequestAuthenticationType,
    res: Response,
    next: NextFunction
  ) => {
    const { userId, id } = req.params;
    const isAdminUser = req.isAdmin || false;
    const currentUserId = req.userId || 0;

    try {
      const userIdNumber = Number(userId);
      const postId = Number(id);
      const post = await postService.getPostByAuthorId(userIdNumber, postId);

      if (!post)
        return next(
          new HttpExceptionError(
            STATUS_CODE.NOT_FOUND,
            MESSAGES.ERRORS.POST.NOT_FOUND
          )
        );
      const isOwner = currentUserId === userIdNumber;

      if (!isOwner && !isAdminUser) {
        return next(
          new HttpExceptionError(
            STATUS_CODE.FORBIDDEN,
            MESSAGES.ERRORS.NO_PERMISSION
          )
        );
      }

      await postService.deleteUsersPostById(
        postId,
        currentUserId,
        isAdminUser,
        userIdNumber
      );
      return res
        .status(STATUS_CODE.NO_CONTENT)
        .json({ message: MESSAGES.SUCCESS.DELETE });
    } catch (error) {
      const { message } = toError(error);
      logger.error(message);

      next(new HttpExceptionError(STATUS_CODE.INTERNAL_SERVER_ERROR, message));
    }
  };
}

export const postController = new PostsController();
