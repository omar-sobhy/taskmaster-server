import { ValidationArguments, registerDecorator } from 'class-validator';

export default function IsValidRgbString() {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidRgbString',
      target: object.constructor,
      propertyName,
      options: {
        message: '$value is an invalid colour string',
      },
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') {
            return false;
          }

          return /#(\d|[a-fA-f]){6}/.test(value);
        },
      },
    });
  };
}
