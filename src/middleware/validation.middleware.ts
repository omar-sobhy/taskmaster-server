import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import * as express from 'express';

interface Constraints {
  property: string;
  constraints: {
    [type: string]: string;
  };
}

function getConstraints(error: ValidationError, parents: string[] = []): Constraints[] {
  if (!error.children || error.children.length === 0) {
    return [
      {
        property: [...parents, error.property].join('.'),
        constraints: error.constraints!,
      },
    ];
  }

  // eslint-disable-next-line arrow-body-style
  const childConstraints = error.children.map((c) => {
    return getConstraints(c, [...parents, error.property]);
  });

  return childConstraints.flat();
}

function validationMiddleware<T>(type: ClassConstructor<T>): express.RequestHandler {
  return (req, res, next) => {
    validate(plainToInstance(type, req.body) as unknown as object).then(
      (errors: ValidationError[]) => {
        if (errors.length > 0) {
          const allConstraints = errors.flatMap((e) => getConstraints(e));

          const message = allConstraints
            .map((c) => Object.values(c.constraints).join('\n'))
            .join('\n');

          const propsErrors = allConstraints.map((c) => ({
            property: c.property,
            constraints: Object.keys(c.constraints),
          }));

          res
            .status(403)
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
