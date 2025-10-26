// libs
import { z } from "zod";

import { REQUIRED_MESSAGE, MESSAGES_VALIDATION } from "@/constants";

export const postSchema = z.object({
  title: z.string().min(1, REQUIRED_MESSAGE("title")),
  slug: z.string().min(1, REQUIRED_MESSAGE("slug")),
  content: z.string().min(1, REQUIRED_MESSAGE("content")),
  authorId: z.any()
    .transform(val => Number(val))
    .refine(val => !isNaN(val), {
      message: MESSAGES_VALIDATION.INVALID_ID_NUMBER
    }),
  status: z.enum(['draft', 'published', 'stored']),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  publishedAt: z.coerce.date(),
});

export const createPostSchema = postSchema.omit({
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
});

export const updatePostSchema = postSchema.partial().extend({
  id: z.any()
    .transform((val) => Number(val))
    .refine(val => !isNaN(val), {
      message: MESSAGES_VALIDATION.INVALID_ID_NUMBER
    })
})
