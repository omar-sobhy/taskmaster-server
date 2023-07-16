import mongoose from 'mongoose';
import { beforeAll, afterAll } from '@jest/globals';

beforeAll(async () => {
  mongoose.set('strictQuery', false);

  await mongoose.connect('mongodb://mongodb:27017/taskmaster', {
    connectTimeoutMS: 1000,
  });
});

afterAll(async () => {
  await mongoose.disconnect();
});
