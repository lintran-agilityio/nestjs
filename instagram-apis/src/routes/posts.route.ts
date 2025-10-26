// libs
import { Application, NextFunction } from 'express';

import { API_ENDPOINTS } from '@/constants';
import { postController } from '@/controllers';
import { validateToken, validateRequest } from '@/middlewares';
import { createPostSchema, updatePostSchema } from '@/validation';
import { RequestAuthenticationType } from '@/types';

export const postsRouter = (app: Application) => {
  /**
   * @openapi
   * /api/v1/posts:
   *   get:
   *     summary: Get all posts with pagination
   *     description: Retrieve a paginated list of all posts. Requires authentication.
   *     tags: [Posts Controller]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 10
   *         description: Number of posts to return per page
   *         example: 10
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *           minimum: 0
   *           default: 0
   *         description: Number of posts to skip for pagination
   *         example: 0
   *     responses:
   *       200:
   *         description: Posts retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     posts:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/Post'
   *                     pagination:
   *                       $ref: '#/components/schemas/PaginationMeta'
   *             example:
   *               data:
   *                 posts:
   *                   - id: 1
   *                     title: "Getting Started with Node.js"
   *                     slug: "getting-started-with-nodejs"
   *                     content: "This is a comprehensive guide to getting started with Node.js development..."
   *                     authorId: 1
   *                     status: "published"
   *                     createdAt: "2024-01-15T10:30:00Z"
   *                     updatedAt: "2024-01-15T10:30:00Z"
   *                     publishedAt: "2024-01-15T10:30:00Z"
   *                   - id: 2
   *                     title: "Advanced TypeScript Tips"
   *                     slug: "advanced-typescript-tips"
   *                     content: "Learn advanced TypeScript techniques that will improve your code quality..."
   *                     authorId: 2
   *                     status: "draft"
   *                     createdAt: "2024-01-16T14:20:00Z"
   *                     updatedAt: "2024-01-16T14:20:00Z"
   *                     publishedAt: null
   *                 pagination:
   *                   total: 25
   *                   limit: 10
   *                   offset: 0
   *                   page: 1
   *                   totalPages: 3
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  app.get(API_ENDPOINTS.POSTS, validateToken(), postController.getAll);

  /**
   * @openapi
   * /api/v1/posts/{id}:
   *   get:
   *     summary: Get post by ID
   *     description: Retrieve a paginated list of all posts. Requires authentication.
   *     tags: [Posts Controller]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: The post ID
   *     responses:
   *       200:
   *         description: Post retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: integer
   *                   example: 1
   *                 slug:
   *                   type: string
   *                   example: getting-started-with-nodejs
   *                 content:
   *                   type: string
   *                   example: "This is a comprehensive guide to getting started with Node.js development..."
   *                 authorId:
   *                   type: integer
   *                   example: 1
   *                 createdAt:
   *                   type: date
   *                   example: "2024-01-17T09:15:00Z"
   *                 updatedAt:
   *                   type: date
   *                   example: "2024-01-17T09:15:00Z"
   *                 publishedAt:
   *                   type: date
   *                   example: "2024-01-17T09:15:00Z"
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  app.get(
    API_ENDPOINTS.POST_BY_ID,
    validateToken(),
    postController.getPostById
  );

  /**
   * @openapi
   * /api/v1/posts:
   *   post:
   *     summary: Create a new post
   *     description: Create a new post by the authenticated user. Requires authentication and valid post data.
   *     tags: [Posts Controller]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - title
   *               - slug
   *               - content
   *               - authorId
   *               - status
   *             properties:
   *               title:
   *                 type: string
   *                 minLength: 1
   *                 maxLength: 255
   *                 description: The title of the post
   *                 example: "Getting Started with Node.js"
   *               slug:
   *                 type: string
   *                 minLength: 1
   *                 maxLength: 255
   *                 pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$"
   *                 description: URL-friendly version of the title (must be unique)
   *                 example: "getting-started-with-nodejs"
   *               content:
   *                 type: string
   *                 minLength: 1
   *                 description: The main content of the post
   *                 example: "This is a comprehensive guide to getting started with Node.js development. In this post, we'll cover the basics..."
   *               authorId:
   *                 type: integer
   *                 minimum: 1
   *                 description: ID of the user creating the post
   *                 example: 1
   *               status:
   *                 type: string
   *                 enum: [draft, published, stored]
   *                 description: The publication status of the post
   *                 example: "draft"
   *           example:
   *             title: "Getting Started with Node.js"
   *             slug: "getting-started-with-nodejs"
   *             content: "This is a comprehensive guide to getting started with Node.js development. In this post, we'll cover the basics of setting up your development environment, understanding the event loop, and building your first HTTP server."
   *             authorId: 1
   *             status: "draft"
   *     responses:
   *       201:
   *         description: Post created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   $ref: '#/components/schemas/Post'
   *             example:
   *               data:
   *                 id: 3
   *                 title: "Getting Started with Node.js"
   *                 slug: "getting-started-with-nodejs"
   *                 content: "This is a comprehensive guide to getting started with Node.js development..."
   *                 authorId: 1
   *                 status: "draft"
   *                 createdAt: "2024-01-17T09:15:00Z"
   *                 updatedAt: "2024-01-17T09:15:00Z"
   *                 publishedAt: null
   *       400:
   *         description: Bad Request - Invalid input data
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             examples:
   *               validation_error:
   *                 summary: Validation error
   *                 value:
   *                   success: false
   *                   message: "Validation failed"
   *                   error: "title is required"
   *               duplicate_slug:
   *                 summary: Duplicate slug error
   *                 value:
   *                   success: false
   *                   message: "Slug must be unique"
   *                   error: "A post with this slug already exists"
   *               user_not_found:
   *                 summary: Author not found error
   *                 value:
   *                   success: false
   *                   message: "Author not found"
   *                   error: "The specified author ID does not exist"
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  app.post(
    API_ENDPOINTS.POSTS,
    validateToken(),
    validateRequest(createPostSchema, 'body'),
    postController.createPostByUser
  );

  /**
   * @openapi
   * /api/v1/users/{userId}/posts/{id}:
   *   put:
   *     summary: Update a Post of User by ID
   *     description: Update a post by Id of User include the authenticated user. Requires authentication and valid post data.
   *     tags: [Posts Controller]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - title
   *               - slug
   *               - content
   *               - authorId
   *               - status
   *             properties:
   *               title:
   *                 type: string
   *                 minLength: 1
   *                 maxLength: 255
   *                 description: The title of the post
   *                 example: "Getting Started with Node.js"
   *               slug:
   *                 type: string
   *                 minLength: 1
   *                 maxLength: 255
   *                 pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$"
   *                 description: URL-friendly version of the title (must be unique)
   *                 example: "getting-started-with-nodejs"
   *               content:
   *                 type: string
   *                 minLength: 1
   *                 description: The main content of the post
   *                 example: "This is a comprehensive guide to getting started with Node.js development. In this post, we'll cover the basics..."
   *               authorId:
   *                 type: integer
   *                 minimum: 1
   *                 description: ID of the user creating the post
   *                 example: 1
   *               status:
   *                 type: string
   *                 enum: [draft, published, stored]
   *                 description: The publication status of the post
   *                 example: "draft"
   *           example:
   *             title: "Getting Started with Node.js"
   *             slug: "getting-started-with-nodejs"
   *             content: "This is a comprehensive guide to getting started with Node.js development. In this post, we'll cover the basics of setting up your development environment, understanding the event loop, and building your first HTTP server."
   *             authorId: 1
   *             status: "draft"
   *     responses:
   *       201:
   *         description: Post created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   $ref: '#/components/schemas/Post'
   *             example:
   *               data:
   *                 id: 3
   *                 title: "Getting Started with Node.js"
   *                 slug: "getting-started-with-nodejs"
   *                 content: "This is a comprehensive guide to getting started with Node.js development..."
   *                 authorId: 1
   *                 status: "draft"
   *                 createdAt: "2024-01-17T09:15:00Z"
   *                 updatedAt: "2024-01-17T09:15:00Z"
   *                 publishedAt: null
   *       400:
   *         description: Bad Request - Invalid input data
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             examples:
   *               validation_error:
   *                 summary: Validation error
   *                 value:
   *                   success: false
   *                   message: "Validation failed"
   *                   error: "title is required"
   *               duplicate_slug:
   *                 summary: Duplicate slug error
   *                 value:
   *                   success: false
   *                   message: "Slug must be unique"
   *                   error: "A post with this slug already exists"
   *               user_not_found:
   *                 summary: Author not found error
   *                 value:
   *                   success: false
   *                   message: "Author not found"
   *                   error: "The specified author ID does not exist"
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  app.put(
    API_ENDPOINTS.USERS_POST_ID,
    validateToken(),
    validateRequest(updatePostSchema, 'body'),
    postController.putUsersPostById
  );

  /**
   * @openapi
   * /api/v1/posts:
   *   delete:
   *     summary: Delete all posts by admin user
   *     description: Deletes all posts. Requires admin authentication.
   *     tags:
   *       - Posts Controller
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Posts deleted successfully
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - Admin access required
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  app.delete(
    API_ENDPOINTS.POSTS,
    validateToken(true),
    postController.deletePosts
  );

  /**
   * @openapi
   * /api/v1/users/{userId}/posts/{id}:
   *   delete:
   *     summary: Delete users posts by post ID
   *     tags: [Posts Controller]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: integer
   *         description: The user ID
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: The post ID
   *     responses:
   *       200:
   *         description: User deleted successfully
   *       404:
   *         description: User not found
   *       403:
   *         description: No permistion
   *       500:
   *         description: Internal server error
   */
  app.delete(
    API_ENDPOINTS.USERS_POST_ID,
    validateToken(),
    (req: RequestAuthenticationType, res, next: NextFunction) =>
      postController.deleteUsersPostById(req, res, next)
  );
};
