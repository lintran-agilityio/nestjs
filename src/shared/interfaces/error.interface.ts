export type MockHandleErrorArgs = {
  ExceptionClass?: new (message?: string) => Error;
  defaultMessage?: string;
};
