// libs
import { z } from "zod";

import { REQUIRED_MESSAGE, MESSAGES_VALIDATION } from "@/constants";

export const commentSchema = z.object({
  postId: z.any()
    .transform(val => Number(val))
    .refine(val => !isNaN(val), {
      message: MESSAGES_VALIDATION.INVALID_ID_NUMBER
    }),
  authorId: z.any()
    .transform(val => Number(val))
    .refine(val => !isNaN(val), {
      message: MESSAGES_VALIDATION.INVALID_AUTHOR_ID
    }),
  content: z.string().min(1, REQUIRED_MESSAGE("content")),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const createCommentSchema = commentSchema.omit({
  createdAt: true,
  updatedAt: true,
});

export const updateCommentSchema = commentSchema.partial().extend({
  id: z.any()
    .transform(val => Number(val))
    .refine(val => !isNaN(val), {
      message: MESSAGES_VALIDATION.INVALID_ID_NUMBER
    })
});
