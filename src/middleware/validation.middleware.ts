import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import * as express from 'express';
import HttpException from '../exceptions/HttpException';

function validationMiddleware<T>(type: ClassConstructor<T>): express.RequestHandler {
  return (req, res, next) => {
    validate(plainToInstance(type, req.body) as unknown as object)
      .then((errors: ValidationError[]) => {
        if (errors.length > 0) {
          const message = errors
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            .map((error: ValidationError) => Object.values(error.constraints!))
            .join('\n');

          res.json({
            error: {
              message,
            },
          }).end();
        } else {
          next();
        }
      });
  };
}

export default validationMiddleware;
