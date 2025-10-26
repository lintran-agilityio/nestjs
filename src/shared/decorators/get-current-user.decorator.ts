import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Get current users
export const GetCurrentUser = createParamDecorator(
  (field: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    return field ? request.user?.[field] : request.user;
  },
);
