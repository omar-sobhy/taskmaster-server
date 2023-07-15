import mongoose from 'mongoose';
import { beforeAll, afterAll } from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Server } from 'http';
import { promisify } from 'util';
import start from '../server';

// eslint-disable-next-line @typescript-eslint/naming-convention
let mongod: MongoMemoryServer;
let server: Server;

beforeAll(async () => {
  mongoose.set('strictQuery', false);

  const startResult = await start({ testing: true });

  if (!startResult) {
    throw new Error('Could not start server for testing. Exiting...');
  }

  server = startResult.httpServer;

  process.env.__TASKMASTER_PORT__ = String((server.address() as { port: number }).port);

  mongod = await MongoMemoryServer.create();

  await mongod.ensureInstance();

  const uri = mongod.getUri();

  await mongoose.connect(uri, {
    dbName: `taskmaster-${crypto.randomUUID()}`,
  });
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await mongod.stop();
  await promisify(server.close.bind(server))();
});
