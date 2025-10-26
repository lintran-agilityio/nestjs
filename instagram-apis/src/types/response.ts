// libs
import { Response, Request } from 'express';

type MessageType = {
  code: number,
  message: string;
};

export type ResponseSuccessType = {
  res: Response,
  message: MessageType,
  data: null|any
};

export type ResponseErrorType = {
  error: MessageType,
  response: Response
};

export interface RequestAuthenticationType extends Request {
  userId?: number;
  isAdmin?: boolean;
};
