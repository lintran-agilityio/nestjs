// libs
import { Application } from 'express';

import { API_ENDPOINTS } from '@/constants';
import { authenticationController } from '@/controllers';
import { validateRequest } from '@/middlewares/validate-request.middleware';
import { registerSchema, loginSchema } from '@/validation';

export const authenticationRouter = (app: Application) => {
	/**
	 * @openapi
	 * /api/v1/auth/register:
	 *   post:
	 *     summary: Register to application - User register
	 *     tags: [Authentication Controller]
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             type: object
	 *             required:
	 *               - email
	 *               - password
	 *               - username
	 *             properties:
	 *               username:
	 *                 type: string
	 *                 example: abc
	 *               email:
	 *                 type: string
	 *                 example: test@gmail.com
	 *               password:
	 *                 type: string
	 *                 example: Strong@12345
	 *     responses:
	 *       201:
	 *         description: User registered successfully
	 *       400:
	 *         description: Bad request
	 *       404:
	 *         description: Not found
	 *       500:
	 *         description: Server error
	 */
	app.post(API_ENDPOINTS.REGISTER, validateRequest(registerSchema, 'body'), authenticationController.register);

	/**
	 * @openapi
	 * /api/v1/auth/login:
	 *   post:
	 *     summary: User Login
	 *     tags: [Authentication Controller]
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             type: object
	 *             required:
	 *               - email
	 *               - password
	 *             properties:
	 *               email:
	 *                 type: string
	 *                 example: test@gmail.com
	 *               password:
	 *                 type: string
	 *                 example: Strong@12345
	 *     responses:
	 *       200:
	 *         description: User logged successfully
	 *       401:
	 *         description: Invalid credentials
	 *       400:
	 *         description: Bad request
	 *       404:
	 *         description: Not found
	 *       500:
	 *         description: Server error
	 */
	app.post(API_ENDPOINTS.LOGIN, validateRequest(loginSchema, 'body'), authenticationController.login);
};
