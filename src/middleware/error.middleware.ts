import { NextFunction, Request, Response } from 'express';
import HttpException from '../exceptions/HttpException';
import InsufficientPermissionsException from '../exceptions/permissions/InsufficientPermissionsException';
import RequestWithUser from '../interfaces/RequestWithUser.interface';

function errorMiddleware(
  error: HttpException,
  _request: Request,
  response: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
) {
  if (error instanceof InsufficientPermissionsException) {
    // TODO use req.logger when pino is used
    const { user } = _request as RequestWithUser;

    const { entities } = error;

    const message = entities.map((e) => e._id.toString()).join(', ');

    console.log(
      `User '${user._id}' tried to access resources ${message} with insufficient permission.`,
    );

    response
      .status(404)
      .json({ error: { message: error.message } })
      .end();

    return;
  }

  const status = error.status || 500;
  const message = error.message || 'Something went wrong';
  response
    .status(status)
    .json({
      error: {
        message,
      },
    })
    .end();
}

export default errorMiddleware;
