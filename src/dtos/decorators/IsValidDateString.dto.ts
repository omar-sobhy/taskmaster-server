import {
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from "class-validator";

export function IsValidDateString() {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: "isValidDateString",
      target: object.constructor,
      propertyName,
      options: {
        message: "$value is an invalid Date String",
      },
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== "string") {
            return false;
          }

          const data = value.split("-");

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
