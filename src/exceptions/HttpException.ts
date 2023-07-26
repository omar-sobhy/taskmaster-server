type PropsErrors = { property: string }[];

class HttpException extends Error {
  status: number;

  message: string;

  propsErrors?: PropsErrors;

  constructor(status: number, message: string, propsErrors?: PropsErrors) {
    super(message);
    this.status = status;
    this.message = message;
    this.propsErrors = propsErrors;
  }
}

export default HttpException;
