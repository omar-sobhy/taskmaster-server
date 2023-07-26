import { ValidationArguments, registerDecorator } from 'class-validator';
import { isValid, parse, parseISO } from 'date-fns';

export default function IsValidDateString(long = false) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidDateString',
      target: object.constructor,
      propertyName,
      options: {
        message: '$value is an invalid Date String',
      },
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') {
            return false;
          }

          if (long) {
            const date = parseISO(value);

            return !Number.isNaN(Number(date));
          }

          const data = value.split('-');

          if (data.length !== 3) {
            return false;
          }

          const [year, month, day] = data;
          if (!/\d\d/.test(day)) {
            return false;
          }

          if (!/\d\d/.test(month)) {
            return false;
          }

          if (!/(\d){4}/.test(year)) {
            return false;
          }

          return true;
        },
      },
    });
  };
}
