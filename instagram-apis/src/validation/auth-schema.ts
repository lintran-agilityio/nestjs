// libs
import { email, z } from "zod";

import { MESSAGES_VALIDATION, REGEX } from "@/constants";

export const loginSchema = z.object({
  email: z.string().transform(String).pipe(z.email({ message: 'Invalid email' })),
	password: z
		.string()
		.regex(REGEX.PASSWORD, {
			message: MESSAGES_VALIDATION.PASSWORD_INVALID
		})
});

export const registerSchema = loginSchema.partial().extend({
  username: z
		.string()
		.regex(REGEX.NAME, {
			message: MESSAGES_VALIDATION.REQUIRED
		})
});
