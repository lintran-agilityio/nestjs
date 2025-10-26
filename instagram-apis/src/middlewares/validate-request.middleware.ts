import { STATUS_CODE } from "@/constants";
import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

/**
 * Middleware to validate request data using Zod schema
 * @param schema - Zod schema for validation
 * @param field - Request field to validate (defaults to 'body')
 * @returns Express middleware function that validates request data
 */
export const validateRequest = (schema: ZodSchema, field = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse((req as any)[field]);
    if (!result.success) {
      const formattedErrors = result.error.flatten().fieldErrors as Record<string, string[]>;
      let customErrors: Record<string, string> = {};
  
      for (const key in formattedErrors) {
        const errorFormattedItem = formattedErrors[key];
        if (errorFormattedItem?.length) {
          customErrors[key] = errorFormattedItem[0];
        }
      }
      
      return res.status(STATUS_CODE.BAD_REQUEST).json({ errors: customErrors });;
    }
  
    next();
  }
};
