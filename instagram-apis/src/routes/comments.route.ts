// libs
import { Application } from 'express';

import { API_ENDPOINTS } from '@/constants';
import { commentController } from '@/controllers';
import { createCommentSchema } from '@/validation';
import { validateToken, validateRequest } from '@/middlewares';

export const commentsRouter = (app: Application) => {
  /**
   * @openapi
   * /api/v1/posts/{postId}/comments:
   *   get:
   *     summary: Get all comments for a post
   *     tags: [Comments]
   *     parameters:
   *       - in: path
   *         name: postId
   *         schema:
   *           type: integer
   *         required: true
   *         description: ID of the post
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *         description: Number of comments to return
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *         description: Pagination offset
   *     responses:
   *       200:
   *         description: List of comments
   *         content:
   *           application/json:
   *             example:
   *               count: 2
   *               comments:
   *                 - id: 1
   *                   content: "Great post!"
   *                   post:
   *                     id: 3
   *                     title: "My Post"
   *                     author:
   *                       userId: 2
   *                       username: "abc"
   *                 - id: 2
   *                   content: "Very helpful"
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  app.get(
    API_ENDPOINTS.POST_COMMENTS,
    validateToken(),
    commentController.getPostsComment
  );

  /**
   * @openapi
   * /api/v1/posts/{postId}/comments/{commentId}:
   *   get:
   *     summary: Get a specific comment in a post
   *     tags: [Comments]
   *     parameters:
   *       - in: path
   *         name: postId
   *         schema:
   *           type: integer
   *         required: true
   *         description: ID of the post
   *       - in: path
   *         name: commentId
   *         schema:
   *           type: integer
   *         required: true
   *         description: ID of the comment
   *     responses:
   *       200:
   *         description: Found the comment
   *         content:
   *           application/json:
   *             example:
   *               comment:
   *                 id: 3
   *                 content: "Nice post!"
   *                 post:
   *                   id: 1
   *                   title: "My First Post"
   *                   author:
   *                     userId: 2
   *                     username: "abc"
   *                     email: "abc@example.com"
   *       404:
   *         description: Comment not found
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  app.get(
    API_ENDPOINTS.POST_COMMENT_BY_ID,
    validateToken(),
    commentController.getPostsCommentById
  );

  /**
   * @openapi
   * /api/v1/posts/{id}/comments:
   *   post:
   *     summary: Create a new comment on a post
   *     description: Authenticated user creates a comment under a specific post.
   *     tags: [Comments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: integer
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - content
   *             properties:
   *               content:
   *                 type: string
   *     responses:
   *       201:
   *         description: Comment created successfully
   *       404:
   *         description: Post not found
   *       400:
   *         description: Validation error
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  app.post(
    API_ENDPOINTS.POST_COMMENTS,
    validateToken(),
    validateRequest(createCommentSchema, 'body'),
    commentController.postPostsComments
  );

  /**
   * @openapi
   * /api/v1/posts/{id}/comments:
   *   delete:
   *     summary: Delete all comments of a post
   *     tags: [Comments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Comments deleted successfully
   *         content:
   *           application/json:
   *             example:
   *               message: Deleted 5 comment(s) for post 3
   *       404:
   *         description: Post not found
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  app.delete(
    API_ENDPOINTS.POST_COMMENTS,
    validateToken(),
    commentController.deletePostsComments
  );

  /**
   * @openapi
   * /api/v1/posts/{postId}/comments/{commentId}:
   *   delete:
   *     summary: Delete a specific comment in a post
   *     tags: [Comments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: postId
   *         in: path
   *         required: true
   *         schema:
   *           type: integer
   *       - name: commentId
   *         in: path
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Comment deleted successfully
   *         content:
   *           application/json:
   *             example:
   *               message: Comment 4 deleted from post 2
   *       404:
   *         description: Comment not found
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  app.delete(
    API_ENDPOINTS.POST_COMMENT_BY_ID,
    validateToken(),
    commentController.deletePostsCommentById
  );
};
