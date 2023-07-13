import { mongo } from 'mongoose';

declare global {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const __MONGOD__: mongo;
}
