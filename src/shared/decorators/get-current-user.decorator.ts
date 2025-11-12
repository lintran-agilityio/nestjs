import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

// Get current users
export const GetCurrentUser = createParamDecorator(
  (field: string | undefined, ctx: ExecutionContext) => {
    type RequestWithUser = Request & { user?: Record<string, unknown> };
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const userRequest = request.user;

    return field ? userRequest?.[field] : userRequest;
  },
);
