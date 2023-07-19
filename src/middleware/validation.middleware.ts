import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import * as express from 'express';

function validationMiddleware<T>(type: ClassConstructor<T>): express.RequestHandler {
  return (req, res, next) => {
    validate(plainToInstance(type, req.body) as unknown as object).then(
      (errors: ValidationError[]) => {
        if (errors.length > 0) {
          const message = errors
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            .map((error: ValidationError) => Object.values(error.constraints!))
            .join('\n');

          const propsErrors = errors.map((error) => {
            const constraints = Object.keys(error.constraints!);

            return {
              property: error.property,
              constraints,
            };
          });

          res
            .status(400)
            .json({
              error: {
                message,
                propsErrors,
              },
            })
            .end();
        } else {
          next();
        }
      },
    );
  };
}

export default validationMiddleware;
