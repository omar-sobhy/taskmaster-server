import mongoose from 'mongoose';
import { beforeAll, afterAll } from '@jest/globals';

beforeAll(async () => {
  mongoose.set('strictQuery', false);

  await mongoose.connect(`mongodb://localhost:${process.env.DB_PORT}/taskmaster`);
});

afterAll(async () => {
  await mongoose.disconnect();
});
