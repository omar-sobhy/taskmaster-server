import { registerDecorator, ValidationOptions } from 'class-validator';
import { getTask } from '../../controllers/Task.controllers';

export default function IsValidTaskId(property: string, validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isValidTaskId',
      target: object.constructor,
      propertyName,
      constraints: [property],
      options: validationOptions,
      async validator(value: unknown) {
        if (typeof value !== 'string') {
          return false;
        }

        const task = await getTask(value);

        if (task.type === 'error') {
          return false;
        }

        return true;
      },
    });
  };
}
