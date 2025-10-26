class HttpExceptionError extends Error  {

  status: number;
  message: string;

  constructor(statusCode: number, message: string) {
    super(message);
    this.status = statusCode;
    this.message = message;
  }
}

export default HttpExceptionError;