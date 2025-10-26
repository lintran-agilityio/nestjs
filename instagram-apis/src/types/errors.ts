export interface IError {
  message: string;
  errorCode: number;
};

export interface IValidationError {
  field: string;
  message: string;
};

export interface IErrorMessages {
  message: string;
  status: number;
};

export interface IErrorWithStatus extends Error {
  statusCode: number;
};
