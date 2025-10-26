// libs
import { Application } from 'express';

import { API_ENDPOINTS } from '@/constants';
import { userController } from '@/controllers';
import { userUpdateSchema, userSchema, usersUpdateSchema } from '@/validation';
import { validateRequest } from '@/middlewares/validate-request.middleware';

export const userRouter = (app: Application) => {
  /**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Get all users
 *     tags:
 *       - User Controller
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
  app.get(API_ENDPOINTS.USERS, userController.getAll);

  /**
   * @openapi
   * /api/v1/users/{userId}:
   *   get:
   *     summary: Get user by ID
   *     tags: [User Controller]
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: integer
   *         description: The user ID
   *     responses:
   *       200:
   *         description: User retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   *       404:
   *         description: User not found
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  app.get(API_ENDPOINTS.USER_BY_ID, validateRequest(userSchema, 'params'), userController.getUserById);

  /**
   * @openapi
   * /api/v1/users/{userId}:
   *   put:
   *     summary: Update user by ID
   *     tags: [User Controller]
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: integer
   *         description: The user ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               username:
   *                 type: string
   *                 example: newusername
   *               email:
   *                 type: string
   *                 example: newemail@gmail.com
   *     responses:
   *       200:
   *         description: User updated successfully
   *       400:
   *         description: Bad request
   *       404:
   *         description: User not found
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  app.put(API_ENDPOINTS.USER_BY_ID, validateRequest(userUpdateSchema, 'body'), userController.updateUserById);

  /**
   * @openapi
   * /api/v1/users:
   *   put:
   *     summary: Update multiple users
   *     tags: [User Controller]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: array
   *             items:
   *               type: object
   *               required: [userId]
   *               properties:
   *                 userId:
   *                   type: integer
   *                   example: 1
   *                 email:
   *                   type: string
   *                   example: newemail@example.com
   *                 username:
   *                   type: string
   *                   example: newusername
   *                 isAdmin:
   *                   type: boolean
   *                   example: true
   *     responses:
   *       200:
   *         description: Updated user records
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/User'
   *       400:
   *         description: Bad request
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  app.put(API_ENDPOINTS.USERS, validateRequest(usersUpdateSchema, 'body'), userController.updateUsers);

  /**
   * @openapi
   * /api/v1/users:
   *   delete:
   *     summary: Delete multiple users
   *     tags: [User Controller]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               userIds:
   *                 type: array
   *                 items:
   *                   type: integer
   *                 example: [1, 2, 3]
   *     responses:
   *       200:
   *         description: Users deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Users deleted successfully
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  app.delete(API_ENDPOINTS.USERS, userController.deleteUsers);

  /**
   * @openapi
   * /api/v1/users/{userId}:
   *   delete:
   *     summary: Delete user by ID
   *     tags: [User Controller]
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: integer
   *         description: The user ID
   *     responses:
   *       200:
   *         description: User deleted successfully
   *       404:
   *         description: User not found
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  app.delete(API_ENDPOINTS.USER_BY_ID, userController.deleteUserById)
};
