import { registerDecorator, ValidationOptions } from 'class-validator';
import { getTags } from '../../controllers/Tag.controllers';

export default function IsValidTagId(property: string, validationOptions?: ValidationOptions) {
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

        const tag = await getTags([value]);

        return tag.type === 'success';
      },
    });
  };
}
